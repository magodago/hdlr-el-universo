/**
 * Reproductor unico de los fragmentos del catalogo.
 *
 * Tres vias, un solo estado, con respaldo automatico:
 *  1. el enlace de audio guardado (Apple Music), que suena en cualquier aparato;
 *  2. si falla, se pide el fragmento AL MOMENTO a Deezer por JSONP: la direccion
 *     se renueva en cada escucha, asi que no caduca nunca. Es la via de los
 *     cortes que no estan en Apple Music (volumenes 1, 2 y 3);
 *  3. solo si todo lo anterior falla, el VIDEO OFICIAL del corte en YouTube.
 *
 * La ventana de video no aparece en el uso normal: es la ultima red.
 *
 * En toda la aplicacion suena un corte a la vez: al arrancar uno, el anterior
 * se para. Asi nunca suenan dos cosas juntas, ni siquiera en una lista con un
 * boton por corte. Nada suena hasta que la persona pulsa un boton.
 */

export interface PreviewState {
  /** Corte que esta sonando o en pausa, o null si no hay ninguno. */
  clave: string | null;
  sonando: boolean;
  /** Progreso de 0 a 1 sobre los 30 segundos del fragmento. */
  progreso: number;
}

/** Lo que el catalogo sabe de un corte: audio de tienda y video oficial. */
export interface FuentePreview {
  url?: string;
  /** Identificador del corte en Deezer, para pedirle el fragmento al momento. */
  deezerId?: string;
  youtube?: string;
  fuente?: string;
}

export interface Opciones {
  /** El fragmento se repite sin parar (banda sonora de la entrada). */
  bucle?: boolean;
}

type Oyente = (estado: PreviewState) => void;

const SEGUNDOS = 30;
const SIN_REPRODUCCION: PreviewState = { clave: null, sonando: false, progreso: 0 };

let estado: PreviewState = SIN_REPRODUCCION;
let claveIntencionada: string | null = null;
let fuenteActual: FuentePreview | null = null;
let opcionesActual: Opciones = {};
const oyentes = new Set<Oyente>();

function anuncia(cambio: Partial<PreviewState>): void {
  estado = { ...estado, ...cambio };
  for (const oyente of oyentes) oyente(estado);
}

function limpia(clave: string | null = null): void {
  claveIntencionada = null;
  fuenteActual = null;
  anuncia({ clave, sonando: false, progreso: 0 });
}

/* ------------------------------------------------------------------ */
/* Via 1: audio de tienda                                              */
/* ------------------------------------------------------------------ */

let audio: HTMLAudioElement | null = null;
let audioBucle = false;

function duracion(nodo: HTMLAudioElement): number {
  return Number.isFinite(nodo.duration) && nodo.duration > 0
    ? Math.min(nodo.duration, SEGUNDOS)
    : SEGUNDOS;
}

function elemento(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (audio) return audio;

  const nodo = new Audio();
  nodo.preload = 'none';
  nodo.volume = 0.6;
  nodo.addEventListener('timeupdate', () => {
    anuncia({ progreso: Math.min(1, nodo.currentTime / duracion(nodo)) });
  });
  nodo.addEventListener('play', () => anuncia({ clave: claveIntencionada, sonando: true }));
  nodo.addEventListener('pause', () => anuncia({ sonando: false }));
  nodo.addEventListener('ended', () => {
    if (audioBucle) {
      void nodo.play().catch(() => undefined);
      return;
    }
    limpia();
  });
  nodo.addEventListener('error', () => {
    // El codigo 1 es una carga abortada al cambiar de pista: no es un fallo real.
    if (nodo.error && nodo.error.code === 1) return;
    // Si el fragmento se cae, se reintenta por las vias de audio (Deezer al
    // momento). A media escucha NO se abre la ventana de video: eso solo pasa
    // al arrancar un corte, nunca por sorpresa.
    const fuente = fuenteActual;
    const clave = claveIntencionada;
    if (!fuente || !clave) {
      limpia();
      return;
    }
    void arrancaCadena(clave, fuente, opcionesActual.bucle === true, false);
  });

  audio = nodo;
  return audio;
}

/* ------------------------------------------------------------------ */
/* Via 1b: el fragmento se pide al momento a Deezer (JSONP)            */
/* ------------------------------------------------------------------ */

/**
 * Deezer no deja leer su API desde otra web (bloquea CORS), pero si permite
 * JSONP: se le pide el corte con un <script> y el navegador ejecuta la
 * respuesta como codigo. Asi la direccion del fragmento llega recien firmada y
 * nunca esta caducada, que era el fallo de antes. Se guarda diez minutos.
 */
const cacheDeezer = new Map<string, { url: string; hasta: number }>();
let contadorJsonp = 0;

function resolverDeezer(id: string): Promise<string | null> {
  const guardado = cacheDeezer.get(id);
  if (guardado && guardado.hasta > Date.now()) return Promise.resolve(guardado.url);
  return new Promise((resolver) => {
    const nombre = `__hdlr_preview_${++contadorJsonp}`;
    const guion = document.createElement('script');
    let cerrado = false;
    const terminar = (url: string | null) => {
      if (cerrado) return;
      cerrado = true;
      window.clearTimeout(reloj);
      guion.remove();
      try {
        delete (window as unknown as Record<string, unknown>)[nombre];
      } catch {
        (window as unknown as Record<string, unknown>)[nombre] = undefined;
      }
      resolver(url);
    };
    const reloj = window.setTimeout(() => terminar(null), 6000);
    (window as unknown as Record<string, unknown>)[nombre] = (datos: unknown) => {
      const previo =
        datos && typeof datos === 'object' ? (datos as { preview?: unknown }).preview : undefined;
      const url = typeof previo === 'string' && previo ? previo : null;
      if (url) cacheDeezer.set(id, { url, hasta: Date.now() + 10 * 60 * 1000 });
      terminar(url);
    };
    guion.src = `https://api.deezer.com/track/${encodeURIComponent(id)}?output=jsonp&callback=${nombre}`;
    guion.onerror = () => terminar(null);
    document.head.appendChild(guion);
  });
}

/** Intenta que suene una direccion concreta. Devuelve si lo ha conseguido. */
function suena(url: string, clave: string, bucle: boolean): Promise<boolean> {
  const nodo = elemento();
  if (!nodo) return Promise.resolve(false);
  nodo.loop = bucle;
  audioBucle = bucle;
  nodo.src = url;
  nodo.currentTime = 0;
  anuncia({ clave, sonando: false, progreso: 0 });
  return nodo
    .play()
    .then(() => true)
    .catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return true;
      return false;
    });
}

/** Cadena completa: enlace guardado, luego Deezer al momento, luego video. */
async function arrancaCadena(
  clave: string,
  fuente: FuentePreview,
  bucle: boolean,
  permiteVideo = true,
): Promise<void> {
  if (fuente.url) {
    const conEnlace = await suena(fuente.url, clave, bucle);
    if (conEnlace || claveIntencionada !== clave) return;
  }
  if (fuente.deezerId) {
    const url = await resolverDeezer(fuente.deezerId);
    if (claveIntencionada !== clave) return;
    if (url) {
      const conDeezer = await suena(url, clave, bucle);
      if (conDeezer) return;
    }
  }
  if (claveIntencionada !== clave) return;
  if (fuente.youtube && permiteVideo) arrancaVideo(clave, fuente.youtube, bucle);
  else limpia();
}

/* ------------------------------------------------------------------ */
/* Via 2: video oficial de YouTube, en un iframe normal                */
/* ------------------------------------------------------------------ */

let ytCaja: HTMLDivElement | null = null;
let ytIframe: HTMLIFrameElement | null = null;
let ytClave: string | null = null;
let ytBucle = false;
let ytReloj: number | null = null;
let ytSegundos = 0;

function cajaVideo(): HTMLDivElement {
  if (ytCaja) return ytCaja;
  const caja = document.createElement('div');
  caja.className = 'vp-yt';
  caja.setAttribute('hidden', '');
  const marco = document.createElement('iframe');
  marco.setAttribute('allow', 'autoplay; encrypted-media');
  marco.setAttribute('title', 'Video oficial del corte');
  marco.setAttribute('frameborder', '0');
  caja.appendChild(marco);
  document.body.appendChild(caja);
  ytCaja = caja;
  ytIframe = marco;
  return caja;
}

function orden(funcion: string): void {
  const marco = ytIframe;
  if (!marco || !marco.contentWindow) return;
  marco.contentWindow.postMessage(
    JSON.stringify({ event: 'command', func: funcion, args: [] }),
    'https://www.youtube.com',
  );
}

function paraReloj(): void {
  if (ytReloj !== null) {
    window.clearInterval(ytReloj);
    ytReloj = null;
  }
}

function correReloj(): void {
  paraReloj();
  ytReloj = window.setInterval(() => {
    if (ytClave === null) return;
    ytSegundos += 0.25;
    anuncia({ clave: ytClave, sonando: true, progreso: Math.min(1, ytSegundos / SEGUNDOS) });
    if (!ytBucle && ytSegundos >= SEGUNDOS) {
      orden('pauseVideo');
      paraReloj();
      ytCaja?.setAttribute('hidden', '');
      limpia();
    }
  }, 250);
}

/** Arranca el video oficial. YouTube se encarga del resto. */
function arrancaVideo(clave: string, video: string, bucle: boolean): void {
  const caja = cajaVideo();
  const marco = ytIframe;
  if (!marco) return;

  ytClave = clave;
  ytBucle = bucle;
  ytSegundos = 0;

  const parametros = new URLSearchParams({
    autoplay: '1',
    enablejsapi: '1',
    controls: '0',
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
    loop: bucle ? '1' : '0',
    origin: window.location.origin,
  });
  if (bucle) parametros.set('playlist', video);

  // Se recarga el marco con el corte pedido: asi siempre empieza de cero.
  marco.src = `https://www.youtube.com/embed/${video}?${parametros.toString()}`;
  caja.removeAttribute('hidden');
  anuncia({ clave, sonando: true, progreso: 0 });
  correReloj();
}

function paraVideo(): void {
  paraReloj();
  orden('pauseVideo');
  ytClave = null;
  ytCaja?.setAttribute('hidden', '');
}

/* ------------------------------------------------------------------ */
/* API publica                                                         */
/* ------------------------------------------------------------------ */

/** Se apunta a los cambios de estado. Devuelve la funcion para desapuntarse. */
export function suscribir(oyente: Oyente): () => void {
  oyentes.add(oyente);
  oyente(estado);
  return () => {
    oyentes.delete(oyente);
  };
}

/** Para cualquier fragmento en curso (las dos vias). */
export function parar(): void {
  audioBucle = false;
  if (audio) {
    audio.pause();
    audio.loop = false;
  }
  paraVideo();
  limpia();
}

/** Para el fragmento solo si es el que esta sonando. Se usa al desmontar. */
export function detenerSi(clave: string): void {
  if (estado.clave === clave) parar();
}

/**
 * Alterna el fragmento de un corte. Antes para el que estuviera sonando.
 * Intenta el audio de tienda y, si su enlace esta caido, el video oficial.
 */
export function alternar(clave: string, fuente: FuentePreview, opciones: Opciones = {}): void {
  const bucle = opciones.bucle === true;

  // Mismo corte: se pausa o se reanuda.
  if (estado.clave === clave) {
    if (estado.sonando) {
      if (ytClave === clave) {
        paraVideo();
      } else {
        audio?.pause();
      }
      anuncia({ sonando: false });
      return;
    }
    if (ytClave === clave) {
      ytCaja?.removeAttribute('hidden');
      orden('playVideo');
      correReloj();
      anuncia({ sonando: true });
      return;
    }
    if (audio && audio.src) {
      audioBucle = bucle;
      audio.loop = bucle;
      void audio.play().catch(() => anuncia({ sonando: false }));
      return;
    }
  }

  // Otro corte: se para todo y arranca el nuevo.
  audioBucle = false;
  if (audio) {
    audio.pause();
    audio.loop = false;
  }
  paraVideo();

  fuenteActual = fuente;
  opcionesActual = opciones;
  claveIntencionada = clave;

  void arrancaCadena(clave, fuente, bucle);
}
