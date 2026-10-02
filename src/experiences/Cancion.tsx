import { useMemo, useRef, useState } from 'react';
import { Badge } from '../components/Badge';
import { catalog } from '../data';
import { findExperience } from '../data/experiences';
import { OFFICIAL_YOUTUBE_CHANNEL, TRACK_LINKS, VERIFIED_LINK_COUNT, VERIFIED_VIDEO_COUNT } from '../lib/ai/musicLinks';
import { analyseStory, getActiveStoryEngine } from '../lib/ai/storyEngine';
import type { StoryMatch, StoryReading } from '../lib/ai/storyEngine';
import { Link, ROUTES } from '../lib/router';
import { trackEvent } from '../lib/trackEvent';
import '../styles/cancion.css';

const EXPERIENCE = findExperience(ROUTES.cancion);

/** Ejemplos para quien no sabe por donde empezar. Textos corrientes, nada de folleto. */
const EXAMPLES: { label: string; text: string }[] = [
  {
    label: 'Un mes sin dormir',
    text: 'Llevo un mes sin dormir. Salgo del curro de noche, me tomo la última en el bar de la esquina y vuelvo a casa andando por el barrio. No sé si esto es aguantar o es que ya no siento nada.',
  },
  {
    label: 'Se marchó en octubre',
    text: 'Se marchó en octubre y desde entonces todo me suena a la misma canción triste. Paso las tardes tirado en el sofá, con la ventana abierta y la ciudad de fondo.',
  },
  {
    label: 'Quiero desaparecer',
    text: 'Estoy hasta arriba de todo el mundo. Quiero coger el coche, hacer mil kilómetros y no volver. Solo yo, la carretera y la música a todo volumen.',
  },
];

const DIMENSION_LABEL: Record<string, string> = {
  emocion: 'Emoción',
  contexto: 'Contexto',
  tema: 'Tema',
};

function scrollIntoViewSoft(node: HTMLElement | null): void {
  if (!node) return;
  const reduce =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

/** Cinta de onda: motivo grafico de la experiencia, hecho en CSS. */
function WaveStrip({ bars = 26, className = '' }: { bars?: number; className?: string }) {
  const items = useMemo(
    () =>
      Array.from({ length: bars }, (_, index) => ({
        delay: `${(index % 9) * 0.12}s`,
        height: `${18 + ((index * 37) % 70)}%`,
        key: `bar-${index}`,
      })),
    [bars],
  );

  return (
    <div className={`cn-wave ${className}`} aria-hidden="true">
      {items.map((item) => (
        <span key={item.key} style={{ animationDelay: item.delay, height: item.height }} />
      ))}
    </div>
  );
}

function IntensityMeter({ value }: { value: StoryReading['intensity'] }) {
  const steps = [1, 2, 3];
  const on = value === 'alta' ? 3 : value === 'media' ? 2 : 1;
  return (
    <span className="cn-intensidad" title={`Intensidad ${value}`} aria-label={`Intensidad ${value}`}>
      {steps.map((step) => (
        <span key={step} data-on={step <= on} />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Vista                                                               */
/* ------------------------------------------------------------------ */

export function Cancion() {
  const [text, setText] = useState('');
  const [reading, setReading] = useState<StoryReading | null>(null);
  const [matches, setMatches] = useState<StoryMatch[]>([]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const canRun = text.trim().length >= 12;

  function run(): void {
    const next = analyseStory(text);
    const results = getActiveStoryEngine().recommend(next, catalog, {
      limit: 3,
      links: TRACK_LINKS,
    });
    setReading(next);
    setMatches(results);
    setPickedId(null);
    trackEvent('recommender_run', {
      tags: next.tags.length,
      intensity: next.intensity,
      matches: results.length,
    });
    window.setTimeout(() => scrollIntoViewSoft(resultRef.current), 60);
  }

  const main = matches.find((match) => match.trackId === pickedId) ?? matches[0];
  const alternatives = matches.filter((match) => match.trackId !== main?.trackId);

  // Etiquetas que el texto ha dado pero que el corte elegido no recoge. Se usan
  // para decir con claridad que parte de la historia se queda sin cancion, en vez
  // de presentar una coincidencia floja como si fuera redonda.
  const uncoveredTags =
    reading && main
      ? reading.tags.filter((tag) => !main.matchedTags.some((matched) => matched.id === tag.id))
      : [];

  const grouped = useMemo(() => {
    if (!reading) return [];
    return (['emocion', 'contexto', 'tema'] as const)
      .map((dimension) => ({
        dimension,
        tags: reading.tags.filter((tag) => tag.dimension === dimension),
      }))
      .filter((group) => group.tags.length > 0);
  }, [reading]);

  return (
    <div>
      {/* Portada */}
      <section className="relative overflow-hidden px-4 pt-24 pb-10 sm:px-8 sm:pt-32">
        <div className="tech-grid absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1400px]">
          <p className="rise font-body text-[11px] font-semibold tracking-[0.36em] text-blood-ink uppercase">
            {EXPERIENCE?.n ?? '04'} · Canción
          </p>
          <h1 className="rise mt-4 max-w-4xl font-display text-[clamp(2.4rem,10vw,5.6rem)] leading-[0.9] text-bone">
            Cuéntame tu historia
          </h1>
          <p className="rise mt-4 max-w-2xl font-display text-[clamp(1rem,4.4vw,1.6rem)] leading-tight text-blood-ink">
            Te diremos qué suena de fondo
          </p>
          <p className="rise mt-6 max-w-2xl text-base leading-relaxed text-smoke sm:text-lg">
            Escribe lo que te está pasando, sin ordenar y sin corregir. El motor lee el texto en tu
            propio dispositivo, saca las emociones, el contexto y los temas, y busca en el catálogo
            real de Hijos de la Ruina el corte que mejor encaja.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <WaveStrip bars={30} className="flex-1" />
            <Badge kind="aviso" />
          </div>
        </div>
      </section>

      {/* Escritorio de historia */}
      <section className="border-y border-steel bg-ink px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <div className="cn-desk">
            <label className="cn-label" htmlFor="hdlr-historia">
              Tu historia
            </label>
            <textarea
              id="hdlr-historia"
              className="cn-textarea"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Cuéntame qué está pasando..."
              rows={7}
              maxLength={1200}
              aria-describedby="hdlr-historia-ayuda"
            />
            <div className="cn-desk-footer">
              <button
                type="button"
                className="btn-blood inline-flex min-h-[52px] items-center px-6 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!canRun}
                onClick={() => {
                  trackEvent('cta_click', { id: 'cancion_buscar' });
                  run();
                }}
              >
                <span className="font-body text-[13px] font-bold tracking-[0.2em] uppercase">
                  Encontrar mi canción
                </span>
              </button>
              <span className="cn-counter">
                {text.trim() ? `${text.trim().split(/\s+/).length} palabras` : 'Sin escribir'}
              </span>
            </div>
            <p className="cn-hint" id="hdlr-historia-ayuda">
              {canRun
                ? 'Cuando quieras, pulsa el botón. Puedes volver a escribirlo y buscar otra vez: no se guarda nada.'
                : 'Escribe al menos un par de líneas para que haya algo que leer.'}
            </p>
          </div>

          <aside className="grid gap-3">
            <p className="font-body text-[11px] font-semibold tracking-[0.28em] text-ash uppercase">
              Si no sabes cómo empezar
            </p>
            {EXAMPLES.map((example) => (
              <button
                key={example.label}
                type="button"
                className="cn-example"
                onClick={() => {
                  setText(example.text);
                  trackEvent('cta_click', { id: 'cancion_ejemplo', label: example.label });
                }}
              >
                <span className="block font-body text-[11px] font-bold tracking-[0.18em] text-blood-ink uppercase">
                  {example.label}
                </span>
                <span className="mt-1 block">{example.text}</span>
              </button>
            ))}
            <p className="text-xs leading-relaxed text-ash">
              Son historias de ejemplo, escritas para la demo. No son datos de nadie.
            </p>
          </aside>
        </div>
      </section>

      {/* Resultado */}
      <section ref={resultRef} className="px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-[1100px]">
          {!reading ? (
            <div className="border border-steel bg-ink p-6 sm:p-8">
              <p className="font-body text-[11px] font-semibold tracking-[0.3em] text-ash uppercase">
                Todavía sin historia
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-smoke">
                Aquí aparecerá tu banda sonora. Escribe arriba y pulsa{' '}
                <span className="text-bone">Encontrar mi canción</span>.
              </p>
            </div>
          ) : null}

          {reading ? (
            <div className="cn-readout">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-body text-[11px] font-semibold tracking-[0.3em] text-smoke uppercase">
                  Lo que he leído en tu texto
                </p>
                <span className="flex items-center gap-2 font-body text-[11px] font-semibold tracking-[0.2em] text-ash uppercase">
                  Intensidad {reading.intensity}
                  <IntensityMeter value={reading.intensity} />
                </span>
              </div>

              {grouped.length > 0 ? (
                <div className="mt-4 grid gap-4">
                  {grouped.map((group) => (
                    <div key={group.dimension}>
                      <p className="font-body text-[10px] font-bold tracking-[0.24em] text-ash uppercase">
                        {DIMENSION_LABEL[group.dimension]}
                      </p>
                      <div className="cn-chips mt-2">
                        {group.tags.map((tag) => (
                          <span key={tag.id} className="cn-chip" data-dim={tag.dimension}>
                            {tag.chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-smoke">
                  No he reconocido ninguna emoción ni ningún contexto en el texto.
                </p>
              )}

              {reading.intensitySignals.length > 0 ? (
                <p className="mt-4 text-xs leading-relaxed text-ash">
                  Intensidad {reading.intensity} por: {reading.intensitySignals.join('; ')}.
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Coincidencia principal */}
          {reading && main ? (
            <div className="cn-result mt-6">
              <p className="cn-eyebrow">Tu historia tiene una banda sonora</p>
              <h2 className="cn-song">{main.title}</h2>
              <p className="mt-3 font-body text-sm font-semibold tracking-[0.14em] text-blood-ink uppercase">
                {main.artist}
              </p>
              <p className="cn-reason">{main.reason}</p>

              {!main.strong || uncoveredTags.length > 0 ? (
                <p className="cn-confidence">
                  {!main.strong
                    ? 'Coincidencia ajustada: ningún corte del catálogo recoge tu historia entera, así que este es el que más se acerca. '
                    : ''}
                  {uncoveredTags.length > 0
                    ? `En el catálogo no hay ningún corte que recoja ${uncoveredTags
                        .map((tag) => tag.chip.toLowerCase())
                        .join(', ')}: prefiero decírtelo antes que forzar otra lectura.`
                    : ''}
                </p>
              ) : null}

              <dl className="cn-meta">
                <div>
                  <dt>Volumen</dt>
                  <dd>{main.volumeTitle}</dd>
                </div>
                <div>
                  <dt>Año</dt>
                  <dd>{main.year}</dd>
                </div>
              </dl>

              {main.matchedTags.length > 0 ? (
                <div className="mt-5">
                  <p className="font-body text-[10px] font-bold tracking-[0.24em] text-ash uppercase">
                    Etiquetas que han coincidido
                  </p>
                  <div className="cn-chips mt-2">
                    {main.matchedTags.map((tag) => (
                      <span key={tag.id} className="cn-chip" data-dim={tag.dimension} data-heavy="true">
                        {tag.chip}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="cn-actions">
                {main.spotify ? (
                  <a
                    className="cn-listen"
                    data-brand="spotify"
                    href={main.spotify}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={() => trackEvent('cta_click', { id: 'cancion_spotify', track: main.trackId })}
                  >
                    <span>
                      Escuchar en Spotify
                      <span className="cn-listen-note">enlace verificado</span>
                    </span>
                  </a>
                ) : null}

                {main.youtube ? (
                  <a
                    className="cn-listen"
                    data-brand="youtube"
                    href={main.youtube}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={() => trackEvent('cta_click', { id: 'cancion_youtube', track: main.trackId })}
                  >
                    <span>
                      Ver en YouTube
                      <span className="cn-listen-note">canal oficial</span>
                    </span>
                  </a>
                ) : null}
              </div>

              {!main.youtube ? (
                <p className="mt-4 text-xs leading-relaxed text-ash">
                  De este corte no hay vídeo oficial propio comprobado, así que no te pongo un botón
                  que no llevaría a ninguna parte. Está en{' '}
                  <a
                    className="link-sweep text-smoke underline decoration-steel underline-offset-4 hover:text-bone"
                    href={OFFICIAL_YOUTUBE_CHANNEL.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    el canal oficial de Natos y Waor
                  </a>
                  .
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Alternativas */}
          {reading && main && alternatives.length > 0 ? (
            <div className="mt-10">
              <p className="font-body text-[11px] font-semibold tracking-[0.3em] text-smoke uppercase">
                Otras que también encajan
              </p>
              <ul className="mt-4 grid gap-3">
                {alternatives.map((match) => (
                  <li key={match.trackId}>
                    <button
                      type="button"
                      className="cn-alt"
                      data-strong={match.strong}
                      onClick={() => {
                        setPickedId(match.trackId);
                        trackEvent('recommender_pick', { track: match.trackId, from: main.trackId });
                        scrollIntoViewSoft(resultRef.current);
                      }}
                    >
                      <span className="cn-alt-rank">
                        {match.matchedTags.length === 1
                          ? '1 etiqueta'
                          : `${match.matchedTags.length} etiquetas`}
                      </span>
                      <span>
                        <span className="cn-alt-title block">{match.title}</span>
                        <span className="cn-alt-sub block">
                          {match.volumeTitle} · {match.year} · coincide en{' '}
                          {match.matchedTags.map((tag) => tag.chip).join(', ')}
                        </span>
                      </span>
                      <span className="cn-alt-go">Poner esta</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Aviso honesto cuando no hay nada bueno */}
          {reading && !main ? (
            <div className="cn-empty mt-2">
              <h3 className="font-display">
                {reading.tooShort
                  ? 'Cuéntame un poco más'
                  : reading.tags.length === 0
                    ? 'No he sabido leerlo'
                    : 'No te voy a inventar una canción'}
              </h3>
              {reading.tooShort ? (
                <p>
                  Con tan poco texto no hay nada que leer. Escribe unas líneas más: qué te pasa, dónde
                  estás, con quién.
                </p>
              ) : reading.tags.length === 0 ? (
                <p>
                  No he reconocido ninguna emoción, ningún contexto ni ningún tema en lo que has
                  escrito. Prueba a contar cómo te sientes, dónde estás o qué te ronda.
                </p>
              ) : (
                <p>
                  He leído {reading.tags.map((tag) => tag.chip).join(', ')}, pero en el catálogo no hay
                  ningún corte que encaje de verdad con eso. Prefiero decírtelo antes que colgarte una
                  canción porque sí. Prueba con otras palabras.
                </p>
              )}
            </div>
          ) : null}

          <p className="cn-method">
            Cómo funciona: el texto se analiza aquí mismo, en tu navegador, y no se envía a ningún
            servidor. El motor no lee ni reproduce letras (este proyecto no aloja letras de nadie):
            compara las etiquetas que saca de tu texto con el título del corte y con sus datos
            publicados. Los enlaces a Spotify y YouTube no salen de la ficha de discografía (esa
            ficha no guarda direcciones): vienen de un registro aparte de enlaces comprobados uno a
            uno en fuentes oficiales, {VERIFIED_LINK_COUNT} cortes con enlace y {VERIFIED_VIDEO_COUNT}{' '}
            con vídeo propio. Si un corte no tiene enlace verificado, sencillamente no aparece el
            botón.
          </p>
        </div>
      </section>

      {/* Cierre */}
      <section className="border-t border-steel bg-ink px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-body text-[11px] font-semibold tracking-[0.3em] text-blood-ink uppercase">
              En contexto
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.7rem,6vw,2.6rem)] leading-none text-bone">
              Del catálogo hay {VERIFIED_LINK_COUNT} cortes con enlace verificado
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-smoke">
              {VERIFIED_VIDEO_COUNT} de ellos tienen además vídeo propio en el canal oficial. Todos
              salen en la serie completa, volumen a volumen.
            </p>
          </div>
          <Link
            to={ROUTES.perfil}
            className="btn-outline inline-flex min-h-[48px] shrink-0 items-center px-5 font-body text-xs font-bold tracking-[0.22em] uppercase"
            onClick={() => trackEvent('cta_click', { id: 'cancion_a_perfil' })}
          >
            Ver la serie completa
          </Link>
        </div>
      </section>
    </div>
  );
}
