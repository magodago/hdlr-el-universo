import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '../components/Badge';
import { Marquee } from '../components/Marquee';
import { SectionHeading } from '../components/SectionHeading';
import { EXPERIENCES } from '../data/experiences';
import { concerts, members, tourName, volumes } from '../data';
import { Link, ROUTES } from '../lib/router';
import { trackEvent } from '../lib/trackEvent';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const FACTS = [
  { value: '4', label: 'Volúmenes de Hijos de la Ruina' },
  { value: '15', label: 'Años de carrera de Natos y Waor' },
  { value: '60.000', label: 'Personas en el Metropolitano, 7 de junio de 2025' },
  { value: '27', label: 'Entregas de la serie Barras Bravas' },
];

/* ------------------------------------------------------------------ */
/* La puerta: pantalla completa de entrada                             */
/* ------------------------------------------------------------------ */

function Gate({ onEnter, exiting }: { onEnter: () => void; exiting: boolean }) {
  return (
    <section
      className={`gate${exiting ? ' is-exiting' : ''}`}
      aria-label="Entrada al universo HDLR"
    >
      <div className="gate-glow" aria-hidden="true" />
      <div className="gate-texture" aria-hidden="true" />

      <h1 className="gate-word gate-front">HDLR</h1>
      <p className="gate-sub gate-front">El Universo</p>
      <p className="gate-question gate-front">
        ¿Vienes a la <em>Ruina</em>?
      </p>

      <button
        type="button"
        onClick={onEnter}
        className="gate-enter gate-front group mt-3 inline-flex min-h-[66px] w-[min(20rem,86vw)] items-center justify-center gap-4 border border-bone/25 bg-blood px-8 py-4"
      >
        <span className="font-display text-xl leading-none tracking-[0.3em] text-bone uppercase">
          Entrar
        </span>
        <span
          aria-hidden="true"
          className="font-display text-2xl leading-none text-bone/85 transition-transform duration-300 group-hover:translate-x-1"
        >
          →
        </span>
      </button>

      <p className="gate-front mt-1 font-body text-[11px] tracking-[0.14em] text-smoke uppercase opacity-80">
        Sin registro ni cookies
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Vista                                                               */
/* ------------------------------------------------------------------ */

export function Entrada() {
  const [started, setStarted] = useState(false);
  const [gone, setGone] = useState(false);
  const contentRef = useRef<HTMLHeadingElement>(null);
  const reduced = useMemo(prefersReducedMotion, []);

  // Bloquea el scroll mientras la puerta esta en pie.
  useEffect(() => {
    if (started) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [started]);

  // Al entrar, el foco pasa al titular para lectores de pantalla y teclado.
  useEffect(() => {
    if (started) contentRef.current?.focus({ preventScroll: true });
  }, [started]);

  function enter() {
    if (started) return;
    trackEvent('gate_enter', { path: ROUTES.entrada });
    setStarted(true);
    if (reduced) {
      setGone(true);
      return;
    }
    window.setTimeout(() => setGone(true), 1080);
  }

  const upcoming = concerts.filter((concert) => concert.dateISO >= today());
  const next = upcoming[0];
  const totalTracks = volumes.reduce((sum, volume) => sum + volume.trackCount, 0);

  if (!started) {
    // La puerta se monta en <body> para no quedar atrapada en el contexto de
    // apilado de <main> (que anima con transform) y cubrir de verdad la pantalla.
    return createPortal(<Gate onEnter={enter} exiting={false} />, document.body);
  }

  return (
    <div>
      {!gone
        ? createPortal(
            <>
              <Gate onEnter={enter} exiting />
              <div className="gate-curtain" aria-hidden="true" />
            </>,
            document.body,
          )
        : null}

      {/* ------------------------------------------------------------ */}
      {/* Escena 1: portada compacta                                    */}
      {/* ------------------------------------------------------------ */}
      <section className="relative overflow-hidden px-4 pt-24 pb-10 sm:px-8 sm:pt-28">
        <div className="tech-grid absolute inset-0 opacity-60" aria-hidden="true" />
        <div
          className="drift absolute top-[-30%] right-[-20%] h-[60vmax] w-[60vmax] rounded-full opacity-50"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(circle, rgba(143,17,22,0.38) 0%, rgba(143,17,22,0.1) 40%, rgba(5,5,6,0) 72%)',
          }}
        />

        <div className="relative z-10 mx-auto grid w-full max-w-[1400px] gap-6 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:gap-14">
          <div>
            <p className="rise font-body text-[11px] font-semibold tracking-[0.3em] text-smoke uppercase">
              Natos, Waor y Recycled J
            </p>

            <h1
              ref={contentRef}
              tabIndex={-1}
              className="rise focus-flat mt-4 font-display text-[clamp(2.8rem,9vw,6.4rem)] leading-[0.88] text-bone outline-none [animation-delay:100ms]"
            >
              HIJOS
              <br />
              DE LA{' '}
              <span className="relative inline-block text-blood-bright">
                RUINA
                <span
                  className="absolute -bottom-1 left-0 h-[3px] w-full bg-blood-bright sm:h-[5px]"
                  aria-hidden="true"
                />
              </span>
            </h1>

            <p className="fade-in mt-5 max-w-xl text-base leading-relaxed text-smoke [animation-delay:300ms] sm:text-lg">
              Una experiencia interactiva para entrar en el universo de Hijos de la Ruina: tres
              nombres, cuatro volúmenes y una gira que vuelve a poner el rap español en recintos que
              no le correspondían. Todo lo que se cuenta aquí lleva su fuente.
            </p>

            <div className="fade-in mt-6 flex flex-col gap-3 [animation-delay:420ms] sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to={ROUTES.perfil}
                className="btn-blood inline-flex min-h-[54px] items-center justify-center border border-blood-bright/70 px-6 py-3.5"
                onClick={() => trackEvent('cta_click', { id: 'entrada_a_perfil' })}
              >
                <span className="font-display text-base tracking-[0.24em] text-bone uppercase">
                  02 Perfil
                </span>
              </Link>
              <Link
                to={ROUTES.mapa}
                className="inline-flex min-h-[54px] items-center justify-center border border-bone/60 bg-steel/60 px-6 py-3.5 text-bone transition-colors hover:border-bone hover:bg-steel"
                onClick={() => trackEvent('cta_click', { id: 'entrada_a_mapa' })}
              >
                <span className="font-display text-base tracking-[0.24em] text-bone uppercase">
                  03 Mapa
                </span>
              </Link>
            </div>
          </div>

          <aside className="fade-in [animation-delay:520ms]">
            {next ? (
              <div className="panel p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-body text-[10px] font-semibold tracking-[0.3em] text-blood-ink uppercase">
                    Próxima parada
                  </p>
                  <Badge kind={next.confirmed ? 'real' : 'demo'} />
                </div>
                <p className="mt-3 font-display text-3xl leading-none text-bone uppercase sm:text-4xl">
                  {next.city}
                </p>
                <p className="mt-2 text-sm text-smoke">{next.venue}</p>
                <p className="mt-1 font-body text-xs tracking-[0.18em] text-bone uppercase">
                  {next.dateLabel}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-ash">
                  Fecha publicada en la web oficial de conciertos de Natos y Waor. El recinto sale de
                  la prensa y de los listados de venta de entradas.
                </p>
                <Link
                  to={ROUTES.mapa}
                  className="mt-4 inline-flex min-h-[44px] items-center border border-bone/60 bg-steel/60 px-4 py-3 font-display text-xs tracking-[0.2em] text-bone uppercase transition-colors hover:border-bone hover:bg-steel"
                  onClick={() => trackEvent('cta_click', { id: 'entrada_siguiente_parada' })}
                >
                  03 Mapa: las {concerts.length} plazas
                </Link>
              </div>
            ) : null}
          </aside>
        </div>

        <div className="relative z-10 mx-auto mt-8 flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3 border-t border-steel pt-4">
          <p className="font-body text-xs tracking-[0.2em] text-ash uppercase">
            {volumes.length} volúmenes · {totalTracks} cortes documentados · {concerts.length} plazas
            de gira
          </p>
          <p className="font-body text-xs tracking-[0.2em] text-ash uppercase">
            Baja para recorrer el universo
          </p>
        </div>

        <div className="watermark-band relative z-10 mx-auto w-full max-w-[1400px]" aria-hidden="true">
          <span>HIJOS DE LA RUINA</span>
        </div>
      </section>

      <Marquee
        items={[
          'Hijos de la Ruina',
          'Natos',
          'Waor',
          'Recycled J',
          'Vol. 4, 2026',
          'Madrid',
          'Barras Bravas',
        ]}
      />

      {/* ------------------------------------------------------------ */}
      {/* Escena 2: el nombre                                           */}
      {/* ------------------------------------------------------------ */}
      <section className="relative px-4 py-20 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading
            index="El nombre"
            title="Un proyecto paralelo que ya lleva cuatro volúmenes"
            lead="Natos y Waor son un dúo de rap madrileño que se conoció en 2010 en las batallas de gallos. Con Recycled J montaron en 2012 una segunda línea de trabajo firmada por los tres. Esa línea se llama Hijos de la Ruina."
          />

          <div className="mt-12 grid gap-px border border-steel bg-steel md:grid-cols-3">
            {[
              {
                k: 'Qué es',
                v: 'Un proyecto paralelo: no sustituye al dúo, lo amplía. Tres voces y un repertorio propio.',
              },
              {
                k: 'Cuándo empieza',
                v: 'En 2012, con la primera entrega. Después llegaron 2016, 2021 y 2026.',
              },
              {
                k: 'Cómo se edita',
                v: 'Sin discográfica ajena. El sello que figura en el Vol. 4 es el propio proyecto.',
              },
            ].map((item) => (
              <article key={item.k} className="reveal bg-carbon p-6 sm:p-8">
                <h3 className="font-display text-lg tracking-[0.08em] text-blood-ink uppercase">
                  {item.k}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-smoke sm:text-base">{item.v}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Escena 3: tres nombres                                        */}
      {/* ------------------------------------------------------------ */}
      <section className="relative border-y border-steel bg-ink px-4 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading
            index="Las voces"
            title="Tres nombres sostienen el proyecto"
            aside={<Badge kind="real" />}
          />
          <ul className="mt-12 grid gap-px border border-steel bg-steel sm:grid-cols-3">
            {members.map((member) => (
              <li key={member.id} className="reveal group relative bg-carbon p-6 sm:p-8">
                <span
                  className="pointer-events-none absolute top-0 right-4 font-display text-[6rem] leading-none text-outline opacity-60 transition-opacity duration-500 group-hover:opacity-100 sm:text-[7rem]"
                  aria-hidden="true"
                >
                  {member.alias.charAt(0)}
                </span>
                <h3 className="relative font-display text-[clamp(2rem,5vw,3.4rem)] text-bone">
                  {member.alias}
                </h3>
                <p className="relative mt-4 text-sm font-semibold tracking-[0.06em] text-bone">
                  {member.realName}
                </p>
                <p className="relative mt-1 text-sm text-smoke">{member.born}</p>
                <p className="relative mt-4 text-sm leading-relaxed text-ash">{member.note}</p>
                <a
                  href={member.source}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-sweep relative mt-5 inline-flex min-h-[44px] items-center text-[11px] font-semibold tracking-[0.2em] text-smoke uppercase hover:text-bone"
                >
                  Fuente
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link
              to={ROUTES.perfil}
              className="link-sweep inline-flex min-h-[44px] items-center font-display text-sm tracking-[0.24em] text-bone uppercase"
              onClick={() => trackEvent('cta_click', { id: 'entrada_tres_nombres' })}
            >
              02 Perfil: con los cuatro volúmenes
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Escena 4: cifras                                              */}
      {/* ------------------------------------------------------------ */}
      <section className="px-4 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center gap-4">
            <span className="font-display text-xs tracking-[0.3em] text-blood-ink">Las cifras</span>
            <span className="rule-draw h-px flex-1 bg-steel" />
            <Badge kind="real" />
          </div>
          <dl className="mt-10 grid gap-px border border-steel bg-steel sm:grid-cols-2 lg:grid-cols-4">
            {FACTS.map((fact) => (
              <div key={fact.label} className="reveal bg-carbon p-6 sm:p-8">
                <dt className="sr-only">{fact.label}</dt>
                <dd>
                  <span className="block font-display text-[clamp(2.6rem,7vw,4.4rem)] leading-none text-bone">
                    {fact.value}
                  </span>
                  <span className="mt-3 block text-sm leading-relaxed text-smoke">{fact.label}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs leading-relaxed text-ash">
            Fuente: biografía oficial de Natos y Waor (natosywaor.com) y crónica de Europa Press del
            concierto del 7 de junio de 2025. El número de entregas de Barras Bravas es el que
            publica la propia web del proyecto.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Escena 5: los volúmenes en fila                               */}
      {/* ------------------------------------------------------------ */}
      <section className="border-y border-steel bg-ink px-4 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading
            index="La serie"
            title="Cuatro entregas, catorce años"
            lead="De la primera maqueta de 2012 al Vol. 4 de 2026. Las listas de cortes completas están en el perfil."
          />
          <ol className="mt-12 grid gap-px border border-steel bg-steel sm:grid-cols-2 lg:grid-cols-4">
            {volumes.map((volume) => (
              <li key={volume.id} className="reveal bg-carbon p-6">
                <p className="font-display text-sm tracking-[0.24em] text-blood-ink">
                  {volume.shortTitle}
                </p>
                <p className="mt-3 font-display text-[clamp(2.4rem,6vw,3.6rem)] leading-none text-bone">
                  {volume.year}
                </p>
                <p className="mt-4 text-sm text-smoke">{volume.title}</p>
                <p className="mt-2 text-xs tracking-[0.14em] text-ash uppercase">
                  {volume.trackCount} cortes · {volume.durationLabel}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Escena 6: próximo directo                                     */}
      {/* ------------------------------------------------------------ */}
      <section className="px-4 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="reveal">
              <span className="font-display text-xs tracking-[0.3em] text-blood-ink">
                En directo
              </span>
              <h2 className="mt-4 font-display text-[clamp(2.2rem,6vw,4.4rem)] text-bone">
                {next ? 'La gira sigue' : 'Gira 2026 cerrada'}
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-smoke">
                {next
                  ? `Quedan ${upcoming.length} fechas posteriores a hoy de la gira ${tourName}. Las pasadas siguen en el mapa marcadas como celebradas.`
                  : `Todas las fechas publicadas de la gira ${tourName} ya han pasado. La cronología completa está en la experiencia de archivo.`}
              </p>
              <Link
                to={ROUTES.mapa}
                className="btn-blood mt-8 inline-flex min-h-[52px] items-center border border-bone/25 px-6 py-3.5"
                onClick={() => trackEvent('cta_click', { id: 'entrada_giro_mapa' })}
              >
                <span className="font-display text-sm tracking-[0.2em] text-bone uppercase">
                  03 Mapa
                </span>
              </Link>
            </div>

            <div className="reveal panel p-6 sm:p-8">
              {next ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-body text-[11px] font-semibold tracking-[0.3em] text-blood-ink uppercase">
                      Próxima parada
                    </p>
                    <Badge kind={next.confirmed ? 'real' : 'demo'} />
                  </div>
                  <p className="mt-4 font-display text-[clamp(2rem,5vw,3.2rem)] text-bone">
                    {next.city}
                  </p>
                  <p className="mt-2 text-sm text-smoke">{next.venue}</p>
                  <p className="mt-6 font-display text-lg tracking-[0.1em] text-bone">
                    {next.dateLabel}
                  </p>
                </>
              ) : (
                <p className="text-sm leading-relaxed text-smoke">
                  No hay fechas futuras publicadas para la gira 2026.
                </p>
              )}
              <p className="mt-8 border-t border-steel pt-4 text-xs leading-relaxed text-ash">
                Fuentes: web oficial de Natos y Waor para las fechas, y prensa y listados de venta de
                entradas para los recintos. El recinto sin confirmar en la web oficial va marcado DEMO.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Escena 7: mapa de experiencias                                */}
      {/* ------------------------------------------------------------ */}
      <section className="border-t border-steel bg-ink px-4 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading
            index="El universo"
            title="Ocho experiencias, tres ya abiertas"
            lead="Esta primera entrega trae la entrada, el perfil y el mapa. Las demás tienen ruta reservada y una pantalla que explica qué falta: ningún enlace queda muerto."
          />
          <ul className="mt-12 grid gap-px border border-steel bg-steel sm:grid-cols-2 lg:grid-cols-4">
            {EXPERIENCES.map((experience) => {
              const open = experience.status === 'listo';
              return (
                <li key={experience.slug}>
                  <Link
                    to={experience.slug}
                    className={`reveal group flex h-full flex-col gap-3 bg-carbon p-6 transition-colors hover:bg-steel ${
                      open ? '' : 'opacity-80'
                    }`}
                    onClick={() =>
                      trackEvent(open ? 'experience_open' : 'experience_locked', {
                        id: experience.n,
                        slug: experience.slug,
                        from: ROUTES.entrada,
                      })
                    }
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-2xl leading-none text-blood-bright">
                        {experience.n}
                      </span>
                      <span className="font-body text-[10px] font-semibold tracking-[0.24em] text-ash uppercase">
                        {open ? 'Disponible' : 'Próxima'}
                      </span>
                    </span>
                    <span className="font-display text-2xl tracking-[0.04em] text-bone">
                      {experience.title}
                    </span>
                    <span className="text-sm leading-relaxed text-smoke">
                      {experience.description}
                    </span>
                    <span className="mt-auto pt-4 font-body text-[11px] font-semibold tracking-[0.24em] text-ash uppercase transition-colors group-hover:text-blood-ink">
                      {open ? 'Abrir' : 'Ver estado'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
