import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '../components/Badge';
import { EasterEgg } from '../components/EasterEgg';
import { SectionHeading } from '../components/SectionHeading';
import '../styles/perfil.css';
import { members, timeline, volumes, counts, allSources, catalog, tourName } from '../data';
import { getActiveEngine, type RecommendationRequest, type RecommendationResult } from '../lib/ai';
import { trackEvent } from '../lib/trackEvent';
import { soundManager } from '../lib/sound';
import {
  computeRuina,
  DIMENSION_LABELS,
  DISPLAY_DIMENSIONS,
  QUESTIONS,
  type DisplayDimension,
  type RuinaResult,
} from '../lib/ruina';
import {
  drawRuinaCard,
  downloadRuinaCard,
  ensureCardFonts,
  shareRuinaCard,
  type ShareCardData,
} from '../lib/shareCard';

/**
 * Experiencia 02. Perfil.
 *
 * La pieza central es MI RUINA: un test de ocho preguntas a pantalla completa
 * que mueve variables internas que no se ven. Al terminar aparece el peso y las
 * dimensiones, y se puede bajar una tarjeta propia de 1080 x 1920.
 *
 * Todo lo factual sobre Hijos de la Ruina sigue disponible al final, plegado,
 * con sus fuentes. Nada inventado.
 */

type Phase = 'intro' | 'test' | 'reveal' | 'result';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Cuenta de 0 al objetivo. Respeta el movimiento reducido. */
function useCountUp(target: number, duration = 1400): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

/* ------------------------------------------------------------------ */
/* Intro: tres frases con pausa y un boton                             */
/* ------------------------------------------------------------------ */

const INTRO_STEPS = [900, 2400, 3900, 5000];

function Intro({ onStart }: { onStart: () => void }) {
  const reduced = useRef(prefersReducedMotion()).current;
  const [step, setStep] = useState(reduced ? 3 : 0);

  useEffect(() => {
    if (reduced) return;
    const timers = INTRO_STEPS.map((time, index) =>
      window.setTimeout(() => setStep((current) => Math.max(current, index)), time),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reduced]);

  return (
    <section className="ruina-stage" aria-label="Mi ruina, introducción">
      <div className="ruina-stage-glow" aria-hidden="true" />
      <div className="ruina-stage-inner">
        <p className={`ruina-phrase${step >= 0 ? ' is-on' : ''}`}>
          Todo el mundo tiene una <span className="ruina-accent">ruina</span> dentro.
        </p>
        <p className={`ruina-phrase${step >= 1 ? ' is-on' : ''}`}>La tuya también.</p>
        <p className={`ruina-phrase${step >= 2 ? ' is-on' : ''}`}>
          Vamos a ver cuánto pesa.
        </p>
        <button
          type="button"
          className={`ruina-action${step >= 3 ? ' is-on' : ''}`}
          onClick={onStart}
          disabled={step < 3}
        >
          <span>Descubrirla</span>
          <svg
            className="ruina-action-arrow"
            width="22"
            height="12"
            viewBox="0 0 22 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 6h18M13.6 1.2 19 6l-5.4 4.8"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="square"
            />
          </svg>
        </button>
      </div>

      {step < 3 ? (
        <button
          type="button"
          className="ruina-skip"
          onClick={() => setStep(3)}
          aria-label="Saltar la introducción"
        >
          <span className="ruina-hint">Toca la pantalla</span>
        </button>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Preguntas: una por pantalla, sin numeros y sin instrucciones        */
/* ------------------------------------------------------------------ */

interface TestProps {
  index: number;
  locked: boolean;
  chosen: number | null;
  reaction: boolean;
  onAnswer: (optionIndex: number) => void;
}

function TestScreen({ index, locked, chosen, reaction, onAnswer }: TestProps) {
  const question = QUESTIONS[index];
  const progress = ((index + 1) / QUESTIONS.length) * 100;

  return (
    <section className="ruina-q-stage" aria-live="polite">
      <div className="tech-grid absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="ruina-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[720px]">
        <p className={`ruina-q-prompt${reaction ? ' is-react' : ''}`}>{question.prompt}</p>

        <div className="ruina-options">
          {question.options.map((option, optionIndex) => (
            <button
              key={option.id}
              type="button"
              className={`ruina-option${chosen === optionIndex ? ' is-chosen' : ''}`}
              disabled={locked}
              onClick={() => onAnswer(optionIndex)}
            >
              <span className="ruina-option-label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {reaction ? <div className="ruina-reaction" aria-hidden="true" /> : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Cierre: pantalla negra antes del resultado                          */
/* ------------------------------------------------------------------ */

function Reveal({ onDone }: { onDone: () => void }) {
  const reduced = useRef(prefersReducedMotion()).current;
  const [step, setStep] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      const timer = window.setTimeout(onDone, 1400);
      return () => window.clearTimeout(timer);
    }
    const timers = [
      window.setTimeout(() => setStep(1), 1000),
      window.setTimeout(onDone, 2600),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onDone, reduced]);

  return (
    <section className="ruina-stage" aria-label="Mi ruina, resultado">
      <div className="ruina-stage-glow" aria-hidden="true" />
      <div className="ruina-stage-inner">
        <p className={`ruina-phrase${step >= 0 ? ' is-on' : ''}`}>Ya lo sabemos.</p>
        <p className={`ruina-phrase ruina-phrase-strong${step >= 1 ? ' is-on' : ''}`}>
          Tienes una <span className="ruina-accent">ruina</span> dentro.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Resultado: cifras que suben y dimensiones                           */
/* ------------------------------------------------------------------ */

function DimensionRow({ dimension, value }: { dimension: DisplayDimension; value: number }) {
  const shown = useCountUp(value, 1300);
  return (
    <div className="dim-row">
      <div className="dim-head">
        <span className="dim-name">{DIMENSION_LABELS[dimension]}</span>
        <span className="dim-value">{shown}</span>
      </div>
      <div className="dim-track">
        <div className="dim-fill" style={{ width: `${shown}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta compartible 1080 x 1920                                     */
/* ------------------------------------------------------------------ */

function RuinaCardPanel({ result }: { result: RuinaResult }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const year = useMemo(() => new Date().getFullYear(), []);
  const shareAvailable = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const data = useMemo<ShareCardData>(
    () => ({
      ruina: result.ruina,
      dims: result.dims,
      verdict: result.verdict,
      verdictLine: result.verdictLine,
      id: result.id,
      city,
      year,
    }),
    [result, city, year],
  );

  useEffect(() => {
    let cancelled = false;
    void ensureCardFonts().then(() => {
      if (!cancelled && canvasRef.current) drawRuinaCard(canvasRef.current, data);
    });
    return () => {
      cancelled = true;
    };
  }, [data]);

  async function handleDownload() {
    if (!canvasRef.current) return;
    await downloadRuinaCard(canvasRef.current, data);
    soundManager.play('click');
    trackEvent('share_card', { via: 'descarga', ruina: result.ruina });
    setStatus('Guardada. La tienes en tus descargas.');
  }

  async function handleShare() {
    if (!canvasRef.current) return;
    const outcome = await shareRuinaCard(canvasRef.current, data);
    trackEvent('share_card', { via: outcome, ruina: result.ruina });
    if (outcome === 'downloaded') setStatus('Tu navegador no comparte imágenes: la hemos descargado.');
    if (outcome === 'shared') setStatus('Compartida.');
    if (outcome === 'cancelled') setStatus('Se ha cancelado el compartir. Puedes descargarla.');
  }

  return (
    <div className="ruina-card-block">
      <p className="ruina-card-kicker">Tu tarjeta</p>
      <h3 className="ruina-card-title">Llévatela contigo</h3>

      <div className="ruina-card-frame">
        <canvas
          ref={canvasRef}
          className="ruina-card-canvas"
          width={1080}
          height={1920}
          role="img"
          aria-label={`Tarjeta de Mi Ruina. Ruina ${result.ruina} por ciento, identificador ${result.id}.`}
        />
      </div>

      <label className="ruina-city">
        <span className="ruina-city-label">Tu ciudad (opcional)</span>
        <input
          type="text"
          value={city}
          onChange={(event) => setCity(event.target.value.slice(0, 24))}
          placeholder="Dónde pesa tu ruina"
          maxLength={24}
          autoComplete="off"
          className="ruina-city-input"
        />
      </label>

      <div className="ruina-card-actions">
        {shareAvailable ? (
          <button type="button" className="ruina-card-btn is-primary" onClick={handleShare}>
            Compartir
          </button>
        ) : null}
        <button
          type="button"
          className={`ruina-card-btn${shareAvailable ? '' : ' is-primary'}`}
          onClick={handleDownload}
        >
          Descargar
        </button>
      </div>

      <p className="ruina-card-note" role="status">
        {status ||
          'Se genera en tu dispositivo a 1080 por 1920. No se sube a ningún servidor y no se guarda nada.'}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Resultado completo                                                  */
/* ------------------------------------------------------------------ */

function ResultView({ result, onRepeat }: { result: RuinaResult; onRepeat: () => void }) {
  const shown = useCountUp(result.ruina, 1500);

  useEffect(() => {
    soundManager.play('result');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="ruina-result">
      <div className="interior-glow" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-[720px]">
        <p className="ruina-score-label">Mi ruina</p>
        <p className="ruina-score" aria-label={`Ruina ${result.ruina} por ciento`}>
          {shown}
          <span className="ruina-score-sign">%</span>
        </p>
        <p className="ruina-verdict">{result.verdict}</p>
        <p className="ruina-verdict-line">{result.verdictLine}</p>

        <div className="mt-10">
          {DISPLAY_DIMENSIONS.map((dimension) => (
            <DimensionRow key={dimension} dimension={dimension} value={result.dims[dimension]} />
          ))}
        </div>

        <RuinaCardPanel result={result} />

        <button type="button" className="ruina-repeat" onClick={onRepeat}>
          Volver a hacerlo
        </button>

        <p className="ruina-id">Identificador de esta ruina: {result.id}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Expediente: todo lo factual, plegado con sus fuentes                */
/* ------------------------------------------------------------------ */

function TrackList({ volumeId }: { volumeId: string }) {
  const volume = volumes.find((item) => item.id === volumeId);
  if (!volume) return null;

  return (
    <ol className="mt-px divide-y divide-steel border-t border-steel">
      {volume.tracks.map((track) => (
        <li
          key={`${volume.id}-${track.n}`}
          className="grid grid-cols-[2.2rem_1fr_auto] items-baseline gap-3 px-4 py-3 sm:px-6"
        >
          <span className="font-display text-sm text-ash">{String(track.n).padStart(2, '0')}</span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="text-[15px] font-semibold text-bone">{track.title}</span>
              {track.single ? (
                <span className="border border-blood-bright/60 px-1.5 py-[1px] font-body text-[9px] font-bold tracking-[0.2em] text-blood-ink uppercase">
                  Adelanto
                </span>
              ) : null}
            </span>
            {track.features && track.features.length > 0 ? (
              <span className="mt-1 block text-xs text-smoke">Con {track.features.join(', ')}</span>
            ) : null}
          </span>
          <span className="font-body text-xs tabular-nums text-ash">{track.duration ?? 's/d'}</span>
        </li>
      ))}
    </ol>
  );
}

function VolumeBlock({ volumeId, defaultOpen }: { volumeId: string; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const volume = volumes.find((item) => item.id === volumeId);
  if (!volume) return null;

  return (
    <article className="reveal border border-steel bg-carbon">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`vol-${volume.id}`}
          onClick={() => {
            setOpen((value) => !value);
            if (!open) trackEvent('volume_open', { volume: volume.id, year: volume.year });
          }}
          className="flex w-full items-center gap-4 px-4 py-5 text-left transition-colors hover:bg-steel sm:px-6"
        >
          <span className="font-display text-3xl leading-none text-blood-bright sm:text-4xl">
            {volume.year}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-xl tracking-[0.04em] text-bone sm:text-2xl">
              {volume.title}
            </span>
            <span className="mt-1 block font-body text-[11px] tracking-[0.18em] text-ash uppercase">
              {volume.trackCount} cortes · {volume.durationLabel} · {volume.label}
            </span>
          </span>
          <span
            className={`font-display text-2xl text-smoke transition-transform duration-300 ${
              open ? 'rotate-45' : ''
            }`}
            aria-hidden="true"
          >
            +
          </span>
        </button>
      </h3>

      <div id={`vol-${volume.id}`} hidden={!open}>
        <TrackList volumeId={volume.id} />
        <div className="flex flex-wrap items-center gap-3 border-t border-steel px-4 py-4 sm:px-6">
          <Badge kind="real" />
          <span className="text-xs leading-relaxed text-ash">
            Lista y duraciones transcritas de tienda oficial.{' '}
            {volume.sources.map((source, index) => (
              <span key={source}>
                {index > 0 ? ' · ' : ''}
                <a
                  href={source}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-sweep text-smoke hover:text-bone"
                >
                  {new URL(source).hostname.replace('www.', '')}
                </a>
              </span>
            ))}
          </span>
        </div>
      </div>
    </article>
  );
}

const ERA_OPTIONS: { value: NonNullable<RecommendationRequest['era']>; label: string }[] = [
  { value: 'cualquiera', label: 'Todo el catálogo' },
  { value: 'inicios', label: 'Los inicios, 2012 a 2016' },
  { value: 'mitad', label: 'La mitad, 2016 a 2021' },
  { value: 'nuevo', label: 'Lo nuevo, 2021 a 2026' },
];

function Recommender() {
  const engine = useMemo(() => getActiveEngine(), []);
  const [era, setEra] = useState<NonNullable<RecommendationRequest['era']>>('nuevo');
  const [withFeaturesOnly, setWithFeaturesOnly] = useState(false);
  const [singlesOnly, setSinglesOnly] = useState(false);
  const [results, setResults] = useState<RecommendationResult[]>(() =>
    engine.recommend({ era: 'nuevo', limit: 3 }, catalog),
  );

  function run(next?: Partial<RecommendationRequest>) {
    const request: RecommendationRequest = {
      era,
      withFeaturesOnly,
      singlesOnly,
      limit: 3,
      ...next,
    };
    const output = engine.recommend(request, catalog);
    setResults(output);
    trackEvent('recommender_run', {
      engine: engine.id,
      era: request.era ?? 'cualquiera',
      withFeaturesOnly: Boolean(request.withFeaturesOnly),
      singlesOnly: Boolean(request.singlesOnly),
      results: output.length,
    });
  }

  return (
    <div className="reveal panel p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-body text-[11px] font-semibold tracking-[0.3em] text-blood-ink uppercase">
            Sala de escucha
          </p>
          <h3 className="mt-2 font-display text-2xl text-bone sm:text-3xl">Filtro de catálogo</h3>
        </div>
        <Badge kind="aviso" />
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-smoke">
        {engine.label}: {engine.description} Elige unos criterios y mira qué cortes del catálogo
        encajan. No hay ninguna llamada a internet.
      </p>

      <fieldset className="mt-6">
        <legend className="font-body text-[11px] font-semibold tracking-[0.24em] text-smoke uppercase">
          Época
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {ERA_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={era === option.value}
              onClick={() => {
                setEra(option.value);
                run({ era: option.value });
              }}
              className="btn-outline px-4 py-3 font-body text-xs font-semibold tracking-[0.12em] uppercase"
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-3 text-sm text-smoke">
          <input
            type="checkbox"
            checked={withFeaturesOnly}
            onChange={(event) => {
              setWithFeaturesOnly(event.target.checked);
              run({ withFeaturesOnly: event.target.checked });
            }}
            className="h-4 w-4 accent-[#c4161d]"
          />
          Solo cortes con colaboraciones
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-smoke">
          <input
            type="checkbox"
            checked={singlesOnly}
            onChange={(event) => {
              setSinglesOnly(event.target.checked);
              run({ singlesOnly: event.target.checked });
            }}
            className="h-4 w-4 accent-[#c4161d]"
          />
          Solo adelantos verificados
        </label>
      </div>

      <ul className="mt-8 divide-y divide-steel border-y border-steel">
        {results.length === 0 ? (
          <li className="py-6 text-sm text-ash">
            Con estos criterios no queda ningún corte. Prueba a quitar un filtro.
          </li>
        ) : (
          results.map((result) => (
            <li key={result.track.id} className="flex items-baseline gap-4 py-4">
              <span className="font-display text-lg text-blood-ink">
                {String(result.track.year).slice(2)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-bone">
                  {result.track.title}
                </span>
                <span className="mt-1 block text-xs text-smoke">{result.reason}</span>
              </span>
            </li>
          ))
        )}
      </ul>

      <p className="mt-5 text-xs leading-relaxed text-ash">
        Puntuación calculada en tu dispositivo a partir de campos verificables: año, volumen,
        duración, colaboraciones y condición de adelanto. No se guarda ningún perfil de usuario y no
        se envía nada a ningún servidor.
      </p>
    </div>
  );
}

function Archive() {
  return (
    <div className="border-t border-steel">
      <section className="border-b border-steel bg-ink px-4 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-px border border-steel bg-steel sm:grid-cols-2 lg:grid-cols-4">
            {[
              { v: String(counts.volumes), l: 'Volúmenes' },
              { v: String(counts.tracks), l: 'Cortes catalogados' },
              { v: String(counts.withFeatures), l: 'Cortes con colaboración' },
              { v: String(counts.singles), l: 'Adelantos verificados' },
            ].map((item) => (
              <div key={item.l} className="bg-carbon p-5">
                <dt className="sr-only">{item.l}</dt>
                <dd>
                  <span className="block font-display text-4xl leading-none text-bone">{item.v}</span>
                  <span className="mt-2 block text-xs tracking-[0.16em] text-ash uppercase">
                    {item.l}
                  </span>
                </dd>
              </div>
            ))}
          </div>

          <div className="mt-20">
            <SectionHeading
              index="01 · Integrantes"
              title="Los tres que firman"
              aside={<Badge kind="real" />}
            />
            <div className="mt-12 grid gap-px border border-steel bg-steel lg:grid-cols-3">
              {members.map((member) => (
                <article key={member.id} className="reveal flex flex-col bg-carbon p-6 sm:p-8">
                  <span
                    className="font-display text-[7rem] leading-none text-outline select-none"
                    aria-hidden="true"
                  >
                    {member.alias.charAt(0)}
                  </span>
                  <h3 className="mt-2 font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-none text-bone">
                    {member.alias}
                  </h3>
                  <p className="mt-4 text-base font-semibold text-bone">{member.realName}</p>
                  <dl className="mt-5 space-y-2 border-t border-steel pt-5 text-sm">
                    <div className="flex gap-3">
                      <dt className="w-24 shrink-0 text-ash">Nacimiento</dt>
                      <dd className="text-smoke">{member.born}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="w-24 shrink-0 text-ash">De</dt>
                      <dd className="text-smoke">{member.from}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="w-24 shrink-0 text-ash">Rol</dt>
                      <dd className="text-smoke">{member.role}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="w-24 shrink-0 text-ash">Además</dt>
                      <dd className="text-smoke">{member.project}</dd>
                    </div>
                  </dl>
                  <p className="mt-5 flex-1 text-sm leading-relaxed text-ash">{member.note}</p>
                  <a
                    href={member.source}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-sweep mt-6 self-start text-[11px] font-semibold tracking-[0.2em] text-smoke uppercase hover:text-bone"
                  >
                    Fuente: {new URL(member.source).hostname.replace('www.', '')}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading
            index="02 · Discografía"
            title="La serie completa"
            lead="Abre cada volumen para ver la lista de cortes. Los adelantos verificados van marcados. Donde no hay dato de duración publicado, la celda queda marcada como sin dato en lugar de rellenarse a ojo."
          />
          <div className="mt-12 space-y-4">
            {volumes.map((volume, index) => (
              <VolumeBlock
                key={volume.id}
                volumeId={volume.id}
                defaultOpen={index === volumes.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-steel bg-ink px-4 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading index="03 · Motor" title="Recomendación sin servidor" />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <Recommender />
            <div className="reveal space-y-6">
              <p className="text-sm leading-relaxed text-smoke">
                La capa de recomendación está separada de la interfaz. Hoy funciona con un motor
                local que solo lee campos verificables del catálogo.
              </p>
              <ul className="divide-y divide-steel border-y border-steel">
                {[
                  { k: 'Sin API de IA', v: 'Cero llamadas a modelos. El cálculo es aritmética local.' },
                  { k: 'Sin claves', v: 'El frontend no lleva ninguna variable de entorno con secreto.' },
                  { k: 'Sin perfil', v: 'No se guarda historial ni identificadores de usuario.' },
                ].map((item) => (
                  <li key={item.k} className="py-4">
                    <p className="font-display text-sm tracking-[0.16em] text-bone uppercase">
                      {item.k}
                    </p>
                    <p className="mt-1 text-sm text-smoke">{item.v}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading
            index="04 · Cronología"
            title="Lo que se puede fechar"
            lead={`Hitos de Hijos de la Ruina y del contexto en el que nace, hasta la gira ${tourName}. Cada entrada lleva su fuente.`}
          />
          <ol className="mt-12 border-l border-steel">
            {timeline.map((event) => (
              <li key={`${event.year}-${event.title}`} className="reveal relative pl-6 pb-11 sm:pl-10">
                <span
                  className="absolute top-2 -left-[5px] h-[9px] w-[9px] rounded-full bg-blood-bright"
                  aria-hidden="true"
                />
                <p className="font-body text-xs tracking-[0.24em] text-ash uppercase">
                  {event.date || event.year}
                </p>
                <h3 className="mt-2 font-display text-xl tracking-[0.03em] text-bone sm:text-2xl">
                  {event.title}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-smoke sm:text-base">
                  {event.text}
                </p>
                <a
                  href={event.source}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-sweep mt-3 inline-block text-[11px] font-semibold tracking-[0.2em] text-smoke uppercase hover:text-bone"
                >
                  {new URL(event.source).hostname.replace('www.', '')}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-steel bg-ink px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="font-display text-2xl tracking-[0.04em] text-bone sm:text-3xl">
            Fuentes utilizadas
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-smoke">
            Todo lo que aparece como REAL en esta experiencia sale de estos enlaces. Ninguna cifra,
            fecha, canción, letra ni colaboración se ha inventado.
          </p>
          <ul className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {allSources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-sweep block py-1 text-xs text-smoke hover:text-bone"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vista                                                               */
/* ------------------------------------------------------------------ */

export function Perfil() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [answers, setAnswers] = useState<number[]>(() => new Array(QUESTIONS.length).fill(-1));
  const [index, setIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const [reaction, setReaction] = useState(false);
  const [result, setResult] = useState<RuinaResult | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  /* Modo inmersivo: mientras dura la intro, el test y el cierre, la interfaz
     del sitio (cabecera con los numeros de navegacion y sonido) se aparta para
     que la pantalla sea solo la experiencia. Vuelve al salir el resultado. */
  useEffect(() => {
    const root = document.documentElement;
    if (phase === 'result') {
      root.removeAttribute('data-ruina-inmersion');
      return;
    }
    root.setAttribute('data-ruina-inmersion', '');
    return () => root.removeAttribute('data-ruina-inmersion');
  }, [phase]);

  const start = () => {
    soundManager.play('transition');
    trackEvent('cta_click', { id: 'ruina_inicio' });
    setPhase('test');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const answer = (optionIndex: number) => {
    if (locked) return;
    setLocked(true);
    setChosen(optionIndex);
    soundManager.play('click');
    setAnswers((current) => {
      const next = [...current];
      next[index] = optionIndex;
      return next;
    });
    setReaction(true);
    window.setTimeout(() => setReaction(false), 460);
    window.setTimeout(() => {
      setChosen(null);
      setLocked(false);
      if (index + 1 < QUESTIONS.length) {
        setIndex((value) => value + 1);
        window.scrollTo({ top: 0, behavior: 'auto' });
      } else {
        setPhase('reveal');
      }
    }, 430);
  };

  const finishReveal = () => {
    setResult(computeRuina(answers));
    setPhase('result');
  };

  const repeat = () => {
    setAnswers(new Array(QUESTIONS.length).fill(-1));
    setIndex(0);
    setChosen(null);
    setLocked(false);
    setResult(null);
    setPhase('intro');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  if (phase === 'intro') {
    return (
      <>
        <Intro onStart={start} />
        <EasterEgg />
      </>
    );
  }

  if (phase === 'test') {
    return (
      <>
        <TestScreen
          index={index}
          locked={locked}
          chosen={chosen}
          reaction={reaction}
          onAnswer={answer}
        />
        <EasterEgg />
      </>
    );
  }

  if (phase === 'reveal' || !result) {
    return (
      <>
        <Reveal onDone={finishReveal} />
        <EasterEgg />
      </>
    );
  }

  return (
    <div>
      <ResultView result={result} onRepeat={repeat} />

      <section className="border-t border-steel bg-void px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-[720px]">
          <h2 className="font-display text-3xl leading-none text-bone sm:text-4xl">
            ¿Y la ruina de verdad?
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-smoke">
            Lo que has hecho es cosa tuya. Lo de Hijos de la Ruina está aquí abajo, con fuente en
            cada dato. Ábrelo si te apetece escarbar.
          </p>
          <button
            type="button"
            className="btn-outline mt-6 px-5 py-3 font-display text-xs tracking-[0.2em] uppercase"
            aria-expanded={archiveOpen}
            onClick={() => {
              setArchiveOpen((value) => !value);
              trackEvent('cta_click', { id: 'ruina_expediente', open: !archiveOpen });
            }}
          >
            {archiveOpen ? 'Cerrar el expediente' : 'Abrir el expediente'}
          </button>
        </div>
      </section>

      {archiveOpen ? <Archive /> : null}

      <EasterEgg />
    </div>
  );
}
