/**
 * Reproductor unico de los fragmentos de 30 segundos cortesia de Deezer.
 *
 * En toda la aplicacion existe un solo elemento de audio: al arrancar un
 * fragmento, el anterior se para. Asi nunca suenan dos cortes a la vez, ni
 * siquiera en una lista con un boton por corte.
 *
 * Los componentes se suscriben para pintar el estado (que corte suena y por
 * donde va). Nada suena hasta que la persona pulsa un boton.
 */

export interface PreviewState {
  /** Corte que esta sonando o en pausa, o null si no hay ninguno. */
  clave: string | null;
  sonando: boolean;
  /** Progreso de 0 a 1 sobre los 30 segundos del fragmento. */
  progreso: number;
}

type Oyente = (estado: PreviewState) => void;

const SIN_REPRODUCCION: PreviewState = { clave: null, sonando: false, progreso: 0 };

let audio: HTMLAudioElement | null = null;
let estado: PreviewState = SIN_REPRODUCCION;
/**
 * Corte que el elemento deberia estar tocando ahora mismo. Sirve para que un
 * rechazo tardio del fragmento anterior (carga abortada al cambiar de pista) no
 * borre el estado del corte que si esta sonando.
 */
let claveIntencionada: string | null = null;
const oyentes = new Set<Oyente>();

function anuncia(cambio: Partial<PreviewState>): void {
  estado = { ...estado, ...cambio };
  for (const oyente of oyentes) oyente(estado);
}

function duracion(nodo: HTMLAudioElement): number {
  return Number.isFinite(nodo.duration) && nodo.duration > 0 ? nodo.duration : 30;
}

function elemento(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (audio) return audio;

  const nodo = new Audio();
  nodo.preload = 'none';
  nodo.addEventListener('timeupdate', () => {
    anuncia({ progreso: Math.min(1, nodo.currentTime / duracion(nodo)) });
  });
  // Al arrancar de verdad se reafirma el corte pedido: asi el aviso de "esta
  // sonando" no se queda cojo por un evento de una pista anterior.
  nodo.addEventListener('play', () => anuncia({ clave: claveIntencionada, sonando: true }));
  nodo.addEventListener('pause', () => anuncia({ sonando: false }));
  nodo.addEventListener('ended', () => {
    claveIntencionada = null;
    anuncia({ clave: null, sonando: false, progreso: 0 });
  });
  nodo.addEventListener('error', () => {
    // El codigo 1 es una carga abortada al cambiar de pista: no es un fallo real.
    if (nodo.error && nodo.error.code === 1) return;
    claveIntencionada = null;
    anuncia({ clave: null, sonando: false, progreso: 0 });
  });

  audio = nodo;
  return audio;
}

/** Se apunta a los cambios de estado. Devuelve la funcion para desapuntarse. */
export function suscribir(oyente: Oyente): () => void {
  oyentes.add(oyente);
  oyente(estado);
  return () => {
    oyentes.delete(oyente);
  };
}

/** Para cualquier fragmento en curso. */
export function parar(): void {
  const nodo = elemento();
  if (!nodo) return;
  nodo.pause();
  claveIntencionada = null;
  anuncia({ clave: null, sonando: false, progreso: 0 });
}

/** Para el fragmento solo si es el que esta sonando. Se usa al desmontar. */
export function detenerSi(clave: string): void {
  if (estado.clave === clave) parar();
}

/** Alterna el fragmento de un corte. Antes para el que estuviera sonando. */
export function alternar(clave: string, url: string): void {
  const nodo = elemento();
  if (!nodo) return;

  if (estado.clave === clave) {
    if (nodo.paused) {
      void nodo.play().catch(() => anuncia({ sonando: false }));
    } else {
      nodo.pause();
    }
    return;
  }

  claveIntencionada = clave;
  nodo.pause();
  nodo.src = url;
  nodo.currentTime = 0;
  anuncia({ clave, sonando: false, progreso: 0 });
  void nodo.play().catch((error: unknown) => {
    // AbortError salta al interrumpir la carga (pausa o cambio de pista): no es
    // un fallo y no debe borrar el corte elegido. Solo un bloqueo real del
    // navegador deja el estado en limpio, sin dejar un boton marcado en falso.
    if (error instanceof DOMException && error.name === 'AbortError') return;
    if (claveIntencionada === clave) {
      claveIntencionada = null;
      anuncia({ clave: null, sonando: false, progreso: 0 });
    }
  });
}
