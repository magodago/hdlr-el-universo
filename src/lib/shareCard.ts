import { DISPLAY_DIMENSIONS, DIMENSION_LABELS, type DisplayDimension } from './ruina';

/**
 * Tarjeta de MI RUINA, 1080 x 1920.
 *
 * Es una pieza grafica propia dibujada en canvas: no es una captura de la
 * aplicacion. Se genera entera en el dispositivo y no se envia a ningun sitio.
 *
 * Medidas fijas de historia de Instagram (1080 x 1920) para que se vea nitida
 * al compartirla y al guardarla.
 */

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;

export interface ShareCardData {
  ruina: number;
  dims: Record<DisplayDimension, number>;
  verdict: string;
  verdictLine: string;
  id: string;
  /** Ciudad opcional, escrita a mano por la persona. Nunca se deduce. */
  city?: string;
  year: number;
}

const MARGIN = 96;
const BONE = '#f3f1ee';
const SMOKE = '#b4b4bc';
const ASH = '#8f8f98';
const BLOOD = '#8f1116';
const BLOOD_BRIGHT = '#c4161d';
const STEEL = '#1c1c20';

type Ctx = CanvasRenderingContext2D;

function setTracking(ctx: Ctx, value: number): void {
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = `${value}px`;
}

function displayFont(size: number): string {
  return `${size}px Anton, "Arial Black", Impact, sans-serif`;
}

function bodyFont(size: number, weight = 500): string {
  return `${weight} ${size}px Inter, system-ui, sans-serif`;
}

function drawGrain(ctx: Ctx): void {
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(makeNoiseTile(), 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  }
  ctx.restore();
}

let noiseTile: HTMLCanvasElement | null = null;
function makeNoiseTile(): HTMLCanvasElement {
  if (noiseTile) return noiseTile;
  const size = 180;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d');
  if (tctx) {
    const image = tctx.createImageData(size, size);
    for (let i = 0; i < image.data.length; i += 4) {
      const v = 120 + Math.floor(Math.random() * 90);
      image.data[i] = v;
      image.data[i + 1] = v;
      image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
    tctx.putImageData(image, 0, 0);
  }
  noiseTile = tile;
  return tile;
}

function drawBackground(ctx: Ctx): void {
  ctx.fillStyle = '#050506';
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Halo rojo arriba a la derecha.
  const glow = ctx.createRadialGradient(880, 380, 0, 880, 380, 720);
  glow.addColorStop(0, 'rgba(143,17,22,0.42)');
  glow.addColorStop(0.5, 'rgba(143,17,22,0.12)');
  glow.addColorStop(1, 'rgba(5,5,6,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_WIDTH, 1200);

  // Vineta inferior.
  const vignette = ctx.createLinearGradient(0, CARD_HEIGHT - 620, 0, CARD_HEIGHT);
  vignette.addColorStop(0, 'rgba(5,5,6,0)');
  vignette.addColorStop(1, 'rgba(5,5,6,0.9)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, CARD_HEIGHT - 620, CARD_WIDTH, 620);

  drawGrain(ctx);
}

function drawHeader(ctx: Ctx): void {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = BLOOD_BRIGHT;
  ctx.fillRect(MARGIN, 150, 88, 8);

  ctx.fillStyle = BONE;
  ctx.font = displayFont(148);
  ctx.fillText('HDLR', MARGIN, 300);

  ctx.font = bodyFont(30, 700);
  setTracking(ctx, 12);
  ctx.fillStyle = SMOKE;
  ctx.fillText('EL UNIVERSO', MARGIN, 352);
  setTracking(ctx, 0);

  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, 430);
  ctx.lineTo(CARD_WIDTH - MARGIN, 430);
  ctx.stroke();
}

function drawScore(ctx: Ctx, data: ShareCardData): void {
  ctx.textAlign = 'left';
  ctx.fillStyle = ASH;
  ctx.font = bodyFont(34, 700);
  setTracking(ctx, 14);
  ctx.fillText('MI RUINA', MARGIN, 590);
  setTracking(ctx, 0);

  ctx.fillStyle = BONE;
  ctx.font = displayFont(360);
  const pct = `${data.ruina}`;
  ctx.fillText(pct, MARGIN, 900);
  const width = ctx.measureText(pct).width;
  ctx.fillStyle = BLOOD_BRIGHT;
  ctx.font = displayFont(150);
  ctx.fillText('%', MARGIN + width + 18, 900);

  ctx.fillStyle = BONE;
  ctx.font = displayFont(64);
  ctx.fillText(data.verdict.toUpperCase(), MARGIN, 1000);

  ctx.fillStyle = SMOKE;
  ctx.font = bodyFont(34, 400);
  drawWrapped(ctx, data.verdictLine, MARGIN, 1064, CARD_WIDTH - MARGIN * 2, 46);
}

function drawDimensions(ctx: Ctx, data: ShareCardData): void {
  const top = 1210;
  const rowHeight = 118;
  const trackWidth = CARD_WIDTH - MARGIN * 2;

  DISPLAY_DIMENSIONS.forEach((dimension, index) => {
    const y = top + index * rowHeight;
    const value = data.dims[dimension];

    ctx.textAlign = 'left';
    ctx.fillStyle = BONE;
    ctx.font = displayFont(40);
    setTracking(ctx, 4);
    ctx.fillText(DIMENSION_LABELS[dimension].toUpperCase(), MARGIN, y);
    setTracking(ctx, 0);

    ctx.textAlign = 'right';
    ctx.fillStyle = SMOKE;
    ctx.font = bodyFont(38, 600);
    ctx.fillText(String(value), CARD_WIDTH - MARGIN, y);
    ctx.textAlign = 'left';

    const trackY = y + 26;
    ctx.fillStyle = STEEL;
    ctx.fillRect(MARGIN, trackY, trackWidth, 10);
    const fillWidth = Math.max(4, (trackWidth * value) / 100);
    const fill = ctx.createLinearGradient(MARGIN, 0, MARGIN + trackWidth, 0);
    fill.addColorStop(0, BLOOD);
    fill.addColorStop(1, BLOOD_BRIGHT);
    ctx.fillStyle = fill;
    ctx.fillRect(MARGIN, trackY, fillWidth, 10);
  });
}

function drawFooter(ctx: Ctx, data: ShareCardData): void {
  const baseY = CARD_HEIGHT - 150;

  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, baseY - 120);
  ctx.lineTo(CARD_WIDTH - MARGIN, baseY - 120);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = ASH;
  ctx.font = bodyFont(28, 600);
  setTracking(ctx, 6);
  ctx.fillText('hdlr el universo', MARGIN, baseY - 60);
  setTracking(ctx, 0);

  if (data.city && data.city.trim().length > 0) {
    ctx.fillStyle = SMOKE;
    ctx.font = bodyFont(30, 600);
    ctx.fillText(data.city.trim().toUpperCase(), MARGIN, baseY);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = SMOKE;
  ctx.font = bodyFont(30, 600);
  ctx.fillText(String(data.year), CARD_WIDTH - MARGIN, baseY);

  ctx.textAlign = 'left';
  ctx.fillStyle = BLOOD_BRIGHT;
  ctx.font = bodyFont(30, 700);
  setTracking(ctx, 8);
  ctx.fillText(data.id, MARGIN, baseY + 56);
  setTracking(ctx, 0);
}

function drawWrapped(ctx: Ctx, text: string, x: number, y: number, maxWidth: number, lh: number): void {
  const words = text.split(' ');
  let line = '';
  let cursor = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursor);
      line = word;
      cursor += lh;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursor);
}

/** Espera a que las fuentes esten listas para no dibujar con la de reserva. */
export async function ensureCardFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await document.fonts.ready;
  } catch {
    /* si no hay fuentes listas, se dibuja con la de reserva */
  }
}

/** Dibuja la tarjeta en el canvas indicado. Lo deja en 1080 x 1920. */
export function drawRuinaCard(canvas: HTMLCanvasElement, data: ShareCardData): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  drawBackground(ctx);
  drawHeader(ctx);
  drawScore(ctx, data);
  drawDimensions(ctx, data);
  drawFooter(ctx, data);
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function cardFileName(data: ShareCardData): string {
  return `hdlr-mi-ruina-${data.ruina}-${data.id.toLowerCase()}.png`;
}

/** Descarga la tarjeta como PNG. Alternativa cuando no hay Web Share. */
export async function downloadRuinaCard(canvas: HTMLCanvasElement, data: ShareCardData): Promise<void> {
  const blob = await toBlob(canvas);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = cardFileName(data);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function canShareCard(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
  };
  return typeof nav.share === 'function';
}

/**
 * Comparte la tarjeta con la Web Share API. Si el navegador no puede compartir
 * ficheros, cae a la descarga. Devuelve por donde ha salido.
 */
export async function shareRuinaCard(
  canvas: HTMLCanvasElement,
  data: ShareCardData,
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data?: ShareData) => Promise<void>;
  };
  const blob = await toBlob(canvas);
  if (blob && typeof nav.share === 'function' && typeof nav.canShare === 'function') {
    const file = new File([blob], cardFileName(data), { type: 'image/png' });
    if (nav.canShare({ files: [file] })) {
      try {
        await nav.share({
          files: [file],
          title: 'HDLR, El Universo',
          text: `Mi ruina pesa un ${data.ruina}%. ¿Cuánto pesa la tuya?`,
        });
        return 'shared';
      } catch {
        return 'cancelled';
      }
    }
  }
  await downloadRuinaCard(canvas, data);
  return 'downloaded';
}
