import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '../components/Badge';
import { Marquee } from '../components/Marquee';
import { concerts } from '../data';
import { findExperience } from '../data/experiences';
import { LIVE_SESSIONS, OFFICIAL_YOUTUBE_CHANNEL } from '../lib/ai/musicLinks';
import { ROUTES } from '../lib/router';
import { trackEvent } from '../lib/trackEvent';
import { Noche as NocheTarjeta } from './NocheTarjeta';
import '../styles/live.css';

/**
 * HDLR LIVE: la puerta y el modo concierto.
 *
 * Toda la informacion de ciudad, fecha y recinto sale de src/data/concerts.json.
 * Nada inventado: lo que no esta confirmado por la fuente oficial se pinta con la
 * etiqueta DEMO, y lo que es simulacion de la demo se dice con todas las letras.
 */

const EXPERIENCE = findExperience(ROUTES.live);
const SHOWS_SOURCE = 'https://natosywaor.com/pages/shows';
const CITY_ID = 'salamanca';

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  past: boolean;
}

function remainingUntil(dateISO: string, now: number): Remaining {
  const target = new Date(`${dateISO}T00:00:00`).getTime();
  const diff = target - now;
  if (!Number.isFinite(target) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };
  }
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    past: false,
  };
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Fecha corta dd.mm.aa a partir del dateISO del concierto. Nunca se escribe a mano. */
function compactDate(dateISO: string): string {
  const [year, month, day] = dateISO.split('-');
  if (!year || !month || !day) return '';
  return `${day}.${month}.${year.slice(2)}`;
}

/** Codigo de noche. Es un dato simulado de la demo y se marca como tal. */
function makeNightCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  let tail = '';
  for (const byte of bytes) tail += alphabet[byte % alphabet.length];
  return `SLM-1710-${tail}`;
}

/* ------------------------------------------------------------------ */
/* Vista                                                               */
/* ------------------------------------------------------------------ */

export function Live() {
  const experience = EXPERIENCE;
  const concert = concerts.find((entry) => entry.id === CITY_ID);
  const dateISO = concert?.dateISO ?? '';

  const [mode, setMode] = useState<'gate' | 'inside' | 'noche'>('gate');
  const [curtain, setCurtain] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [nightCode, setNightCode] = useState(() => makeNightCode());

  const remaining = useMemo(() => remainingUntil(dateISO, now), [dateISO, now]);

  // La puerta ocupa la pantalla entera: mientras esta abierta, el fondo no scrollea.
  useEffect(() => {
    if (mode !== 'gate') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mode]);

  // Cuenta atras: un tic por segundo, solo dentro del concierto.
  useEffect(() => {
    if (mode !== 'inside') return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [mode]);

  function enter(): void {
    trackEvent('gate_enter', { id: 'hdlr_live', city: concert?.id ?? 'desconocida' });
    setCurtain(true);
    window.setTimeout(() => setMode('inside'), 430);
    window.setTimeout(() => {
      setCurtain(false);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 960);
  }

  function goNight(): void {
    setNightCode(makeNightCode());
    setMode('noche');
    trackEvent('cta_click', { id: 'hdlr_live_salir' });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  if (!concert) {
    return (
      <section className="px-4 pt-24 pb-16 sm:px-8 sm:pt-32">
        <div className="mx-auto max-w-[1400px]">
          <p className="font-body text-[11px] font-semibold tracking-[0.36em] text-blood-ink uppercase">
            {experience?.n ?? '06'} · Live
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.2rem,9vw,4.4rem)] leading-none text-bone">
            HDLR Live
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-smoke">
            No hay ninguna plaza cargada con el identificador «{CITY_ID}» en el fichero de
            conciertos, así que esta pantalla no tiene nada que enseñar. No me invento una fecha:
            revisa src/data/concerts.json.
          </p>
        </div>
      </section>
    );
  }

  if (mode === 'noche') {
    return (
      <NocheTarjeta
        code={nightCode}
        city={concert.city}
        dateLabel={concert.dateLabel}
        onBack={() => setMode('inside')}
      />
    );
  }

  return (
    <div className="lv-root">
      {curtain ? createPortal(<div className="lv-curtain" aria-hidden="true" />, document.body) : null}

      {/* ---------- Puerta ---------- */}
      {mode === 'gate'
        ? createPortal(
            <div className="lv-gate" role="region" aria-label="Puerta de HDLR Live">
          <div className="lv-gate-glow" aria-hidden="true" />
          <div className="lv-gate-grid" aria-hidden="true" />
          <div className="lv-gate-scan" aria-hidden="true" />

          <div className="lv-gate-inner">
            <p className="lv-gate-kicker rise">HDLR Live</p>
            <h1 className="lv-gate-city rise">{concert.city}</h1>
            <p className="lv-gate-date rise">{compactDate(dateISO)}</p>
            <p className="lv-gate-question rise">
              ¿Vienes a <em>la ruina</em>?
            </p>

            <div className="lv-gate-cta">
              <button type="button" className="lv-gate-enter btn-blood rise" onClick={enter}>
                <span>Estoy dentro</span>
              </button>
            </div>

            <div className="lv-gate-foot">
              <span>
                {concert.dateLabel}
                {remaining.past ? '' : ` · faltan ${remaining.days} días`}
              </span>
              <span className="flex flex-wrap items-center justify-center gap-2">
                {concert.confirmed ? <Badge kind="real" /> : <Badge kind="demo" />}
                <span>{concert.venue}</span>
              </span>
              <a href={SHOWS_SOURCE} target="_blank" rel="noreferrer noopener" className="link-sweep">
                Fechas oficiales en natosywaor.com
              </a>
            </div>
          </div>
        </div>,
            document.body,
          )
        : null}

      {/* ---------- Modo concierto ---------- */}
      {mode === 'inside' ? (
        <>
          <section className="lv-stage px-4 pt-24 pb-14 sm:px-8 sm:pt-28 sm:pb-20">
            <div className="lv-stage-grid" aria-hidden="true" />
            <div className="lv-stage-beam" aria-hidden="true" />

            <div className="relative mx-auto max-w-[1400px]">
              <span className="lv-live-tag">
                <span className="lv-live-dot" aria-hidden="true" />
                Modo concierto
              </span>

              <h1 className="lv-here">Estás dentro</h1>

              <p className="lv-stage-city">{concert.city}</p>
              <p className="lv-stage-sub">
                {compactDate(dateISO)} · {concert.dateLabel}
              </p>

              <div className="lv-eq" aria-hidden="true">
                {Array.from({ length: 24 }, (_, index) => (
                  <span
                    key={`eq-${index}`}
                    style={{
                      height: `${26 + ((index * 41) % 62)}%`,
                      animationDelay: `${(index % 8) * 0.11}s`,
                    }}
                  />
                ))}
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-start">
                <div className="lv-panel">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3>Cuenta atrás</h3>
                    {concert.confirmed ? <Badge kind="real" /> : <Badge kind="demo" />}
                  </div>

                  {remaining.past ? (
                    <p className="mt-4 font-display text-[clamp(1.5rem,7vw,2.6rem)] leading-none text-bone">
                      Esa noche ya pasó
                    </p>
                  ) : (
                    <div className="lv-cd" role="timer" aria-live="off">
                      <div className="lv-cd-cell">
                        <span className="lv-cd-num">{remaining.days}</span>
                        <span className="lv-cd-label">días</span>
                      </div>
                      <div className="lv-cd-cell">
                        <span className="lv-cd-num">{pad(remaining.hours)}</span>
                        <span className="lv-cd-label">horas</span>
                      </div>
                      <div className="lv-cd-cell">
                        <span className="lv-cd-num">{pad(remaining.minutes)}</span>
                        <span className="lv-cd-label">min</span>
                      </div>
                      <div className="lv-cd-cell">
                        <span className="lv-cd-num">{pad(remaining.seconds)}</span>
                        <span className="lv-cd-label">seg</span>
                      </div>
                    </div>
                  )}

                  <p className="lv-cd-note">
                    La hora exacta de apertura de puertas no está publicada, así que la cuenta atrás
                    va al día del concierto, no a una hora inventada.
                  </p>
                </div>

                <div className="lv-panel">
                  <h3>La ficha</h3>
                  <dl className="mt-3">
                    <div className="lv-row">
                      <dt>Plaza</dt>
                      <dd>{concert.city}</dd>
                    </div>
                    <div className="lv-row">
                      <dt>Fecha</dt>
                      <dd>{concert.dateLabel}</dd>
                    </div>
                    <div className="lv-row">
                      <dt>Recinto</dt>
                      <dd>{concert.venue}</dd>
                    </div>
                    <div className="lv-row">
                      <dt>Estado</dt>
                      <dd>{concert.confirmed ? 'Confirmado' : 'Sin confirmar'}</dd>
                    </div>
                  </dl>

                  {concert.nota ? (
                    <p className="mt-4 border-l-2 border-blood-bright pl-3 text-xs leading-relaxed text-ash">
                      {concert.nota}
                    </p>
                  ) : null}

                  <a
                    href={SHOWS_SOURCE}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-sweep mt-5 inline-flex min-h-[44px] items-center text-[11px] font-semibold tracking-[0.2em] text-smoke uppercase hover:text-bone"
                  >
                    Fuente: natosywaor.com
                  </a>
                </div>
              </div>

              <div className="lv-demo-strip mt-6">
                <span>Demo</span>
                <span>
                  Esto es una demo de la experiencia de concierto, no un evento en vivo. La ciudad, la
                  fecha y el recinto son los de la ficha real del concierto; el modo concierto, la
                  cuenta atrás y el código de noche son simulación de esta demo.
                </span>
              </div>

              <div className="mt-10">
                <button type="button" className="lv-exit" onClick={goNight}>
                  <span>Se acabó: quiero mi noche</span>
                </button>
              </div>
            </div>
          </section>

          <Marquee
            items={[concert.city, compactDate(dateISO), 'HDLR Live', 'Hijos de la Ruina', 'Noche cerrada']}
            className="border-y border-blood/40 bg-void"
          />

          <section className="px-4 py-14 sm:px-8 sm:py-20">
            <div className="mx-auto max-w-[1100px]">
              <p className="font-body text-[11px] font-semibold tracking-[0.3em] text-blood-ink uppercase">
                Lo que suena en directo
              </p>
              <h2 className="mt-4 font-display text-[clamp(1.8rem,7vw,3.2rem)] leading-none text-bone">
                Ocho cortes grabados en directo
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-smoke">
                No es el repertorio de Salamanca: eso no lo ha publicado nadie, y no me lo invento. Es
                la serie <span className="text-bone">HDLR Live Sessions</span>, ocho cortes en directo
                que el canal oficial de Natos y Waor tiene publicados. Si vienes al concierto, esto es
                lo que puede sonar por el equipo.
              </p>

              <ol className="lv-set mt-8">
                {LIVE_SESSIONS.map((session) => (
                  <li key={session.order}>
                    <a
                      className="lv-set-item"
                      href={session.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      onClick={() =>
                        trackEvent('cta_click', { id: 'hdlr_live_session', track: session.trackId })
                      }
                    >
                      <span className="lv-set-num">{pad(session.order)}</span>
                      <span className="lv-set-title">{session.title}</span>
                      <span className="lv-set-go">Ver en YouTube</span>
                    </a>
                  </li>
                ))}
              </ol>

              <p className="mt-5 text-xs leading-relaxed text-ash">
                Todos los enlaces llevan a{' '}
                <a
                  href={OFFICIAL_YOUTUBE_CHANNEL.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-sweep text-smoke underline decoration-steel underline-offset-4 hover:text-bone"
                >
                  el canal oficial de Natos y Waor
                </a>
                .
              </p>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default Live;
