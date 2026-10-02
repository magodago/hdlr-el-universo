export interface ExperienceMeta {
  n: string;
  slug: string;
  title: string;
  short: string;
  description: string;
  status: 'listo' | 'proxima';
}

/**
 * Registro de experiencias del universo HDLR.
 * Las tres primeras estan construidas. Las siguientes tienen ruta reservada y una
 * pantalla propia que explica que falta, para que ningun enlace quede muerto.
 */
export const EXPERIENCES: ExperienceMeta[] = [
  {
    n: '01',
    slug: '/',
    title: 'Entrada',
    short: 'Entrada',
    description:
      'El portal. Quien es Hijos de la Ruina, de donde viene el nombre y por donde se entra al resto.',
    status: 'listo',
  },
  {
    n: '02',
    slug: '/perfil',
    title: 'Perfil',
    short: 'Perfil',
    description:
      'Las tres personas detras del nombre, los cuatro volumenes con su lista de cortes y los datos que sostienen la trayectoria.',
    status: 'listo',
  },
  {
    n: '03',
    slug: '/mapa',
    title: 'Mapa',
    short: 'Mapa',
    description:
      'La gira 2026 sobre el mapa: recintos, fechas y estado de cada plaza. Filtro de proximos conciertos.',
    status: 'listo',
  },
  {
    n: '04',
    slug: '/cancion',
    title: 'Canción',
    short: 'Canción',
    description:
      'Ficha por corte: volumen, año, duracion, colaboraciones y contexto. Sin letras ni audio.',
    status: 'listo',
  },
  {
    n: '05',
    slug: '/archivo',
    title: 'Archivo',
    short: 'Archivo',
    description:
      'Cronologia completa, material de contexto y la serie Barras Bravas, documentada entrega a entrega.',
    status: 'listo',
  },
  {
    n: '06',
    slug: '/live',
    title: 'Live',
    short: 'Live',
    description: 'Los directos: que se ha tocado y como suena el catalogo sobre un escenario.',
    status: 'listo',
  },
  {
    n: '07',
    slug: '/noche',
    title: 'Noche',
    short: 'Noche',
    description: 'La parte emocional: barrio, fiesta y lo que se cuenta cuando baja el volumen.',
    status: 'proxima',
  },
  {
    n: '08',
    slug: '/comunidad',
    title: 'Comunidad',
    short: 'Comunidad',
    description:
      'Espacio para quien sigue el proyecto. Sin registro, sin email y sin recoger datos personales.',
    status: 'listo',
  },
];

export function findExperience(slug: string): ExperienceMeta | undefined {
  return EXPERIENCES.find((experience) => experience.slug === slug);
}
