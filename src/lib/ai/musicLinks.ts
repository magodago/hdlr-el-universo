/**
 * Enlaces verificados a musica de Hijos de la Ruina.
 *
 * REGLA DEL PROYECTO: aqui solo entra lo que se ha podido comprobar en una fuente
 * oficial o de tienda. Si un corte no tiene enlace propio comprobado, el campo se
 * deja sin rellenar y la interfaz no muestra ese boton. Nunca se inventa una URL.
 *
 * De donde sale cada cosa:
 *  - Los identificadores de Spotify se han leido de las fichas de album oficiales
 *    de Natos y Waor en Spotify (una por volumen), cruzadas con la ficha de disco
 *    de natosywaor.com. El enlace publico es siempre open.spotify.com/<tipo>/<id>.
 *  - Los identificadores de YouTube pertenecen al canal oficial "Natos y Waor"
 *    (UCq-3_QjeLPs4yAuZEIwvHWg), comprobado video por video contra la pagina de
 *    resultados del propio canal. Nada de canales de terceros ni de subidas de fans.
 *  - El catalogo de la serie (volumenes, años y titulos) vive en src/data/songs.json.
 */

export interface AlbumLinks {
  /** Ficha del volumen en Spotify. */
  spotify: string;
  /** Fuente donde se ha comprobado el enlace. */
  source: string;
}

export interface TrackLinks {
  /** Pista concreta en Spotify. Si falta, no se pinta el boton de Spotify. */
  spotify?: string;
  /** Video oficial en el canal oficial. Si falta, no se pinta el boton de YouTube. */
  youtube?: string;
}

/** Canal oficial de Natos y Waor en YouTube, padre de todos los videos de arriba. */
export const OFFICIAL_YOUTUBE_CHANNEL = {
  url: 'https://www.youtube.com/channel/UCq-3_QjeLPs4yAuZEIwvHWg',
  channelId: 'UCq-3_QjeLPs4yAuZEIwvHWg',
  label: 'Canal oficial de Natos y Waor en YouTube',
};

/** Ficha de cada volumen. El id coincide con `Volume.id` de src/data/songs.json. */
export const ALBUM_LINKS: Record<string, AlbumLinks> = {
  vol1: {
    spotify: 'https://open.spotify.com/album/6fj5S1rOpSCYyspqVQoaYt',
    source: 'Spotify: Hijos de la ruina, vol.1 (2012)',
  },
  vol2: {
    spotify: 'https://open.spotify.com/album/2m2UQnzb9eEAKSB7rQmkzT',
    source: 'Spotify: Hijos de la ruina, vol. 2 (2016)',
  },
  vol3: {
    spotify: 'https://open.spotify.com/album/5ElCfa24Wz9evOfT5k6uEB',
    source: 'Spotify: Hijos de la ruina, vol. 3 (2021)',
  },
  vol4: {
    spotify: 'https://open.spotify.com/album/2TOE3xkVku8an92zfsNAzb',
    source: 'Spotify: HIJOS DE LA RUINA VOL. 4 (2026)',
  },
};

function spotifyTrack(id: string): string {
  return `https://open.spotify.com/track/${id}`;
}

function youtubeVideo(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/**
 * Cortes de la serie con su enlace. La clave es `<volumen>-<numero de corte>`, que es
 * el mismo id que genera el catalogo plano de src/data/index.ts.
 *
 * [id de pista en Spotify, id de video en YouTube (opcional)]
 */
const RAW_TRACK_LINKS: Record<string, [string, string?]> = {
  // Vol. 1 (2012). Los videos son las subidas oficiales de la serie en 2012.
  'vol1-1': ['1GzQwfcEeF2co68sO0zwS6', 'lCRfXZDWSNU'],
  'vol1-2': ['1aO2clZ1RIIo9ML4yPJOC0', 'ADjGLkpYx3s'],
  'vol1-3': ['5L1B5herhUCjp7RtORHqmq', '6GDTnNc40xo'],
  'vol1-4': ['5buyZ9jzBs1LPpiJ3HFCWW', 'ldfBbNVfEc4'],
  'vol1-5': ['0lKXW9YsQFod5JFI4Ld4Xu', '8qXv2c-sviI'],
  // Vol. 2 (2016).
  'vol2-1': ['2ajyIatUhb8awYOl8W3Fsl', '38FQzW9fhNw'],
  'vol2-2': ['37mWLEs2QwfTaNfKRdyAk8', 'BQ5k_9IHUF8'],
  'vol2-3': ['1ZNpyDElyWxXA2wIjGQp35', 'VYrA0qsMdQw'],
  'vol2-4': ['2cJwn9pFZoA1SKY5iyWQ9p', 'PxUIixxIcbo'],
  'vol2-5': ['6WZw0YPglQmrQwLoo7eeKG', 'D-YcYEky26E'],
  'vol2-6': ['7hRgUuI7qSFfdsvcHgOnZ3', 'AdZf-86q1a0'],
  // Vol. 3 (2021).
  'vol3-1': ['6zSeaEIsIRRatRUPiO2dpe', 'w7h4TvXl64s'],
  'vol3-2': ['1G4ijIcLc7Ldf4iC7Utr4f', 'Ec9DYba7UBQ'],
  'vol3-3': ['1fOYtsFfEOvQVFuFwLUnVI', 'eB5zLPB9fek'],
  'vol3-4': ['3fTPnf1cNtC8k6nrT0j9wm', 'VqNU3RQuxAE'],
  'vol3-5': ['2Q2El9wpZcH191YKF9sr3b', '5ERt8OU08K8'],
  'vol3-6': ['0lstDvubsePLSuUiGWsNL8', 'VZil0VR9WNs'],
  'vol3-7': ['0O4bCG1TnGt4rARJOFfa1N', 'v0utm-Ole8o'],
  // Vol. 4 (2026). De esta entrega solo hay video oficial de los adelantos:
  // los demas cortes quedan sin boton de YouTube a proposito.
  'vol4-1': ['63Ce1HA4Y6zqNG9R55Ekpe'],
  'vol4-2': ['5T8ZK8yeU1nK4q6Y6EVSGG'],
  'vol4-3': ['3LtyGe5GMnXEqaepWHxSz2'],
  'vol4-4': ['4rqzSkBXRlCYdg3exmyQI8'],
  'vol4-5': ['2xAzTV7KxfKOGWdMrORaU5'],
  'vol4-6': ['1SF75r44KP0rKrTSxTLZeV'],
  'vol4-7': ['4UkJiHIyfrPcVDUdOXDH78'],
  'vol4-8': ['24Ehg00dcSz8e66wBWmFdW'],
  'vol4-9': ['5Ys9ehDp1nKBcEII3GaPBz', 'z5oNUWyqOuU'],
  'vol4-10': ['1DMOSazgCIdgXaVgR0I0C7'],
  'vol4-11': ['2waGcnTgvZJb58qNFGm6NJ'],
  'vol4-12': ['3dQAtqSRasoz2oTnQcnakI'],
  'vol4-13': ['5li4ijo6zoM9hyOxE44xyk', '-76svVX5Cd8'],
  'vol4-14': ['19QduMnotJldInPrfNk3hb'],
  'vol4-15': ['3QB7QgaI5LvaG60v33JJUI'],
  'vol4-16': ['6ZvMEI7qaQ22xBs3KRhAvu'],
  'vol4-17': ['17zHHBjcFkUqxTL7GyhTi1'],
  'vol4-18': ['5vozoW4vMOA2OrHNFrfMz4'],
  'vol4-19': ['3xHi6inFeaVix1PfIo9sZS'],
  'vol4-20': ['0eF8LKwaO9JhsZYtObsAq5'],
  'vol4-21': ['6o1MoNm7rIBsS0LptH7Wjq'],
};

export const TRACK_LINKS: Record<string, TrackLinks> = Object.fromEntries(
  Object.entries(RAW_TRACK_LINKS).map(([key, [spotifyId, youtubeId]]) => [
    key,
    {
      spotify: spotifyTrack(spotifyId),
      youtube: youtubeId ? youtubeVideo(youtubeId) : undefined,
    } satisfies TrackLinks,
  ]),
);

/**
 * Serie HDLR LIVE SESSIONS: ocho cortes grabados en directo y publicados por el
 * canal oficial. No es el repertorio del concierto de Salamanca: es material de
 * directo real que se puede enseñar sin inventar nada.
 */
export interface LiveSession {
  order: number;
  trackId: string;
  title: string;
  url: string;
}

export const LIVE_SESSIONS: LiveSession[] = [
  { order: 1, trackId: 'vol3-4', title: 'Sudores fríos', url: youtubeVideo('P8v3uIGmRmo') },
  { order: 2, trackId: 'vol3-6', title: 'A la tumba', url: youtubeVideo('Na1M6S1TjYk') },
  { order: 3, trackId: 'vol3-5', title: 'Más Alcohol', url: youtubeVideo('DgSsteeXx5E') },
  { order: 4, trackId: 'vol2-1', title: 'Carretera', url: youtubeVideo('85eIfO5Zr2o') },
  { order: 5, trackId: 'vol3-7', title: 'Dime que sí', url: youtubeVideo('QG7bSheBf38') },
  { order: 6, trackId: 'vol2-3', title: 'Speed', url: youtubeVideo('gtAFKtlcBcU') },
  { order: 7, trackId: 'vol3-1', title: 'Nosotros', url: youtubeVideo('QQ09S4BzPew') },
  { order: 8, trackId: 'vol3-2', title: 'Fuego, fuego', url: youtubeVideo('5fmxdEqTYq4') },
];

/** Enlaces de un corte del catalogo. Se acepta cualquier id; si no hay ficha, devuelve {}. */
export function trackLinksFor(trackId: string): TrackLinks {
  return TRACK_LINKS[trackId] ?? {};
}

/** Cuantos cortes tienen al menos un enlace verificado. Sirve para el recuento del pie. */
export const VERIFIED_LINK_COUNT = Object.values(TRACK_LINKS).filter(
  (links) => Boolean(links.spotify || links.youtube),
).length;

/** Cuantos cortes tienen video oficial propio. */
export const VERIFIED_VIDEO_COUNT = Object.values(TRACK_LINKS).filter((links) =>
  Boolean(links.youtube),
).length;
