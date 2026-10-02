import { useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { SectionHeading } from '../components/SectionHeading';
import { SPAIN_PENINSULA_PATH, SPAIN_VIEWBOX, project } from '../data/spain-geo';
import { concerts, internationalPlaces, tourName } from '../data';
import type { Concert } from '../data';
import { trackEvent } from '../lib/trackEvent';
import '../styles/mapa.css';

const SHOWS_SOURCE = 'https://natosywaor.com/pages/shows';

/** Margen alrededor del contorno para que la costa no toque el borde del marco. */
const PAD = 26;
const VB = {
  minX: -PAD,
  minY: -PAD,
  w: SPAIN_VIEWBOX.w + PAD * 2,
  h: SPAIN_VIEWBOX.h + PAD * 2,
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Convierte coordenadas a porcentaje dentro del marco visible del mapa. */
function toPct(lon: number, lat: number): { left: number; top: number } {
  const { x, y } = project(lon, lat);
  return {
    left: ((x - VB.minX) / VB.w) * 100,
    top: ((y - VB.minY) / VB.h) * 100,
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
    <g className="mp-graticule" aria-hidden="true">
      {lines.map((line) => (
        <line key={line.key} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Vista                                                               */
/* ------------------------------------------------------------------ */

export function Mapa() {
  const hoy = today();

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const upcoming = concerts.find((concert) => concert.dateISO >= hoy);
    return (upcoming ?? concerts[concerts.length - 1])?.id ?? null;
  });
  const [onlyUpcoming, setOnlyUpcoming] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const visible = useMemo(
    () => (onlyUpcoming ? concerts.filter((concert) => concert.dateISO >= hoy) : concerts),
    [onlyUpcoming, hoy],
  );

  const selected: Concert | undefined = concerts.find((concert) => concert.id === selectedId);
  const selectedIndex = selected ? concerts.findIndex((concert) => concert.id === selected.id) : -1;

  // Zoom sobre la ciudad elegida. Tenerife vive en el recuadro de Canarias, fuera de
  // escala, asi que no se le aplica zoom: se resalta en su sitio.
  const canZoom = Boolean(selected && selected.lat > 34);
  const scale = zoomed && canZoom ? 2.2 : 1;
  const focus = selected && canZoom ? toPct(selected.lon, selected.lat) : { left: 50, top: 50 };
  const mapTransform =
    scale > 1
      ? `translate(calc(50% - ${scale * focus.left}%), calc(50% - ${scale * focus.top}%)) scale(${scale})`
      : 'none';
  const counterScale = `scale(${1 / scale})`;

  function select(concert: Concert, via: 'mapa' | 'lista') {
    setSelectedId(concert.id);
    setZoomed(concert.lat > 34);
    trackEvent('map_city_select', {
      city: concert.city,
      date: concert.dateISO,
      via,
      status: concert.dateISO >= hoy ? 'proximo' : 'celebrado',
    });
  }

  function resetZoom() {
    setZoomed(false);
  }

  const tenerife = concerts.find((concert) => concert.id === 'tenerife');

  return (
    <div>
      <section className="relative overflow-hidden px-4 pt-24 pb-10 sm:px-8 sm:pt-32">
        <div className="tech-grid absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1400px]">
          <p className="rise font-body text-[11px] font-semibold tracking-[0.36em] text-blood-ink uppercase">
            03 · Mapa
          </p>
          <h1 className="rise mt-5 font-display text-[clamp(3rem,12vw,9rem)] leading-[0.84] text-bone [animation-delay:100ms]">
            LA RUINA
            <br />
            SOBRE EL MAPA
          </h1>
          <p className="fade-in mt-8 max-w-2xl text-base leading-relaxed text-smoke sm:text-lg [animation-delay:320ms]">
            {tourName}: {concerts.length} plazas publicadas. Toca una ciudad y el mapa se acerca.
            Solo aparece lo que está confirmado, y lo que no lo está va marcado como DEMO.
          </p>
        </div>
      </section>

      {/* Mapa y panel */}
      <section className="px-4 pb-16 sm:px-8">
        <div className="mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          {/* Mapa */}
          <div>
            <div className="reveal">
            {/* El envoltorio .reveal no cambia nunca de clase: asi el is-in que
                anade el observador no lo borra un re-render al hacer zoom. */}
            <div className={`mp-frame${zoomed ? ' mp-zoomed' : ''}`}>
              <div
                className="mp-stage"
                style={{ aspectRatio: `${VB.w} / ${VB.h}` }}
                onClick={(event) => {
                  // Un toque en el fondo del mapa devuelve la vista completa.
                  if (event.target === event.currentTarget) resetZoom();
                }}
              >
                <div className="mp-grid tech-grid" aria-hidden="true" />

                {zoomed ? (
                  <button
                    type="button"
                    onClick={resetZoom}
                    className="btn-outline mp-zoom-btn px-4 py-3 font-display text-xs tracking-[0.2em] uppercase"
                  >
                    <span className="btn-arrow" aria-hidden="true">
                      ←
                    </span>
                    Ver todo
                  </button>
                ) : null}

                <div className="mp-zoom" style={{ transform: mapTransform }}>
                  <svg
                    viewBox={`${VB.minX} ${VB.minY} ${VB.w} ${VB.h}`}
                    className="mp-svg"
                    role="img"
                    aria-label="Mapa de la España peninsular con las plazas de la gira 2026 de Hijos de la Ruina"
                  >
                    <Graticule />
                    <path d={SPAIN_PENINSULA_PATH} className="mp-land" vectorEffect="non-scaling-stroke" />
                    <path
                      d={SPAIN_PENINSULA_PATH}
                      className="mp-land-edge"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>

                  {/* Marca de registro sobre la ciudad elegida. */}
                  {zoomed && selected && canZoom ? (
                    <span
                      className="mp-crosshair"
                      aria-hidden="true"
                      style={{
                        left: `${focus.left}%`,
                        top: `${focus.top}%`,
                        transform: `translate(-50%, -50%) ${counterScale}`,
                      }}
                    />
                  ) : null}

                  {/* Nodos de ciudad: botones reales, navegables con teclado. */}
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
                          className="mp-node focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bone"
                          style={{
                            left: `${left}%`,
                            top: `${top}%`,
                            transform: `${counterScale} translate(-50%, -50%)`,
                          }}
                          data-active={active}
                          data-past={isPast}
                          data-confirmed={concert.confirmed}
                        >
                          <span className="mp-halo" aria-hidden="true" />
                          <span className="mp-ring" aria-hidden="true" />
                          <span className="mp-core" aria-hidden="true" />
                          <span className="mp-label" aria-hidden="true">
                            {concert.city}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recuadro de Canarias, fuera de escala */}
                {tenerife ? (
                  <div className="mp-inset">
                    <p className="mp-inset-title">
                      Canarias
                      <br />
                      fuera de escala
                    </p>
                    <div className="mp-inset-plot">
                      <button
                        type="button"
                        aria-label={`Santa Cruz de Tenerife, ${tenerife.venue}, ${tenerife.dateLabel}. Recinto sin confirmar`}
                        onClick={() => select(tenerife, 'mapa')}
                        className="mp-node focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bone"
                        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                        data-active={tenerife.id === selectedId}
                        data-past={tenerife.dateISO < hoy}
                        data-confirmed={tenerife.confirmed}
                      >
                        <span className="mp-halo" aria-hidden="true" />
                        <span className="mp-ring" aria-hidden="true" />
                        <span className="mp-core" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ) : null}

                <p className="mp-credit">Contorno: Natural Earth 50m, dominio público</p>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-steel px-3 py-3 sm:px-5">
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
              </div>
            </div>
            </div>
          </div>

          {/* Panel */}
          <div className="reveal min-w-0 space-y-6">
            <div className="panel p-5 sm:p-6" aria-live="polite">
              {selected ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-body text-[10px] font-semibold tracking-[0.28em] text-blood-ink uppercase">
                      {selected.dateISO >= hoy ? 'Próxima parada' : 'Ya celebrado'}
                    </p>
                    {selected.confirmed ? <Badge kind="real" /> : <Badge kind="demo" />}
                  </div>
                  <h2 className="mt-3 font-display text-[clamp(1.9rem,4.6vw,2.9rem)] leading-none text-bone">
                    {selected.city}
                  </h2>
                  <p className="mt-4 font-display text-lg tracking-[0.06em] text-bone">
                    {selected.dateLabel}
                  </p>

                  <dl className="mt-5 space-y-3 border-t border-steel pt-5 text-sm">
                    <div className="flex gap-3">
                      <dt className="w-20 shrink-0 text-ash">Evento</dt>
                      <dd className="text-smoke">{selected.venue}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="w-20 shrink-0 text-ash">Momento</dt>
                      <dd className="text-smoke">
                        {selected.dateISO >= hoy ? 'Por celebrar' : 'Ya celebrado'}
                        {selectedIndex >= 0
                          ? ` · parada ${selectedIndex + 1} de ${concerts.length}`
                          : ''}
                      </dd>
                    </div>
                  </dl>

                  {selected.nota ? (
                    <p className="mt-4 border-l-2 border-blood-bright pl-3 text-xs leading-relaxed text-ash">
                      {selected.nota}
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
                className="btn-outline min-h-[44px] px-4 py-3 font-body text-[11px] font-semibold tracking-[0.14em] uppercase"
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
                        className={`flex min-h-[44px] w-full items-center gap-4 px-4 py-4 text-left transition-colors ${
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
              estado pasado o próximo se calcula en tu navegador con la fecha de hoy. El punto del
              mapa solo indica la ciudad: no hay recinto ni hora inventados.
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
