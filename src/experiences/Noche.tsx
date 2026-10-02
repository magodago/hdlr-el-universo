import { Marquee } from '../components/Marquee';
import { SectionHeading } from '../components/SectionHeading';
import { catalog, internationalPlaces, tourName, volumes } from '../data';
import { FOTOS } from '../data/fotos';
import { Link, ROUTES } from '../lib/router';

/** Los cortes que mejor cuentan la caída de la noche, con su entrega y su año. */
const CORTES = ['Carretera', 'Bajo Zero', 'Muerto en vida', 'Fuego, fuego', 'Nosotros', 'Otra vez'];

/**
 * Experiencia 07 · Noche.
 * La parte que no sale en la ficha: el barrio, la fiesta y lo que queda cuando baja el volumen.
 */
export function Noche() {
  const cortes = CORTES.map((titulo) => catalog.find((track) => track.title === titulo)).filter(
    (track): track is NonNullable<typeof track> => Boolean(track),
  );

  return (
    <div className="pt-28 sm:pt-32">
      <section className="px-4 pb-12 sm:px-8">
        <div className="mx-auto w-full max-w-[1400px]">
          <SectionHeading
            index="07 · Noche"
            title="Lo que se cuenta cuando baja el volumen"
            lead={
              <>
                Madrid, 2010: dos tipos que se conocen en las batallas de gallos y deciden grabar
                juntos. Catorce años después hay cuatro entregas, una gira de once plazas y ocho
                países fuera. Esto es lo que queda cuando se apaga la última luz del escenario.
              </>
            }
          />
        </div>
      </section>

      <figure className="foto foto-band">
        <img src={FOTOS.escenario.src} alt={FOTOS.escenario.alt} loading="lazy" />
        <figcaption>
          <span className="foto-pie">{FOTOS.escenario.pie}</span>
        </figcaption>
      </figure>

      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto grid w-full max-w-[1400px] gap-px border border-steel bg-steel lg:grid-cols-2">
          <div className="bg-carbon p-6 sm:p-10">
            <p className="font-body text-[11px] tracking-[0.3em] text-blood-ink uppercase">
              Antes de todo
            </p>
            <h3 className="mt-4 font-display text-[clamp(1.9rem,5vw,3.2rem)] leading-[0.92] text-bone">
              El barrio primero
            </h3>
            <p className="mt-5 text-base leading-relaxed text-smoke">
              El proyecto nace en Madrid, en las batallas de gallos, con lo que había: dos voces,
              una base y ganas de contar lo que se veía desde el bloque. Esa forma de escribir
              sigue en pie en cada entrega: las mismas calles, los mismos nombres, contados con más
              años encima.
            </p>
            <p className="mt-5 text-base leading-relaxed text-smoke">
              En 2025 cumplieron quince años de carrera, y el 4 llegó como disco doble: veintiún
              cortes, una hora y nueve minutos. Nada de eso suena a despedida.
            </p>
          </div>
          <figure className="foto m-0 bg-carbon">
            <img src={FOTOS.duo.src} alt={FOTOS.duo.alt} loading="lazy" />
            <figcaption>
              <span className="foto-pie">{FOTOS.duo.pie}</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <Marquee
        items={['Houston, tenemos un problema', 'Madrid', 'Buenos Aires', 'Fuego, fuego', 'No hay manera', 'Bajo Zero']}
      />

      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto w-full max-w-[1400px]">
          <SectionHeading
            index="La banda sonora"
            title="Seis cortes y la noche entera"
            lead="De la carretera al bajo cero. Cada uno con la entrega en la que salió y el año que le toca."
          />

          <ol className="reveal mt-10 grid gap-px border border-steel bg-steel sm:grid-cols-2 lg:grid-cols-3">
            {cortes.map((track) => (
              <li key={track.id} className="bg-carbon p-6">
                <p className="font-body text-[10px] tracking-[0.24em] text-ash uppercase">
                  {track.volumeTitle} · {track.year}
                </p>
                <p className="mt-3 font-display text-2xl leading-tight tracking-[0.02em] text-bone">
                  {track.title}
                </p>
                <p className="mt-3 text-sm text-ash">
                  {track.duration}
                  {track.features.length > 0 ? ` · con ${track.features.join(', ')}` : ''}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <figure className="foto foto-band">
        <img src={FOTOS.recycled.src} alt={FOTOS.recycled.alt} loading="lazy" />
        <figcaption>
          <span className="foto-pie">{FOTOS.recycled.pie}</span>
        </figcaption>
      </figure>

      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto grid w-full max-w-[1400px] gap-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <SectionHeading
              index="Fuera"
              title="La noche viaja"
              lead="La gira 2026 es española, pero el ruido ya cruzó el charco antes. Estos son los países por los que ha pasado el proyecto."
            />
            <ul className="mt-8 flex flex-wrap gap-2">
              {internationalPlaces.paises.map((pais) => (
                <li
                  key={pais}
                  className="border border-steel px-4 py-3 font-body text-xs tracking-[0.18em] text-smoke uppercase"
                >
                  {pais}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-steel bg-carbon p-6 sm:p-8">
            <p className="font-body text-[11px] tracking-[0.3em] text-blood-ink uppercase">
              En números
            </p>
            <dl className="mt-5 space-y-4">
              <div className="flex items-baseline justify-between border-b border-steel pb-3">
                <dt className="text-sm text-smoke">Entregas</dt>
                <dd className="font-display text-2xl text-bone">{volumes.length}</dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-steel pb-3">
                <dt className="text-sm text-smoke">Cortes</dt>
                <dd className="font-display text-2xl text-bone">{catalog.length}</dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-steel pb-3">
                <dt className="text-sm text-smoke">Plazas en {tourName.split(' ')[2] ?? '2026'}</dt>
                <dd className="font-display text-2xl text-bone">11</dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-sm text-smoke">Países fuera de España</dt>
                <dd className="font-display text-2xl text-bone">
                  {internationalPlaces.paises.length}
                </dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={ROUTES.comunidad}
                className="btn-blood inline-flex border border-bone/25 px-5 py-4"
              >
                <span className="font-display text-sm tracking-[0.18em] text-bone uppercase">
                  08 Comunidad
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
