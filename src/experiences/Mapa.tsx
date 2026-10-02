import { useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { SectionHeading } from '../components/SectionHeading';
import { SPAIN_PENINSULA_PATH, SPAIN_VIEWBOX, project } from '../data/spain-geo';
import { concerts, internationalPlaces, tourName } from '../data';
import type { Concert } from '../data';
import { trackEvent } from '../lib/trackEvent';

const TENERIFE = { lat: 28.4636, lon: -16.2518 };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Convierte coordenadas a porcentaje dentro del viewBox del mapa. */
function toPct(lon: number, lat: number): { left: number; top: number } {
  const { x, y } = project(lon, lat);
  return {
    left: (x / SPAIN_VIEWBOX.w) * 100,
    top: (y / SPAIN_VIEWBOX.h) * 100,
  };
}

/* ------------------------------------------------------------------ */
/* Retícula del mapa                                                   */
/* ------------------------------------------------------------------ */

function Graticule() {
  const lines = useMemo(() => {
    const out: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
    for (let lon = -10; lon <= 4; lon += 2) {
      const a = project(lon, 35.8);
      const b = project(lon, 44);
      out.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, key: `lon-${lon}` });
    }
    for (let lat = 36; lat <= 44; lat += 2) {
      const a = project(-9.6, lat);
      const b = project(3.6, lat);
      out.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, key: `lat-${lat}` });
    }
    return out;
  }, []);

  return (
    <g aria-hidden="true">
      {lines.map((line) => (
        <line
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="#1d1d21"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Vista                                                               */
/* ------------------------------------------------------------------ */

export function Mapa() {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const upcoming = concerts.find((concert) => concert.dateISO >= today());
    return (upcoming ?? concerts[concerts.length - 1])?.id ?? null;
  });
  const [onlyUpcoming, setOnlyUpcoming] = useState(false);

  const hoy = today();
  const visible = useMemo(
    () => (onlyUpcoming ? concerts.filter((concert) => concert.dateISO >= hoy) : concerts),
    [onlyUpcoming, hoy],
  );
  const selected: Concert | undefined = concerts.find((concert) => concert.id === selectedId);

  function select(concert: Concert, via: 'mapa' | 'lista') {
    setSelectedId(concert.id);
    trackEvent('map_city_select', {
      city: concert.city,
      date: concert.dateISO,
      via,
      status: concert.dateISO >= hoy ? 'proximo' : 'celebrado',
    });
  }

  return (
    <div>
      <section className="relative overflow-hidden px-4 pt-32 pb-10 sm:px-8 sm:pt-40">
        <div className="tech-grid absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1400px]">
          <p className="rise font-body text-[11px] font-semibold tracking-[0.36em] text-blood-ink uppercase">
            03 · Mapa
          </p>
          <h1 className="rise mt-5 font-display text-[clamp(3rem,12vw,9rem)] leading-[0.84] text-bone [animation-delay:100ms]">
            LA GIRA
            <br />
            SOBRE EL MAPA
          </h1>
          <p className="fade-in mt-8 max-w-2xl text-base leading-relaxed text-smoke sm:text-lg [animation-delay:320ms]">
            {tourName}: {concerts.length} plazas publicadas. Toca una ciudad o elige una fecha de la
            lista. El estado se calcula con la fecha de hoy, aquí y ahora, sin datos guardados.
          </p>
        </div>
      </section>

      {/* Mapa y panel */}
      <section className="px-4 pb-16 sm:px-8">
        <div className="mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          {/* Mapa */}
          <div className="reveal panel relative p-3 sm:p-5">
            <div className="relative" style={{ aspectRatio: `${SPAIN_VIEWBOX.w} / ${SPAIN_VIEWBOX.h}` }}>
              <svg
                viewBox={`0 0 ${SPAIN_VIEWBOX.w} ${SPAIN_VIEWBOX.h}`}
                className="h-full w-full"
                role="img"
                aria-label="Mapa de la España peninsular con las plazas de la gira 2026 de Hijos de la Ruina"
              >
                <Graticule />
                <path
                  d={SPAIN_PENINSULA_PATH}
                  fill="#0f0f12"
                  stroke="#3a3a42"
                  strokeWidth={1.4}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* Marcadores accesibles: botones HTML reales, navegables con teclado */}
              <div className="absolute inset-0">
                {visible.map((concert) => {
                  const { left, top } = toPct(concert.lon, concert.lat);
                  const isPast = concert.dateISO < hoy;
                  const active = concert.id === selectedId;
                  return (
                    <button
                      key={concert.id}
                      type="button"
                      onClick={() => select(concert, 'mapa')}
                      aria-pressed={active}
                      aria-label={`${concert.city}, ${concert.venue}, ${concert.dateLabel}. ${
                        isPast ? 'Ya celebrado' : 'Próximo'
                      }`}
                      className="map-dot absolute focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bone"
                      style={{ left: `${left}%`, top: `${top}%` }}
                      data-active={active}
                      data-past={isPast}
                      data-confirmed={concert.confirmed}
                    >
                      <span className="map-dot-ring" aria-hidden="true" />
                      <span className="map-dot-core" aria-hidden="true" />
                      <span className="map-dot-label" aria-hidden="true">
                        {concert.city}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Recuadro de Canarias, fuera de escala */}
              <div className="absolute bottom-3 left-3 w-[74px] border border-steel bg-void/85 p-2 backdrop-blur-sm sm:w-[104px]">
                <p className="font-body text-[8px] leading-tight tracking-[0.18em] text-ash uppercase">
                  Canarias
                  <br />
                  fuera de escala
                </p>
                <div className="relative mt-2 h-9 sm:h-12">
                  <button
                    type="button"
                    aria-label={`Santa Cruz de Tenerife, ${TENERIFE.lat}, próximo`}
                    onClick={() => {
                      const target = concerts.find((concert) => concert.city.includes('Tenerife'));
                      if (target) select(target, 'mapa');
                    }}
                    className="map-dot focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bone"
                    style={{ left: '50%', top: '50%' }}
                    data-active={concerts.some(
                      (concert) => concert.city.includes('Tenerife') && concert.id === selectedId,
                    )}
                    data-past={false}
                    data-confirmed={false}
                  >
                    <span className="map-dot-ring" aria-hidden="true" />
                    <span className="map-dot-core" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <p className="absolute right-3 bottom-3 font-body text-[9px] tracking-[0.16em] text-ash uppercase">
                Contorno: Natural Earth 50m · dominio público
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-steel pt-4">
              <span className="flex items-center gap-2 text-xs text-smoke">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-blood-bright" />
                Próximo
              </span>
              <span className="flex items-center gap-2 text-xs text-smoke">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-ash" />
                Ya celebrado
              </span>
              <span className="flex items-center gap-2 text-xs text-smoke">
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-blood-bright" />
                Recinto sin confirmar
              </span>
              <Badge kind="real" className="ml-auto" />
            </div>
          </div>

          {/* Panel */}
          <div className="reveal space-y-6">
            <div className="panel p-5 sm:p-6" aria-live="polite">
              {selected ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-body text-[10px] font-semibold tracking-[0.28em] text-blood-ink uppercase">
                      {selected.dateISO >= hoy ? 'Próxima parada' : 'Celebrado'}
                    </p>
                    {!selected.confirmed ? <Badge kind="demo" /> : <Badge kind="real" />}
                  </div>
                  <h2 className="mt-3 font-display text-[clamp(1.8rem,4.4vw,2.8rem)] leading-none text-bone">
                    {selected.city}
                  </h2>
                  <p className="mt-3 text-sm text-smoke">{selected.venue}</p>
                  <p className="mt-5 font-display text-lg tracking-[0.08em] text-bone">
                    {selected.dateLabel}
                  </p>
                  {selected.nota ? (
                    <p className="mt-4 border-l-2 border-blood-bright pl-3 text-xs leading-relaxed text-ash">
                      {selected.nota}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-ash">Selecciona una ciudad en el mapa.</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border border-steel bg-carbon px-4 py-3">
              <span className="font-body text-[11px] font-semibold tracking-[0.2em] text-smoke uppercase">
                Filtrar
              </span>
              <button
                type="button"
                aria-pressed={onlyUpcoming}
                onClick={() => {
                  setOnlyUpcoming((value) => !value);
                  trackEvent('map_filter_change', { onlyUpcoming: !onlyUpcoming });
                }}
                className={`border px-3 py-2 font-body text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors ${
                  onlyUpcoming
                    ? 'border-blood-bright bg-blood text-bone'
                    : 'border-steel text-smoke hover:border-bone/40 hover:text-bone'
                }`}
              >
                Solo próximos
              </button>
            </div>

            <ol className="divide-y divide-steel border border-steel bg-carbon">
              {visible.length === 0 ? (
                <li className="px-4 py-6 text-sm text-ash">
                  No quedan fechas futuras de la gira {tourName}.
                </li>
              ) : (
                visible.map((concert) => {
                  const isPast = concert.dateISO < hoy;
                  const active = concert.id === selectedId;
                  return (
                    <li key={concert.id}>
                      <button
                        type="button"
                        onClick={() => select(concert, 'lista')}
                        aria-pressed={active}
                        className={`flex w-full items-center gap-4 px-4 py-4 text-left transition-colors ${
                          active ? 'bg-steel' : 'hover:bg-steel/60'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            isPast ? 'bg-ash' : 'bg-blood-bright'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-bone">
                            {concert.city}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-ash">
                            {concert.venue}
                          </span>
                        </span>
                        <span className="shrink-0 font-body text-[11px] tracking-[0.1em] text-smoke uppercase">
                          {concert.dateLabel.replace(/ de \d{4}$/, '')}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ol>

            <p className="text-xs leading-relaxed text-ash">
              Fechas y recintos según la web oficial de Natos y Waor y la prensa de la gira. El
              estado pasado o próximo se calcula en tu navegador con la fecha de hoy.
            </p>
          </div>
        </div>
      </section>

      {/* Fuera de España */}
      <section className="border-y border-steel bg-ink px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading
            index="Fuera de España"
            title="El proyecto también ha salido"
            lead="La biografía oficial menciona estos países. No se dibujan en el mapa porque la fuente no concreta ciudad ni recinto, y situar un punto sería inventarlo."
            aside={<Badge kind="real" />}
          />
          <ul className="mt-8 flex flex-wrap gap-2">
            {internationalPlaces.paises.map((pais) => (
              <li
                key={pais}
                className="border border-steel bg-carbon px-4 py-2 font-body text-xs tracking-[0.14em] text-smoke uppercase"
              >
                {pais}
              </li>
            ))}
          </ul>
          <a
            href={internationalPlaces.fuente}
            target="_blank"
            rel="noreferrer noopener"
            className="link-sweep mt-6 inline-block text-[11px] font-semibold tracking-[0.2em] text-smoke uppercase hover:text-bone"
          >
            Fuente: {new URL(internationalPlaces.fuente).hostname.replace('www.', '')}
          </a>
        </div>
      </section>
    </div>
  );
}
