import { useCallback, useEffect, useRef, useState } from 'react';
import { trackEvent } from '../lib/trackEvent';
import '../styles/live.css';

/**
 * TU NOCHE: la tarjeta que se lleva quien sale del modo concierto.
 *
 * Se dibuja a mano en un canvas de 1080 x 1920 (vertical, formato historia). No es
 * una captura de pantalla: son formas, tipografia y trazos. El unico dato simulado
 * es el codigo de noche, y va marcado como DEMO dentro de la propia pieza.
 */

const CARD_W = 1080;
const CARD_H = 1920;

const FONT_DISPLAY = "'Anton', 'Archivo Black', 'Arial Black', Impact, sans-serif";
const FONT_BODY = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const COLORS = {
  void: '#050506',
  bone: '#f3f1ee',
  smoke: '#b4b4bc',
  ash: '#8f8f98',
  blood: '#8f1116',
  bloodBright: '#c4161d',
  bloodInk: '#e5484d',
};

interface NocheProps {
  /** Codigo de la noche. Es un dato simulado y asi se marca en la tarjeta. */
  code: string;
  /** Ciudad y fecha del concierto, tal cual salen del catalogo de datos. */
  city: string;
  dateLabel: string;
  /** Vuelve al modo concierto. */
  onBack: () => void;
}

interface Bounds {
  width: number;
}

/** Ancho del texto, opcionalmente con separacion entre letras. */
function measure(ctx: CanvasRenderingContext2D, text: string, spacing: number): number {
  let width = 0;
  for (const char of text) {
    width += ctx.measureText(char).width + spacing;
  }
  return Math.max(0, width - spacing);
}

/** Escribe letra a letra para poder separar sin depender de ctx.letterSpacing. */
function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: 'left' | 'right' = 'left',
): void {
  const width = measure(ctx, text, spacing);
  let cursor = align === 'right' ? x - width : x;
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + spacing;
  }
}

/** Encaja el texto en un ancho maximo bajando el cuerpo de letra. */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  startSize: number,
  maxWidth: number,
  weight = '400',
): number {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${FONT_DISPLAY}`;
  while (size > 24 && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = `${weight} ${size}px ${FONT_DISPLAY}`;
  }
  return size;
}

function grain(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  for (let index = 0; index < 2600; index += 1) {
    const size = Math.random() < 0.85 ? 1 : 2;
    ctx.fillRect(Math.random() * CARD_W, Math.random() * CARD_H, size, size);
  }
  ctx.restore();
}

/** Onda: barras verticales a partir del codigo, para que la pieza no sea generica. */
function drawWave(
  ctx: CanvasRenderingContext2D,
  code: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  let seed = 0;
  for (const char of code) seed = (seed * 31 + char.charCodeAt(0)) % 99991;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const gap = 7;
  const barWidth = 4;
  const count = Math.floor(width / (barWidth + gap));
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, COLORS.bone);
  gradient.addColorStop(1, COLORS.bloodBright);
  ctx.fillStyle = gradient;

  for (let index = 0; index < count; index += 1) {
    const wave = Math.abs(Math.sin((index / count) * Math.PI * 3.1));
    const value = 0.28 + next() * 0.72;
    const barHeight = Math.max(10, height * wave * value);
    ctx.fillRect(x + index * (barWidth + gap), y + height - barHeight, barWidth, barHeight);
  }
}

/** Notas de recorte: el borde tipo entrada. */
function notches(ctx: CanvasRenderingContext2D, y: number): void {
  ctx.save();
  ctx.fillStyle = COLORS.void;
  ctx.beginPath();
  ctx.arc(0, y, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(CARD_W, y, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(243, 241, 238, 0.22)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(48, y);
  ctx.lineTo(CARD_W - 48, y);
  ctx.stroke();
  ctx.restore();
}

function paint(
  ctx: CanvasRenderingContext2D,
  { code, city, dateLabel }: { code: string; city: string; dateLabel: string },
): void {
  ctx.clearRect(0, 0, CARD_W, CARD_H);

  // Fondo y atmosfera.
  ctx.fillStyle = COLORS.void;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const glowTop = ctx.createRadialGradient(540, 420, 0, 540, 420, 940);
  glowTop.addColorStop(0, 'rgba(143, 17, 22, 0.55)');
  glowTop.addColorStop(0.5, 'rgba(143, 17, 22, 0.16)');
  glowTop.addColorStop(1, 'rgba(5, 5, 6, 0)');
  ctx.fillStyle = glowTop;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const glowBottom = ctx.createRadialGradient(540, 1780, 0, 540, 1780, 700);
  glowBottom.addColorStop(0, 'rgba(143, 17, 22, 0.4)');
  glowBottom.addColorStop(1, 'rgba(5, 5, 6, 0)');
  ctx.fillStyle = glowBottom;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  grain(ctx);

  // Vinyeta.
  const vignette = ctx.createRadialGradient(540, 960, 360, 540, 960, 1220);
  vignette.addColorStop(0, 'rgba(5, 5, 6, 0)');
  vignette.addColorStop(1, 'rgba(5, 5, 6, 0.82)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const margin = 84;
  const bounds: Bounds = { width: CARD_W - margin * 2 };

  // Cinta superior.
  ctx.fillStyle = COLORS.bloodBright;
  ctx.fillRect(0, 0, CARD_W, 10);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // Marca.
  ctx.font = `400 286px ${FONT_DISPLAY}`;
  ctx.fillStyle = COLORS.bone;
  ctx.fillText('HDLR', margin, 372);

  ctx.font = `800 30px ${FONT_BODY}`;
  ctx.fillStyle = COLORS.ash;
  drawTracked(ctx, 'EL UNIVERSO', margin, 424, 13);

  // TU NOCHE, arriba a la derecha.
  ctx.font = `800 26px ${FONT_BODY}`;
  ctx.fillStyle = COLORS.bloodInk;
  drawTracked(ctx, 'TU NOCHE', CARD_W - margin, 424, 9, 'right');

  ctx.fillStyle = COLORS.bloodBright;
  ctx.fillRect(margin, 470, 240, 7);

  // Ciudad y fecha.
  const citySize = fitFont(ctx, city.toUpperCase(), 150, bounds.width);
  ctx.font = `400 ${citySize}px ${FONT_DISPLAY}`;
  ctx.fillStyle = COLORS.bone;
  ctx.fillText(city.toUpperCase(), margin, 660);

  const dateSize = fitFont(ctx, dateLabel, 158, bounds.width);
  ctx.font = `400 ${dateSize}px ${FONT_DISPLAY}`;
  ctx.fillStyle = COLORS.bloodBright;
  ctx.fillText(dateLabel, margin, 830);

  // Bloque central.
  ctx.fillStyle = 'rgba(243, 241, 238, 0.18)';
  ctx.fillRect(margin, 900, bounds.width, 2);

  const bigSize = fitFont(ctx, 'ESTUVISTE', 214, bounds.width);
  ctx.font = `400 ${bigSize}px ${FONT_DISPLAY}`;
  ctx.fillStyle = COLORS.bone;
  ctx.fillText('ESTUVISTE', margin, 1150);

  const aquiSize = fitFont(ctx, 'AQUI', 214, bounds.width * 0.52);
  ctx.font = `400 ${aquiSize}px ${FONT_DISPLAY}`;
  ctx.fillStyle = COLORS.bloodBright;
  ctx.fillText('AQUI', margin, 1350);

  ctx.font = `500 30px ${FONT_BODY}`;
  ctx.fillStyle = COLORS.smoke;
  drawTracked(ctx, 'HDLR LIVE', margin, 1420, 6);
  ctx.font = `500 30px ${FONT_BODY}`;
  ctx.fillStyle = 'rgba(180, 180, 188, 0.6)';
  drawTracked(ctx, 'ESTA NOCHE FUE TUYA', margin + 220, 1420, 4);

  // Recorte tipo entrada.
  notches(ctx, 1500);

  // Codigo de la noche: dato simulado, marcado como DEMO.
  ctx.font = `800 26px ${FONT_BODY}`;
  ctx.fillStyle = COLORS.ash;
  drawTracked(ctx, 'N. DE NOCHE', margin, 1580, 8);

  ctx.font = `800 24px ${FONT_BODY}`;
  ctx.fillStyle = COLORS.bloodInk;
  drawTracked(ctx, 'DEMO', CARD_W - margin, 1580, 6, 'right');

  const codeSize = fitFont(ctx, code, 92, bounds.width);
  ctx.font = `400 ${codeSize}px ${FONT_DISPLAY}`;
  ctx.fillStyle = COLORS.bone;
  ctx.fillText(code, margin, 1680);

  drawWave(ctx, code, margin, 1712, bounds.width, 88);

  ctx.font = `600 24px ${FONT_BODY}`;
  ctx.fillStyle = COLORS.ash;
  ctx.fillText('Codigo simulado: esta demo no genera entradas reales.', margin, 1852);

  ctx.font = `700 24px ${FONT_BODY}`;
  ctx.fillStyle = 'rgba(143, 143, 152, 0.85)';
  drawTracked(ctx, 'HDLR EL UNIVERSO', margin, 1904, 8);
  drawTracked(ctx, dateLabel, CARD_W - margin, 1904, 6, 'right');
}

export function Noche({ code, city, dateLabel, onBack }: NocheProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  // Dibujo. Se espera a que las fuentes esten cargadas para que no salga a medio pintar.
  useEffect(() => {
    let alive = true;
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas || !alive) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      paint(ctx, { code, city, dateLabel });
      setReady(true);
    };

    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    if (fonts?.ready) {
      fonts.ready.then(render).catch(render);
    } else {
      render();
    }

    return () => {
      alive = false;
    };
  }, [code, city, dateLabel]);

  // Web Share API: solo cuando el navegador admite compartir archivos.
  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') {
      setCanShare(false);
      return;
    }
    try {
      const probe = new File([new Blob(['x'])], 'probe.png', { type: 'image/png' });
      setCanShare(navigator.canShare({ files: [probe] }));
    } catch {
      setCanShare(false);
    }
  }, []);

  const fileName = useCallback(
    () => `hdlr-tu-noche-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`,
    [city],
  );

  const toBlob = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png', 0.94));
  }, []);

  const download = useCallback(
    async (source: 'boton' | 'respaldo' = 'boton') => {
      const blob = await toBlob();
      if (!blob) {
        setStatus('No se ha podido generar la imagen. Prueba a recargar la página.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName();
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setStatus('Tarjeta descargada en 1080 x 1920. Ya puedes guardarla o enviarla.');
      trackEvent('share_card', { id: 'tu_noche_descarga', via: source });
    },
    [fileName, toBlob],
  );

  const share = useCallback(async () => {
    const blob = await toBlob();
    if (!blob) {
      setStatus('No se ha podido generar la imagen.');
      return;
    }

    const file = new File([blob], fileName(), { type: 'image/png' });
    const text = `HDLR LIVE · ${city} · ${dateLabel} · ESTUVISTE AQUÍ`;

    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Tu noche en HDLR', text });
        setStatus('Compartida.');
        trackEvent('share_card', { id: 'tu_noche_compartir', via: 'web-share' });
        return;
      } catch (error) {
        // Cancelar el dialogo del sistema no es un fallo: no se hace nada.
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    await download('respaldo');
    setStatus('Tu navegador no puede compartir archivos: te he dejado la tarjeta descargada.');
  }, [city, dateLabel, download, fileName, toBlob]);

  return (
    <div className="lv-night px-4 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="font-body text-[11px] font-semibold tracking-[0.3em] text-blood-ink uppercase">
            Experiencia 07 · Noche
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.2rem,9vw,4.4rem)] leading-[0.9] text-bone">
            Tu noche
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-smoke">
            Has salido del concierto, así que te llevas tu noche. Esta tarjeta se dibuja aquí mismo,
            trazo a trazo, en formato vertical {CARD_W} x {CARD_H}. No es una captura de pantalla y no
            se sube a ningún sitio: se genera y se queda en tu dispositivo.
          </p>

          <div className="lv-card-actions">
            <button
              type="button"
              className="lv-card-btn"
              onClick={() => void download()}
              disabled={!ready}
            >
              Descargar tarjeta
            </button>
            <button
              type="button"
              className="lv-card-btn"
              data-variant="ghost"
              onClick={() => void share()}
              disabled={!ready}
            >
              {canShare ? 'Compartir' : 'Compartir o descargar'}
            </button>
          </div>

          <p className="lv-note">
            {canShare
              ? 'Compartir abre el dialogo del sistema, con la imagen lista para mandar.'
              : 'Tu navegador no ofrece compartir archivos, así que el botón deja la tarjeta descargada.'}
          </p>

          {status ? (
            <p className="lv-note" role="status">
              {status}
            </p>
          ) : null}

          <div className="lv-demo-strip mt-6">
            <span>Demo</span>
            <span>
              El código de noche de la tarjeta es un dato simulado para esta demo. Ni la ciudad ni la
              fecha lo son: salen de la ficha real del concierto. Ningún dato personal viaja ni se
              guarda.
            </span>
          </div>

          <button type="button" className="lv-exit mt-7" onClick={onBack}>
            <span>Volver al modo concierto</span>
          </button>
        </div>

        <div className="lv-card-frame">
          <canvas
            ref={canvasRef}
            className="lv-card-canvas"
            width={CARD_W}
            height={CARD_H}
            role="img"
            aria-label={`Tarjeta vertical de recuerdo: HDLR, ${city}, ${dateLabel}, estuviste aquí.`}
          />
        </div>
      </div>
    </div>
  );
}

export default Noche;
