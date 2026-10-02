import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '../components/Badge';
import { SectionHeading } from '../components/SectionHeading';
import { concerts } from '../data';
import { Link, ROUTES } from '../lib/router';
import { trackEvent } from '../lib/trackEvent';
import { soundManager } from '../lib/sound';
import {
  computeRuina,
  DIMENSION_LABELS,
  DISPLAY_DIMENSIONS,
  loadRuinaAnswers,
  type RuinaResult,
} from '../lib/ruina';
import { ensureCardFonts } from '../lib/shareCard';
import '../styles/comunidad.css';

/**
 * Experiencia 08. Comunidad.
 *
 * Tres piezas, ninguna con servidor:
 *  1. LA GENTE. La serie Barras Bravas y la comunidad del grupo, contada con
 *     datos verificables y su fuente citada en la propia interfaz.
 *  2. TU CARNET DE LA RUINA. La pieza estrella: un carnet vertical de
 *     1080 x 1920 dibujado en canvas (no es una captura). Sale del resultado
 *     del test de Mi Ruina, que se lee del propio dispositivo.
 *  3. PUERTA AL DIRECTO. La proxima cita, con lo que ya esta en concerts.json.
 *
 * Reglas que se respetan aqui: sin chat, sin registro, sin cuentas, sin base de
 * datos, sin muro, sin subir fotos, sin comentarios, sin newsletter. Todo lo
 * que se guarda vive en el dispositivo de quien visita (localStorage).
 */

/* ------------------------------------------------------------------ */
/* Datos: la serie Barras Bravas, con fuente                            */
/* ------------------------------------------------------------------ */

interface Hecho {
  etiqueta: string;
  titulo: string;
  texto: string;
  fuente: { label: string; url: string };
}

/**
 * Todo lo de esta lista se puede comprobar en el enlace que lleva al lado.
 * Ningun dato sin fuente. Nada de letras ni texto protegido.
 */
const HECHOS: Hecho[] = [
  {
    etiqueta: 'El sello',
    titulo: 'Una serie que se volvió marca',
    texto:
      'Barras Bravas es una serie de videoclips que se ha convertido en sello propio del grupo. La biografía oficial cifra 27 entregas; el blog de la web ya publica la vigesimoctava, BUDOKAI con Hoke.',
    fuente: {
      label: 'natosywaor.com',
      url: 'https://natosywaor.com/pages/biografia-natos-y-waor',
    },
  },
  {
    etiqueta: 'El arranque',
    titulo: 'Empezó en 2014',
    texto:
      'La serie arrancó en 2014 con Cábalas. Desde entonces el grupo ha ido soltando entregas sueltas entre disco y disco, cada una con su videoclip.',
    fuente: {
      label: 'LOS40',
      url: 'https://los40.com/los40/2021/08/02/los40urban/1627918915_614128.html',
    },
  },
  {
    etiqueta: 'El pico',
    titulo: 'Número 1 en YouTube',
    texto:
      'Chatarra, la entrega número 22 firmada por Waor junto a El Jincho y Brawler, llegó al número 1 de las tendencias musicales de YouTube a los pocos días de salir.',
    fuente: {
      label: 'LOS40',
      url: 'https://los40.com/los40/2021/08/02/los40urban/1627918915_614128.html',
    },
  },
  {
    etiqueta: 'El recopilatorio',
    titulo: 'La serie, junta en un disco',
    texto:
      'El 10 de agosto de 2020 la serie se recopiló en un disco propio, titulado también Barras Bravas, disponible en la tienda oficial del grupo.',
    fuente: { label: 'natosywaor.com', url: 'https://natosywaor.com/pages/barras-bravas' },
  },
  {
    etiqueta: 'La geografía',
    titulo: 'De Aluche a nueve países',
    texto:
      'En directo han pasado por más de cincuenta ciudades de España y han llevado su música a Argentina, México, Colombia, Uruguay, Ecuador, Guatemala, Inglaterra y Estados Unidos.',
    fuente: {
      label: 'natosywaor.com',
      url: 'https://natosywaor.com/pages/biografia-natos-y-waor',
    },
  },
  {
    etiqueta: 'La prueba',
    titulo: '60.000 en el Metropolitano',
    texto:
      'El 7 de junio de 2025 reunieron a más de 60.000 personas en el Estadio Metropolitano de Madrid para celebrar 15 años de carrera.',
    fuente: {
      label: 'Urban Roosters',
      url: 'https://urbanroosters.news/natos-y-waor-celebran-su-15o-aniversario-ante-60-000-personas-en-una-noche-historica-para-el-rap-espanol/',
    },
  },
];

const CIFRAS: { n: string; l: string }[] = [
  { n: '27', l: 'entregas, según la bio oficial' },
  { n: '2014', l: 'primera entrega de la serie' },
  { n: '+50', l: 'ciudades en España' },
  { n: '9', l: 'países fuera de España' },
  { n: '60.000', l: 'en el Metropolitano, 2025' },
];

const FUENTES = Array.from(
  new Map(
    [
      { label: 'Natos y Waor: biografía oficial', url: 'https://natosywaor.com/pages/biografia-natos-y-waor' },
      { label: 'Natos y Waor: Barras Bravas, disco recopilatorio (10/08/2020)', url: 'https://natosywaor.com/pages/barras-bravas' },
      { label: 'Natos y Waor: blog oficial, Barras Bravas Vol. 28', url: 'https://natosywaor.com/blogs/video/natos-y-waor-budokai-feat-hoke-barras-bravas-vol-28' },
      { label: 'LOS40: Chatarra, nº1 de YouTube con el Vol. 22 (02/08/2021)', url: 'https://los40.com/los40/2021/08/02/los40urban/1627918915_614128.html' },
      { label: 'Urban Roosters: 15 aniversario ante 60.000 personas', url: 'https://urbanroosters.news/natos-y-waor-celebran-su-15o-aniversario-ante-60-000-personas-en-una-noche-historica-para-el-rap-espanol/' },
      { label: 'Vozpópuli: Hijos de la Ruina, dos noches en el Movistar Arena', url: 'https://www.vozpopuli.com/altavoz/cultura/hijos-de-la-ruina-arrasa-el-movistar-arena-con-40000-personas-en-dos-noches-y-deja-claro-que-madrid-sigue-siendo-suyo.html' },
    ].map((item) => [item.url, item]),
  ).values(),
);

const HOST = (url: string) => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
};

/* ------------------------------------------------------------------ */
/* Carnet de la ruina: pieza grafica 1080 x 1920 dibujada en canvas     */
/* ------------------------------------------------------------------ */

const CARNET_W = 1080;
const CARNET_H = 1920;

const COL = {
  void: '#050506',
  ink: '#0a0a0c',
  carbon: '#121215',
  steel: '#1c1c20',
  ash: '#8f8f98',
  smoke: '#b4b4bc',
  bone: '#f3f1ee',
  blood: '#8f1116',
  bloodBright: '#c4161d',
} as const;

const DISPLAY = 'Anton, "Arial Black", Impact, sans-serif';
const BODY = 'Inter, system-ui, sans-serif';

interface CarnetData {
  ruina: number;
  dims: Record<string, number>;
  verdict: string;
  verdictLine: string;
  id: string;
  year: number;
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
      const v = 110 + Math.floor(Math.random() * 100);
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

function setTracking(ctx: CanvasRenderingContext2D, value: number): void {
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${value}px`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Sello abstracto del carnet: no hay foto, y no se sube ninguna. */
function drawSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.save();
  ctx.strokeStyle = COL.bloodBright;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 104, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(196,22,29,0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 9]);
  ctx.beginPath();
  ctx.arc(cx, cy, 86, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = COL.steel;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 122, 0, Math.PI * 2);
  ctx.stroke();

  // Marcas radiales, como el borde de una moneda.
  ctx.strokeStyle = 'rgba(243,241,238,0.16)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 30; i += 1) {
    const a = (i / 30) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 110, cy + Math.sin(a) * 110);
    ctx.lineTo(cx + Math.cos(a) * 120, cy + Math.sin(a) * 120);
    ctx.stroke();
  }

  ctx.fillStyle = COL.bone;
  ctx.font = `700 46px ${DISPLAY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HDLR', cx, cy - 4);
  ctx.fillStyle = COL.bloodBright;
  ctx.font = `700 18px ${BODY}`;
  ctx.fillText('R U I N A', cx, cy + 38);
  ctx.restore();
}

function drawCarnet(canvas: HTMLCanvasElement, data: CarnetData): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = CARNET_W;
  canvas.height = CARNET_H;
  ctx.clearRect(0, 0, CARNET_W, CARNET_H);

  const LEFT = 168;
  const RIGHT = 84;
  const CONTENT_W = CARNET_W - LEFT - RIGHT;

  /* --- Fondo: negro, halo rojo, viñeta y grano --- */
  ctx.fillStyle = COL.void;
  ctx.fillRect(0, 0, CARNET_W, CARNET_H);

  const halo = ctx.createRadialGradient(900, 320, 0, 900, 320, 760);
  halo.addColorStop(0, 'rgba(143,17,22,0.45)');
  halo.addColorStop(0.5, 'rgba(143,17,22,0.12)');
  halo.addColorStop(1, 'rgba(5,5,6,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, CARNET_W, 1300);

  const lowGlow = ctx.createRadialGradient(180, 1780, 0, 180, 1780, 560);
  lowGlow.addColorStop(0, 'rgba(143,17,22,0.22)');
  lowGlow.addColorStop(1, 'rgba(5,5,6,0)');
  ctx.fillStyle = lowGlow;
  ctx.fillRect(0, 1200, CARNET_W, CARNET_H - 1200);

  const vignette = ctx.createLinearGradient(0, CARNET_H - 520, 0, CARNET_H);
  vignette.addColorStop(0, 'rgba(5,5,6,0)');
  vignette.addColorStop(1, 'rgba(5,5,6,0.92)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, CARNET_H - 520, CARNET_W, 520);

  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(makeNoiseTile(), 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, CARNET_W, CARNET_H);
  }
  ctx.restore();

  /* --- Lomo lateral: el carnet se corta por la izquierda --- */
  ctx.fillStyle = COL.ink;
  ctx.fillRect(0, 0, 120, CARNET_H);
  ctx.fillStyle = COL.blood;
  ctx.fillRect(118, 0, 6, CARNET_H);

  // Marcas de corte.
  ctx.fillStyle = COL.bloodBright;
  ctx.fillRect(46, 150, 28, 6);
  ctx.fillRect(46, 1764, 28, 6);

  ctx.save();
  ctx.translate(62, CARNET_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = COL.ash;
  ctx.font = `700 30px ${BODY}`;
  setTracking(ctx, 10);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HIJOS DE LA RUINA  ·  CARNET DE LA RUINA  ·  HDLR', 0, 0);
  setTracking(ctx, 0);
  ctx.restore();

  /* --- Cabecera --- */
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = COL.bloodBright;
  ctx.fillRect(LEFT, 150, 88, 8);

  ctx.fillStyle = COL.bone;
  ctx.font = `400 168px ${DISPLAY}`;
  ctx.fillText('HDLR', LEFT, 356);

  ctx.fillStyle = COL.bloodBright;
  ctx.font = `400 46px ${DISPLAY}`;
  setTracking(ctx, 8);
  ctx.fillText('CARNET DE LA RUINA', LEFT, 420);
  setTracking(ctx, 0);

  // Sello anual arriba a la derecha.
  ctx.save();
  ctx.translate(CARNET_W - RIGHT - 150, 250);
  ctx.rotate(-0.09);
  ctx.strokeStyle = 'rgba(196,22,29,0.8)';
  ctx.lineWidth = 3;
  ctx.strokeRect(-150, -52, 300, 104);
  ctx.fillStyle = 'rgba(229,72,77,0.9)';
  ctx.font = `700 30px ${BODY}`;
  setTracking(ctx, 6);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`EDICIÓN ${data.year}`, 0, 0);
  ctx.restore();

  ctx.strokeStyle = COL.steel;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(LEFT, 470);
  ctx.lineTo(CARNET_W - RIGHT, 470);
  ctx.stroke();

  /* --- Credencial --- */
  const boxY = 500;
  const boxH = 648;
  ctx.fillStyle = 'rgba(18,18,21,0.62)';
  ctx.fillRect(LEFT, boxY, CONTENT_W, boxH);
  ctx.strokeStyle = COL.steel;
  ctx.lineWidth = 2;
  ctx.strokeRect(LEFT + 1, boxY + 1, CONTENT_W - 2, boxH - 2);

  // Hueco de foto, con sello en lugar de imagen.
  const photoX = LEFT + 40;
  const photoY = boxY + 40;
  const photoS = 300;
  ctx.fillStyle = COL.ink;
  ctx.fillRect(photoX, photoY, photoS, photoS);
  ctx.strokeStyle = COL.steel;
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX + 1, photoY + 1, photoS - 2, photoS - 2);
  drawSeal(ctx, photoX + photoS / 2, photoY + photoS / 2);

  ctx.fillStyle = COL.ash;
  ctx.font = `600 22px ${BODY}`;
  setTracking(ctx, 5);
  ctx.fillText('SIN FOTO · SIN REGISTRO', photoX, photoY + photoS + 46);
  setTracking(ctx, 0);

  // Columna derecha: socio y nivel de ruina.
  const colX = LEFT + 400;

  ctx.fillStyle = COL.ash;
  ctx.font = `700 24px ${BODY}`;
  setTracking(ctx, 9);
  ctx.fillText('Nº DE SOCIO', colX, boxY + 92);
  setTracking(ctx, 0);

  ctx.fillStyle = COL.bloodBright;
  ctx.font = `400 50px ${DISPLAY}`;
  ctx.fillText(data.id, colX, boxY + 148);

  ctx.fillStyle = COL.ash;
  ctx.font = `700 24px ${BODY}`;
  setTracking(ctx, 9);
  ctx.fillText('NIVEL DE RUINA', colX, boxY + 264);
  setTracking(ctx, 0);

  ctx.fillStyle = COL.bone;
  ctx.font = `400 208px ${DISPLAY}`;
  const num = String(data.ruina);
  ctx.fillText(num, colX, boxY + 462);
  const numW = ctx.measureText(num).width;
  ctx.fillStyle = COL.bloodBright;
  ctx.font = `400 96px ${DISPLAY}`;
  ctx.fillText('%', colX + numW + 12, boxY + 462);

  ctx.fillStyle = COL.smoke;
  ctx.font = `400 24px ${BODY}`;
  setTracking(ctx, 3);
  wrap(ctx, 'SE GENERA EN TU DISPOSITIVO · NO VIAJA A NINGÚN SERVIDOR', CONTENT_W - 80)
    .slice(0, 2)
    .forEach((line, index) => {
      ctx.fillText(line, LEFT + 40, boxY + boxH - 72 + index * 32);
    });
  setTracking(ctx, 0);

  /* --- Veredicto --- */
  ctx.fillStyle = COL.bone;
  ctx.font = `400 56px ${DISPLAY}`;
  ctx.fillText(data.verdict.toUpperCase(), LEFT, 1236);

  ctx.fillStyle = COL.smoke;
  ctx.font = `400 32px ${BODY}`;
  const lines = wrap(ctx, data.verdictLine, CONTENT_W);
  lines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, LEFT, 1292 + index * 44);
  });

  /* --- Dimensiones --- */
  const dimsTop = 1400;
  const rowH = 80;
  DISPLAY_DIMENSIONS.forEach((dimension, index) => {
    const y = dimsTop + index * rowH;
    const value = (data.dims as Record<string, number>)[dimension] ?? 0;

    ctx.textAlign = 'left';
    ctx.fillStyle = COL.bone;
    ctx.font = `400 36px ${DISPLAY}`;
    setTracking(ctx, 3);
    ctx.fillText(DIMENSION_LABELS[dimension].toUpperCase(), LEFT, y);
    setTracking(ctx, 0);

    ctx.textAlign = 'right';
    ctx.fillStyle = COL.smoke;
    ctx.font = `600 34px ${BODY}`;
    ctx.fillText(String(value), CARNET_W - RIGHT, y);
    ctx.textAlign = 'left';

    const trackY = y + 20;
    ctx.fillStyle = COL.steel;
    ctx.fillRect(LEFT, trackY, CONTENT_W, 9);
    const fillWidth = Math.max(4, (CONTENT_W * value) / 100);
    const grad = ctx.createLinearGradient(LEFT, 0, LEFT + CONTENT_W, 0);
    grad.addColorStop(0, COL.blood);
    grad.addColorStop(1, COL.bloodBright);
    ctx.fillStyle = grad;
    ctx.fillRect(LEFT, trackY, fillWidth, 9);
    // Marcas de escala: la barra se lee como una regla, no como un medidor generico.
    ctx.fillStyle = 'rgba(243,241,238,0.28)';
    for (let tick = 1; tick < 4; tick += 1) {
      const tickX = LEFT + Math.round((CONTENT_W * tick) / 4);
      ctx.fillRect(tickX, trackY - 6, 2, 21);
    }
  });

  /* --- Pie, con linea de corte --- */
  ctx.strokeStyle = COL.steel;
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.moveTo(LEFT, 1776);
  ctx.lineTo(CARNET_W - RIGHT, 1776);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = COL.bloodBright;
  ctx.font = `700 30px ${BODY}`;
  setTracking(ctx, 8);
  ctx.fillText('hdlr el universo', LEFT, 1830);
  setTracking(ctx, 0);

  ctx.textAlign = 'right';
  ctx.fillStyle = COL.bone;
  ctx.font = `400 62px ${DISPLAY}`;
  ctx.fillText(String(data.year), CARNET_W - RIGHT, 1838);
  ctx.textAlign = 'left';

  ctx.fillStyle = COL.ash;
  ctx.font = `500 24px ${BODY}`;
  setTracking(ctx, 4);
  setTracking(ctx, 0);
}

function carnetFileName(id: string): string {
  return `hdlr-carnet-de-la-ruina-${id.toLowerCase()}.png`;
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

async function downloadCarnet(canvas: HTMLCanvasElement, id: string): Promise<void> {
  const blob = await toBlob(canvas);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = carnetFileName(id);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function shareCarnet(
  canvas: HTMLCanvasElement,
  data: CarnetData,
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data?: ShareData) => Promise<void>;
  };
  const blob = await toBlob(canvas);
  if (blob && typeof nav.share === 'function' && typeof nav.canShare === 'function') {
    const file = new File([blob], carnetFileName(data.id), { type: 'image/png' });
    if (nav.canShare({ files: [file] })) {
      try {
        await nav.share({
          files: [file],
          title: 'HDLR, El Universo',
          text: `Mi carnet de la ruina: ${data.ruina}%. ¿Cuánto pesa la tuya?`,
        });
        return 'shared';
      } catch {
        return 'cancelled';
      }
    }
  }
  await downloadCarnet(canvas, data.id);
  return 'downloaded';
}

interface CarnetPanelProps {
  result: RuinaResult;
}

function CarnetPanel({ result }: CarnetPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState('');

  const data = useMemo<CarnetData>(
    () => ({
      ruina: result.ruina,
      dims: result.dims as Record<string, number>,
      verdict: result.verdict,
      verdictLine: result.verdictLine,
      id: result.id,
      year: new Date().getFullYear(),
    }),
    [result],
  );

  useEffect(() => {
    let cancelled = false;
    void ensureCardFonts().then(() => {
      if (!cancelled && canvasRef.current) drawCarnet(canvasRef.current, data);
    });
    return () => {
      cancelled = true;
    };
  }, [data]);

  async function handleDownload() {
    if (!canvasRef.current) return;
    await downloadCarnet(canvasRef.current, data.id);
    soundManager.play('click');
    trackEvent('share_card', { via: 'carnet_descarga', ruina: result.ruina });
    setStatus('Guardado. Tienes el carnet en tus descargas.');
  }

  async function handleShare() {
    if (!canvasRef.current) return;
    const outcome = await shareCarnet(canvasRef.current, data);
    trackEvent('share_card', { via: `carnet_${outcome}`, ruina: result.ruina });
    if (outcome === 'downloaded') setStatus('Tu navegador no comparte imágenes: lo hemos descargado.');
    else if (outcome === 'shared') setStatus('Compartido.');
  }

  return (
    <div className="cm-carnet reveal">
      <div className="cm-carnet-stage">
        <div className="cm-carnet-frame">
          <canvas
            ref={canvasRef}
            width={CARNET_W}
            height={CARNET_H}
            className="cm-carnet-canvas"
            role="img"
            aria-label={`Carnet de la ruina. Nivel ${result.ruina} por ciento, ${result.verdict}. Número ${result.id}, año ${data.year}.`}
          />
        </div>
      </div>

      <div className="cm-carnet-side">
        <p className="cm-carnet-kicker">Pieza lista</p>
        <h3 className="cm-carnet-h">Tu carnet de la ruina</h3>
        <p className="cm-carnet-p">
          Un carnet vertical de 1080 × 1920, dibujado aquí mismo, en tu dispositivo. Lleva tu
          nivel de ruina, tus dimensiones, el año y un número de socio único. Ninguna imagen
          sube a internet: se compone delante de ti.
        </p>

        <ul className="cm-carnet-data">
          <li>
            <span>Nivel</span>
            <strong>{result.ruina}%</strong>
          </li>
          <li>
            <span>Veredicto</span>
            <strong>{result.verdict}</strong>
          </li>
          <li>
            <span>Nº de socio</span>
            <strong>{result.id}</strong>
          </li>
        </ul>

        <div className="cm-actions">
          <button type="button" className="cm-btn cm-btn-primary" onClick={handleDownload}>
            <span>Descargar el carnet</span>
          </button>
          <button type="button" className="cm-btn cm-btn-ghost" onClick={handleShare}>
            <span>Compartir</span>
          </button>
        </div>

        <p className="cm-status" role="status" aria-live="polite">
          {status}
        </p>

        <p className="cm-carnet-note">
          <Link to={ROUTES.perfil} className="link-sweep">
            Cambiar mis respuestas
          </Link>{' '}
          · si borras los datos del navegador, el carnet desaparece contigo.
        </p>
      </div>
    </div>
  );
}

function CarnetEmpty() {
  return (
    <div className="cm-empty reveal">
      <span className="cm-empty-mark" aria-hidden="true">
        ?
      </span>
      <h3 className="cm-empty-h">Todavía no hay carnet</h3>
      <p className="cm-empty-p">
        El carnet se rellena con el resultado del test de Mi Ruina. Son ocho preguntas y no hace
        falta dar ningún dato: ni correo, ni cuenta, ni teléfono. Si lo haces, tu carnet aparecerá
        aquí y se quedará guardado en este dispositivo, no en ningún servidor.
      </p>
      <Link to={ROUTES.perfil} className="cm-btn cm-btn-primary" onClick={() => trackEvent('cta_click', { id: 'comunidad_test' })}>
        <span>Hacer el test</span>
      </Link>
      <p className="cm-carnet-note">Tarda un minuto. No es obligatorio para seguir mirando.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Puerta al directo: proxima cita, con concerts.json                   */
/* ------------------------------------------------------------------ */

function daysUntil(dateISO: string): number {
  const [y, m, d] = dateISO.split('-').map((value) => Number.parseInt(value, 10));
  const target = new Date(y, (m || 1) - 1, d || 1).getTime();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - start) / 86400000);
}

function PuertaAlDirecto() {
  const cita = useMemo(
    () => concerts.find((item) => item.id === 'salamanca') ?? concerts[concerts.length - 1],
    [],
  );
  const dias = daysUntil(cita.dateISO);
  const corta = useMemo(() => {
    const [y, m, d] = cita.dateISO.split('-');
    return `${d}.${m}.${y.slice(2)}`;
  }, [cita.dateISO]);

  const cuenta =
    dias > 1 ? `Faltan ${dias} días` : dias === 1 ? 'Falta 1 día' : dias === 0 ? 'Es hoy' : 'Ya pasó';

  return (
    <div className="cm-directo reveal">
      <div className="cm-directo-glow" aria-hidden="true" />
      <div className="cm-directo-head">
        <p className="cm-directo-kicker">Próxima cita</p>
        <Badge kind={cita.confirmed ? 'real' : 'demo'} />
      </div>

      <p className="cm-directo-date">{corta}</p>
      <p className="cm-directo-when">{cita.dateLabel}</p>
      <h3 className="cm-directo-city">{cita.city}</h3>
      <p className="cm-directo-venue">{cita.venue}</p>

      <p className="cm-directo-count">
        <span className="cm-directo-count-n">{cuenta}</span>
      </p>

      <p className="cm-directo-note">
        Fecha y recinto tomados de la ficha de la gira. Mírala con el resto de plazas en el mapa.
      </p>

      <div className="cm-actions">
        <Link
          to={ROUTES.mapa}
          className="cm-btn cm-btn-primary"
          onClick={() => trackEvent('cta_click', { id: 'comunidad_mapa' })}
        >
          <span>Ver la gira en el mapa</span>
        </Link>
        <Link
          to={ROUTES.live}
          className="cm-btn cm-btn-ghost"
          onClick={() => trackEvent('cta_click', { id: 'comunidad_live' })}
        >
          <span>Entrar al directo</span>
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vista                                                               */
/* ------------------------------------------------------------------ */

export function Comunidad() {
  const [answers] = useState<number[] | null>(() => loadRuinaAnswers());
  const result = useMemo(() => (answers ? computeRuina(answers) : null), [answers]);

  return (
    <div className="cm">
      {/* --- Portada --- */}
      <section className="cm-hero">
        <div className="cm-hero-glow drift" aria-hidden="true" />
        <div className="tech-grid absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="cm-hero-inner relative mx-auto w-full max-w-[1400px]">
          <p className="cm-kicker rise">08 · Comunidad</p>
          <h1 className="cm-title rise [animation-delay:120ms]">
            <span className="cm-title-a">Barras</span>
            <span className="cm-title-b">Bravas</span>
          </h1>
          <p className="cm-brand rise [animation-delay:220ms]">
            La comunidad de <strong>Hijos de la Ruina</strong>. Natos, Waor y Recycled J.
          </p>
          <p className="cm-lead rise [animation-delay:320ms]">
            Sin club con cuota y sin muro de seguidores: se ha construido entrega a entrega. Aquí va
            con datos que se pueden comprobar, y con tu carnet, dibujado en tu móvil sin salir de él.
          </p>
          <div className="cm-scroll rise [animation-delay:560ms]" aria-hidden="true">
            <span className="cm-scroll-label">Baja</span>
            <span className="cm-scroll-line" />
          </div>
        </div>
      </section>

      {/* --- La gente --- */}
      <section className="cm-section">
        <div className="mx-auto w-full max-w-[1400px]">
          <SectionHeading
            index="01 · La gente"
            title="La serie que sostiene la comunidad"
            lead="Barras Bravas no es un álbum: es la vía por la que el grupo habla con quien le sigue. Esto es lo que se sabe de la serie, cada dato con su fuente."
          />

          <ul className="cm-facts">
            {HECHOS.map((hecho) => (
              <li key={hecho.titulo} className="cm-fact reveal">
                <p className="cm-fact-et">{hecho.etiqueta}</p>
                <h3 className="cm-fact-title">{hecho.titulo}</h3>
                <p className="cm-fact-text">{hecho.texto}</p>
                <a
                  className="cm-fact-src link-sweep"
                  href={hecho.fuente.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Fuente: {hecho.fuente.label} ↗
                </a>
              </li>
            ))}
          </ul>

          <div className="cm-cifras reveal">
            {CIFRAS.map((cifra) => (
              <div key={cifra.l} className="cm-cifra">
                <span className="cm-cifra-n">{cifra.n}</span>
                <span className="cm-cifra-l">{cifra.l}</span>
              </div>
            ))}
          </div>

          <div className="cm-pull reveal">
            <p>
              En 2023, El País lo situó como el grupo más popular del hip hop español y cifró en
              45.000 las entradas de sus tres WiZink Center. Poco después llegó una noche de 60.000
              personas en un estadio.
            </p>
            <a
              className="cm-fact-src link-sweep"
              href="https://elpais.com/cultura/2023-12-03/natos-y-waor-rapean-la-cronica-de-una-juventud-extraviada-y-llenan-tres-wizink.html"
              target="_blank"
              rel="noreferrer noopener"
            >
              Fuente: El País ↗
            </a>
          </div>

          <div className="cm-sources reveal">
            <p className="cm-sources-h">Fuentes de esta sección</p>
            <ul>
              {FUENTES.map((fuente) => (
                <li key={fuente.url}>
                  <a
                    className="link-sweep"
                    href={fuente.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {fuente.label}
                    <span className="cm-src-host"> · {HOST(fuente.url)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --- Carnet --- */}
      <section className="cm-section cm-section-alt">
        <div className="mx-auto w-full max-w-[1400px]">
          <SectionHeading
            index="02 · Tu carnet"
            title="Tu carnet de la ruina"
            lead="La pieza estrella de esta puerta. Si ya has hecho el test de Mi Ruina, tu carnet está listo para descargar o compartir."
            aside={<Badge kind="aviso" />}
          />
          {result ? <CarnetPanel result={result} /> : <CarnetEmpty />}
        </div>
      </section>

      {/* --- Puerta al directo --- */}
      <section className="cm-section">
        <div className="mx-auto w-full max-w-[1400px]">
          <SectionHeading
            index="03 · Puerta al directo"
            title="Nos vemos en la próxima plaza"
            lead="La comunidad se junta de verdad en los conciertos. Esta es la siguiente parada de la gira."
          />
          <PuertaAlDirecto />
        </div>
      </section>

      <p className="cm-foot">
        Comunidad de HDLR, El Universo. Nada de aquí viaja a un servidor: lo que se guarda, se
        guarda en tu dispositivo.
      </p>
    </div>
  );
}
