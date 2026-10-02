import { useMemo, useState } from 'react';
import { catalog, counts, volumes } from '../data';
import { TrackPreview } from './TrackPreview';

/**
 * El catalogo entero, corte a corte: los 39 titulos de las cuatro entregas,
 * con buscador, filtro por volumen y orden. Cada corte que tiene fragmento
 * oficial lleva su boton de 30 segundos.
 */

type Orden = 'disco' | 'nombre' | 'duracion' | 'anio';

const ORDENES: { id: Orden; label: string }[] = [
  { id: 'disco', label: 'Disco' },
  { id: 'nombre', label: 'Nombre' },
  { id: 'duracion', label: 'Duración' },
  { id: 'anio', label: 'Año' },
];

/** Numero de pista dentro de su volumen (el id acaba en el numero). */
function numeroDe(track: { id: string }): number {
  const partes = track.id.split('-');
  const ultimo = Number.parseInt(partes[partes.length - 1] ?? '', 10);
  return Number.isNaN(ultimo) ? 0 : ultimo;
}

function sinAcentos(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function CatalogoCompleto() {
  const [busqueda, setBusqueda] = useState('');
  const [volumen, setVolumen] = useState('todos');
  const [orden, setOrden] = useState<Orden>('disco');

  const lista = useMemo(() => {
    const texto = sinAcentos(busqueda.trim());

    const filtrada = catalog.filter((track) => {
      const porVolumen = volumen === 'todos' || track.volumeId === volumen;
      if (!porVolumen) return false;
      if (!texto) return true;
      const pajar = sinAcentos(
        `${track.title} ${track.volumeTitle} ${track.features.join(' ')} ${track.year}`,
      );
      return pajar.includes(texto);
    });

    const ordenada = [...filtrada];
    ordenada.sort((a, b) => {
      if (orden === 'nombre') return a.title.localeCompare(b.title, 'es');
      if (orden === 'duracion') return (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0);
      if (orden === 'anio') return b.year - a.year || numeroDe(a) - numeroDe(b);
      return a.year - b.year || numeroDe(a) - numeroDe(b);
    });
    return ordenada;
  }, [busqueda, volumen, orden]);

  const chip = (activo: boolean) =>
    `inline-flex min-h-[38px] items-center border px-3 font-body text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors ${
      activo
        ? 'border-blood-ink bg-blood-ink/15 text-bone'
        : 'border-steel text-smoke hover:border-smoke hover:text-bone'
    }`;

  return (
    <section id="catalogo" className="border-t border-steel px-4 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-[1200px]">
        <p className="font-body text-[11px] font-semibold tracking-[0.3em] text-blood-ink uppercase">
          El catálogo
        </p>
        <h2 className="mt-3 font-display text-[clamp(1.9rem,7vw,3.2rem)] leading-[0.95] text-bone">
          Los {counts.tracks} cortes, uno por uno
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-smoke">
          Cuatro entregas, de 2012 a 2026. Busca por título, filtra por volumen y ordena como
          quieras. Los cortes con fragmento oficial llevan su botón de escucha de 30 segundos.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <label className="flex items-center border border-steel bg-ink/60 px-3 focus-within:border-smoke">
            <span className="sr-only">Buscar un corte</span>
            <input
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar por título, volumen o colaboración"
              className="min-h-[46px] w-full bg-transparent font-body text-sm text-bone outline-none placeholder:text-ash"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(volumen === 'todos')} onClick={() => setVolumen('todos')}>
              Todos
            </button>
            {volumes.map((volume) => (
              <button
                key={volume.id}
                type="button"
                className={chip(volumen === volume.id)}
                onClick={() => setVolumen(volume.id)}
              >
                {volume.shortTitle}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body text-[10px] font-semibold tracking-[0.24em] text-ash uppercase">
              Ordenar
            </span>
            {ORDENES.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                className={chip(orden === opcion.id)}
                onClick={() => setOrden(opcion.id)}
              >
                {opcion.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 font-body text-[11px] font-semibold tracking-[0.24em] text-ash uppercase">
          {lista.length} de {counts.tracks} cortes
        </p>

        <ul className="mt-4 border-t border-steel">
          {lista.map((track) => (
            <li
              key={track.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-steel px-1 py-3 transition-colors hover:bg-carbon"
            >
              <span className="w-7 shrink-0 font-body text-xs text-ash tabular-nums">
                {String(numeroDe(track)).padStart(2, '0')}
              </span>

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-display text-base tracking-[0.02em] text-bone sm:text-lg">
                  {track.title}
                </span>
                <span className="mt-0.5 font-body text-[10px] tracking-[0.2em] text-ash uppercase">
                  {track.volumeTitle} · {track.year} · {track.duration ?? '—'}
                  {track.single ? ' · Adelanto' : ''}
                  {track.features.length > 0 ? ` · con ${track.features.join(', ')}` : ''}
                </span>
              </span>

              <TrackPreview titulo={track.title} compacto />
            </li>
          ))}
        </ul>

        {lista.length === 0 ? (
          <p className="mt-6 text-sm text-smoke">
            Ningún corte coincide con esa búsqueda. Prueba con el título o el volumen.
          </p>
        ) : null}
      </div>
    </section>
  );
}
