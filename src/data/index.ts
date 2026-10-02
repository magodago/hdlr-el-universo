import songsRaw from '../data/songs.json';
import citiesRaw from '../data/cities.json';
import concertsRaw from '../data/concerts.json';
import timelineRaw from '../data/timeline.json';
import membersRaw from '../data/members.json';
import type { CatalogTrack } from '../lib/ai';

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export interface Track {
  n: number;
  title: string;
  duration?: string;
  features?: string[];
  single?: boolean;
  explicit?: boolean;
}

export interface Volume {
  id: string;
  title: string;
  shortTitle: string;
  year: number;
  releasedLabel: string;
  label: string;
  trackCount: number;
  durationLabel: string;
  sources: string[];
  tracks: Track[];
}

export interface Concert {
  id: string;
  city: string;
  venue: string;
  dateISO: string;
  dateLabel: string;
  lat: number;
  lon: number;
  confirmed: boolean;
  nota?: string;
}

export interface TimelineEvent {
  year: string;
  date: string;
  title: string;
  text: string;
  source: string;
  tag: string;
}

export interface Member {
  id: string;
  alias: string;
  realName: string;
  born: string;
  from: string;
  role: string;
  project: string;
  note: string;
  source: string;
}

export interface TourCity {
  id: string;
  city: string;
  lat: number;
  lon: number;
  peninsula: boolean;
  inset?: boolean;
  demo?: boolean;
  nota?: string;
}

/* ------------------------------------------------------------------ */
/* Accesos                                                             */
/* ------------------------------------------------------------------ */

export const volumes = songsRaw.volumes as Volume[];
export const concerts = [...(concertsRaw.concerts as Concert[])].sort((a, b) =>
  a.dateISO.localeCompare(b.dateISO),
);
export const tourCities = citiesRaw.tourCities as TourCity[];
export const internationalPlaces = citiesRaw.international as {
  titulo: string;
  paises: string[];
  fuente: string;
};
export const timeline = timelineRaw.events as TimelineEvent[];
export const members = membersRaw.members as Member[];

export const tourName = concertsRaw.tour;

/** Duracion en segundos a partir de "m:ss". */
function toSeconds(duration?: string): number | undefined {
  if (!duration) return undefined;
  const [m, s] = duration.split(':').map((value) => Number.parseInt(value, 10));
  if (Number.isNaN(m) || Number.isNaN(s)) return undefined;
  return m * 60 + s;
}

/** Catalogo plano de cortes, listo para el motor de recomendacion. */
export const catalog: CatalogTrack[] = volumes.flatMap((volume) =>
  volume.tracks.map((track) => ({
    id: `${volume.id}-${track.n}`,
    title: track.title,
    volumeId: volume.id,
    volumeTitle: volume.shortTitle,
    year: volume.year,
    duration: track.duration,
    durationSeconds: toSeconds(track.duration),
    features: track.features ?? [],
    single: Boolean(track.single),
    explicit: Boolean(track.explicit),
  })),
);

export const counts = {
  volumes: volumes.length,
  tracks: catalog.length,
  cities: concerts.length,
  singles: catalog.filter((track) => track.single).length,
  withFeatures: catalog.filter((track) => track.features.length > 0).length,
};

/** Fuentes citadas en la interfaz, todas oficiales o de tienda. */
export const allSources: { label: string; url: string }[] = Array.from(
  new Map(
    [
      { label: 'Web oficial de Natos y Waor', url: 'https://natosywaor.com/pages/biografia-natos-y-waor' },
      { label: 'Wikipedia: Natos y Waor', url: 'https://es.wikipedia.org/wiki/Natos_y_Waor' },
      { label: 'Wikipedia: Recycled J', url: 'https://es.wikipedia.org/wiki/Recycled_J' },
      { label: 'Apple Music: Hijos de la ruina, vol. 3', url: 'https://music.apple.com/es/album/hijos-de-la-ruina-vol-3/1637574445' },
      { label: 'Apple Music: HIJOS DE LA RUINA VOL. 4', url: 'https://music.apple.com/es/album/hijos-de-la-ruina-vol-4/1863671064' },
      { label: 'Genius: tracklist Vol. 4', url: 'https://genius.com/albums/Natos-y-waor-recycled-j-and-hijos-de-la-ruina/Hijos-de-la-ruina-vol-4' },
      { label: 'Genius: tracklist Vol. 3', url: 'https://genius.com/albums/Natos-y-waor-recycled-j-and-hijos-de-la-ruina/Hijos-de-la-ruina-vol-3' },
      { label: 'Qobuz: Hijos de la ruina, vol. 1', url: 'https://qobuz.com/us-en/album/hijos-de-la-ruina-vol1-natos-y-waor-recycled-j-hijos-de-la-ruina/p0yxwbbp3xixb' },
      { label: 'Qobuz: Hijos de la ruina, vol. 2', url: 'https://qobuz.com/us-en/album/hijos-de-la-ruina-vol-2-natos-y-waor-recycled-j-hijos-de-la-ruina/sqg1754679lvc' },
      { label: 'Discogs: Vol. 4, colaboraciones', url: 'https://discogs.com/release/36231979-Natos-y-Waor-Hijos-de-la-Ruina-Vol-4' },
      { label: 'LaHiguera: Vol. 4, fecha y lista', url: 'https://www.lahiguera.net/musicalia/artistas/natos_y_waor/disco/14820/' },
      { label: 'Europa Press: 15 aniversario, 7 de junio de 2025', url: 'https://www.europapress.es/cultura/musica-00129/noticia-natos-waor-celebran-15-anos-carrera-metropolitano-incendiado-20250608002550.html' },
      { label: 'LOS40: fechas de la gira 2026', url: 'https://los40.com/2025/06/11/entradas-de-la-gira-de-hijos-de-la-ruina-en-2026-cuando-y-donde-comprarlas/' },
      { label: '20minutos: anuncio de disco y gira 2026', url: 'https://www.20minutos.es/noticia/5719921/0/hijos-ruina-anuncian-nuevo-album-una-gira-por-espana-para-2026/' },
      { label: 'Antena 3: entrevista previa al Metropolitano', url: 'https://www.antena3.com/noticias/cultura/natos-waor-preparados-llevar-rap-mas-alto-abarrotando-metropolitano-climax-nuestra-carrera_202506076843e37e4c9357775b844fe9.html' },
    ].map((item) => [item.url, item]),
  ).values(),
);
