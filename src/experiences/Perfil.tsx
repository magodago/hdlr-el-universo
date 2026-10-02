import { useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { SectionHeading } from '../components/SectionHeading';
import { members, timeline, volumes, counts, allSources, catalog, tourName } from '../data';
import { getActiveEngine, type RecommendationRequest, type RecommendationResult } from '../lib/ai';
import { trackEvent } from '../lib/trackEvent';

/* ------------------------------------------------------------------ */
/* Lista de cortes de un volumen                                       */
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
          <span className="font-display text-sm text-ash">
            {String(track.n).padStart(2, '0')}
          </span>
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
              <span className="mt-1 block text-xs text-smoke">
                Con {track.features.join(', ')}
              </span>
            ) : null}
          </span>
          <span className="font-body text-xs tabular-nums text-ash">{track.duration ?? '—'}</span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Bloque de discografia                                               */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Tarjeta para compartir                                              */
/* ------------------------------------------------------------------ */

function buildShareText(results: RecommendationResult[]): string {
  const top = results[0];
  if (!top) {
    return 'HDLR, El Universo. Hijos de la Ruina: cuatro volúmenes de Natos, Waor y Recycled J y una gira 2026.';
  }
  return `Con el filtro de HDLR, El Universo me sale "${top.track.title}" (${top.track.volumeTitle}, ${top.track.year}). Hijos de la Ruina: cuatro volúmenes de Natos, Waor y Recycled J.`;
}

function ShareCard({ results }: { results: RecommendationResult[] }) {
  const [copied, setCopied] = useState(false);
  const top = results[0];
  const canShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const url = typeof window !== 'undefined' ? window.location.href : '';

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${buildShareText(results)} ${url}`);
      setCopied(true);
      trackEvent('share_card', { via: 'copy', track: top?.track.id ?? 'ninguno' });
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* portapapeles no disponible: no se rompe nada */
    }
  }

  async function share() {
    try {
      await navigator.share({
        title: 'HDLR, El Universo',
        text: buildShareText(results),
        url,
      });
      trackEvent('share_card', { via: 'nativo', track: top?.track.id ?? 'ninguno' });
    } catch {
      /* el usuario ha cerrado el diálogo del sistema */
    }
  }

  return (
    <div className="relative mt-8 overflow-hidden border border-blood-bright/45 bg-void p-5 sm:p-6">
      <div className="tech-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative">
        <p className="font-body text-[10px] font-semibold tracking-[0.3em] text-blood-ink uppercase">
          Tarjeta para compartir
        </p>
        <p className="mt-3 font-display text-2xl leading-none text-bone sm:text-3xl">
          {top ? top.track.title : 'Sin corte con estos filtros'}
        </p>
        <p className="mt-2 font-body text-xs tracking-[0.16em] text-smoke uppercase">
          {top ? `${top.track.volumeTitle} · ${top.track.year}` : 'Cambia los criterios'}
        </p>
        <p className="mt-4 max-w-lg text-xs leading-relaxed text-ash">
          Se genera en tu dispositivo con las reglas del motor local. No se envía a ningún servidor
          ni se guarda nada.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {canShare ? (
            <button
              type="button"
              onClick={share}
              className="btn-blood inline-flex min-h-[44px] items-center border border-bone/25 px-5 py-3 font-display text-xs tracking-[0.2em] text-bone uppercase"
            >
              Compartir
            </button>
          ) : null}
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-[44px] items-center border border-bone/45 px-5 py-3 font-display text-xs tracking-[0.2em] text-bone uppercase transition-colors hover:border-bone hover:bg-steel"
          >
            {copied ? 'Copiado' : 'Copiar texto'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Motor de recomendacion local                                        */
/* ------------------------------------------------------------------ */

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
          <h3 className="mt-2 font-display text-2xl text-bone sm:text-3xl">
            Filtro de catálogo
          </h3>
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
              className={`inline-flex min-h-[44px] items-center border px-4 py-3 font-body text-xs font-semibold tracking-[0.12em] uppercase transition-colors ${
                era === option.value
                  ? 'border-blood-bright bg-blood text-bone'
                  : 'border-bone/45 text-bone hover:border-bone hover:bg-steel'
              }`}
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

      <ShareCard results={results} />

      <p className="mt-5 text-xs leading-relaxed text-ash">
        Puntuación calculada en tu dispositivo a partir de campos verificables: año, volumen,
        duración, colaboraciones y condición de adelanto. No se guarda ningún perfil de usuario y no
        se envía nada a ningún servidor.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vista                                                               */
/* ------------------------------------------------------------------ */

export function Perfil() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 pt-24 pb-16 sm:px-8 sm:pt-32">
        <div className="tech-grid absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1400px]">
          <p className="rise font-body text-[11px] font-semibold tracking-[0.36em] text-blood-ink uppercase">
            02 · Perfil
          </p>
          <h1 className="rise mt-5 font-display text-[clamp(3rem,12vw,9rem)] leading-[0.84] text-bone [animation-delay:100ms]">
            TRES NOMBRES,
            <br />
            CUATRO VOLÚMENES
          </h1>
          <p className="fade-in mt-8 max-w-2xl text-base leading-relaxed text-smoke sm:text-lg [animation-delay:320ms]">
            Quién está detrás de Hijos de la Ruina, qué se ha editado en cada entrega y qué se puede
            afirmar con fuente. Lo que no está verificado, no aparece.
          </p>
          <dl className="mt-12 grid gap-px border border-steel bg-steel sm:grid-cols-2 lg:grid-cols-4">
            {[
              { v: String(counts.volumes), l: 'Volúmenes' },
              { v: String(counts.tracks), l: 'Cortes catalogados' },
              { v: String(counts.withFeatures), l: 'Cortes con colaboración' },
              { v: String(counts.singles), l: 'Adelantos verificados' },
            ].map((item) => (
              <div key={item.l} className="bg-carbon p-5">
                <dt className="sr-only">{item.l}</dt>
                <dd>
                  <span className="block font-display text-4xl leading-none text-bone">
                    {item.v}
                  </span>
                  <span className="mt-2 block text-xs tracking-[0.16em] text-ash uppercase">
                    {item.l}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Integrantes */}
      <section className="border-y border-steel bg-ink px-4 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1400px]">
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
      </section>

      {/* Discografia */}
      <section className="px-4 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading
            index="02 · Discografía"
            title="La serie completa"
            lead="Abre cada volumen para ver la lista de cortes. Los adelantos verificados van marcados. Donde no hay dato de duración publicado, la celda queda vacía en lugar de rellenarse a ojo."
          />
          <div className="mt-12 space-y-4">
            {volumes.map((volume, index) => (
              <VolumeBlock key={volume.id} volumeId={volume.id} defaultOpen={index === volumes.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* Motor local */}
      <section className="border-y border-steel bg-ink px-4 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading index="03 · Motor" title="Recomendación sin servidor" />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <Recommender />
            <div className="reveal space-y-6">
              <p className="text-sm leading-relaxed text-smoke">
                La capa de recomendación está separada de la interfaz. Hoy funciona con un motor
                local que solo lee campos verificables del catálogo. La interfaz está preparada para
                cambiar de motor sin tocar componentes: basta con implementar la misma interfaz y
                registrarlo.
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

      {/* Cronologia */}
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

      {/* Fuentes */}
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
