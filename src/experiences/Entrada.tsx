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

const FACTS = [
  { value: '4', label: 'Volúmenes de Hijos de la Ruina', badge: 'real' as const },
  { value: '15', label: 'Años de carrera de Natos y Waor', badge: 'real' as const },
  { value: '60.000', label: 'Personas en el Metropolitano, 7 de junio de 2025', badge: 'real' as const },
  { value: '27', label: 'Entregas de la serie Barras Bravas', badge: 'real' as const },
];

export function Entrada() {
  const upcoming = concerts.filter((concert) => concert.dateISO >= today());
  const next = upcoming[0];
  const totalTracks = volumes.reduce((sum, volume) => sum + volume.trackCount, 0);

  return (
    <div>
      {/* ------------------------------------------------------------ */}
      {/* Escena 1: portada                                             */}
      {/* ------------------------------------------------------------ */}
      <section className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden px-4 pt-24 pb-8 sm:px-8">
        <div className="tech-grid absolute inset-0 opacity-70" aria-hidden="true" />
        <div
          className="drift absolute top-[-28%] right-[-18%] h-[70vmax] w-[70vmax] rounded-full opacity-60"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(circle, rgba(143,17,22,0.42) 0%, rgba(143,17,22,0.12) 38%, rgba(5,5,6,0) 70%)',
          }}
        />
        <div
          className="absolute inset-x-0 top-[18%] flex justify-center overflow-hidden"
          aria-hidden="true"
        >
          <span className="text-outline m-0 font-display text-[24vw] leading-[0.8] whitespace-nowrap opacity-[0.55] select-none">
            HIJOS DE LA RUINA
          </span>
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-[1400px] gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:gap-16">
          <div>
            <p className="rise font-body text-[11px] font-semibold tracking-[0.36em] text-smoke uppercase">
              Proyecto paralelo de Natos y Waor con Recycled J
            </p>

            <h1 className="rise mt-5 font-display text-[clamp(2.6rem,8.6vw,6.4rem)] leading-[0.88] text-bone [animation-delay:120ms]">
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

            <p className="fade-in mt-7 max-w-xl text-base leading-relaxed text-smoke [animation-delay:420ms] sm:text-lg">
              Una experiencia interactiva para entrar en el universo de Hijos de la Ruina: tres
              nombres, cuatro volúmenes y una gira que vuelve a poner el rap español en recintos que
              no le correspondían. Todo lo que se cuenta aquí lleva su fuente.
            </p>

            <div className="fade-in mt-8 flex flex-wrap items-center gap-3 [animation-delay:540ms]">
              <Link
                to={ROUTES.perfil}
                className="btn-blood group inline-flex items-center gap-3 border border-bone/25 px-6 py-4"
                onClick={() => trackEvent('cta_click', { id: 'entrada_a_perfil' })}
              >
                <span className="font-display text-sm tracking-[0.2em] text-bone uppercase">
                  02 Perfil: quién está detrás
                </span>
              </Link>
              <Link
                to={ROUTES.mapa}
                className="inline-flex items-center gap-3 border border-steel px-6 py-4 text-smoke transition-colors hover:border-bone/40 hover:text-bone"
                onClick={() => trackEvent('cta_click', { id: 'entrada_a_mapa' })}
              >
                <span className="font-display text-sm tracking-[0.2em] uppercase">
                  03 Mapa: gira 2026
                </span>
              </Link>
            </div>
          </div>

          <aside className="fade-in flex flex-col gap-3 [animation-delay:660ms]">
            {next ? (
              <div className="panel p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-body text-[10px] font-semibold tracking-[0.3em] text-blood-ink uppercase">
                    Próxima parada
                  </p>
                  <Badge kind="real" />
                </div>
                <p className="mt-4 font-display text-3xl leading-none text-bone uppercase sm:text-4xl">
                  {next.city}
                </p>
                <p className="mt-3 text-sm text-smoke">{next.venue}</p>
                <p className="mt-1 font-body text-xs tracking-[0.18em] text-ash uppercase">
                  {next.dateLabel}
                </p>
                <Link
                  to={ROUTES.mapa}
                  className="link-sweep mt-6 inline-block font-body text-[11px] font-semibold tracking-[0.24em] text-smoke uppercase transition-colors hover:text-bone"
                  onClick={() => trackEvent('cta_click', { id: 'entrada_siguiente_parada' })}
                >
                  Ver las {concerts.length} plazas en el mapa
                </Link>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {EXPERIENCES.map((experience) => (
                <Link
                  key={experience.slug}
                  to={ROUTES[experience.slug as keyof typeof ROUTES] ?? ROUTES.entrada}
                  className="group panel flex flex-col p-4"
                  onClick={() => trackEvent('experience_open', { slug: experience.slug })}
                >
                  <span className="font-display text-2xl leading-none text-blood-bright">
                    {experience.n}
                  </span>
                  <span className="mt-3 font-display text-sm tracking-[0.16em] text-bone uppercase">
                    {experience.title}
                  </span>
                  <span className="mt-2 font-body text-[10px] font-semibold tracking-[0.22em] uppercase">
                    {experience.status === 'listo' ? (
                      <span className="text-smoke">Disponible</span>
                    ) : (
                      <span className="text-ash">Próxima entrega</span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </aside>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-wrap items-end justify-between gap-4 border-t border-steel pt-5">
          <p className="font-body text-xs tracking-[0.2em] text-ash uppercase">
            {volumes.length} volúmenes · {totalTracks} cortes documentados · {concerts.length} plazas
            de gira
          </p>
          <p className="font-body text-xs tracking-[0.2em] text-ash uppercase">
            Desliza para entrar
          </p>
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
      <section className="relative px-4 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading
            index="El nombre"
            title="Un proyecto paralelo que ya lleva cuatro volúmenes"
            lead="Natos y Waor son un dúo de rap madrileño que se conoció en 2010 en las batallas de gallos. Con Recycled J montaron en 2012 una segunda línea de trabajo firmada por los tres. Esa línea se llama Hijos de la Ruina."
          />

          <div className="mt-14 grid gap-px border border-steel bg-steel md:grid-cols-3">
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
                  className="link-sweep relative mt-5 inline-block text-[11px] font-semibold tracking-[0.2em] text-smoke uppercase hover:text-bone"
                >
                  Fuente
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link
              to={ROUTES.perfil}
              className="link-sweep font-display text-sm tracking-[0.24em] text-bone uppercase"
              onClick={() => trackEvent('cta_click', { id: 'entrada_tres_nombres' })}
            >
              Ver el perfil completo, con los cuatro volúmenes
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
                className="btn-blood mt-8 inline-flex items-center border border-bone/25 px-6 py-4"
                onClick={() => trackEvent('cta_click', { id: 'entrada_giro_mapa' })}
              >
                <span className="font-display text-sm tracking-[0.2em] text-bone uppercase">
                  Abrir el mapa
                </span>
              </Link>
            </div>

            <div className="reveal panel p-6 sm:p-8">
              {next ? (
                <>
                  <p className="font-body text-[11px] font-semibold tracking-[0.3em] text-blood-ink uppercase">
                    Próxima parada
                  </p>
                  <p className="mt-4 font-display text-[clamp(2rem,5vw,3.2rem)] text-bone">
                    {next.city}
                  </p>
                  <p className="mt-2 text-sm text-smoke">{next.venue}</p>
                  <p className="mt-6 font-display text-lg tracking-[0.1em] text-bone">
                    {next.dateLabel}
                  </p>
                  {!next.confirmed ? (
                    <p className="mt-4 flex items-center gap-2 text-xs text-ash">
                      <Badge kind="demo" />
                      Recinto sin confirmar en la web oficial.
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm leading-relaxed text-smoke">
                  No hay fechas futuras publicadas para la gira 2026.
                </p>
              )}
              <p className="mt-8 border-t border-steel pt-4 text-xs leading-relaxed text-ash">
                Fuentes: web oficial de Natos y Waor, LOS40 y 20minutos para las fechas; listados de
                venta de entradas para el recinto sin confirmar.
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
