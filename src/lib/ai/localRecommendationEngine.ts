import type {
  CatalogTrack,
  RecommendationEngine,
  RecommendationRequest,
  RecommendationResult,
} from './types';

/**
 * Motor de recomendacion local.
 *
 * Funciona enteramente en el navegador, sin API y sin claves. No inventa atributos
 * subjetivos de las canciones: puntua usando solo campos verificables del catalogo
 * (volumen, año, duracion, colaboraciones y si el corte fue adelanto).
 */

const ERA_YEARS: Record<NonNullable<RecommendationRequest['era']>, [number, number]> = {
  inicios: [2012, 2016],
  mitad: [2016, 2021],
  nuevo: [2021, 2026],
  cualquiera: [0, 9999],
};

function scoreTrack(
  track: CatalogTrack,
  request: RecommendationRequest,
  index: number,
): number {
  let score = 0;

  const era = request.era ?? 'cualquiera';
  if (era !== 'cualquiera') {
    const [from, to] = ERA_YEARS[era];
    if (track.year >= from && track.year <= to) score += 5;
  } else {
    score += 1;
  }

  if (request.withFeaturesOnly) {
    score += track.features.length > 0 ? 6 : -50;
  }

  if (request.singlesOnly) {
    score += track.single ? 6 : -50;
  }

  if (track.single) score += 1;
  if (track.features.length > 0) score += track.features.length;

  // Pequeño desempate estable para que el orden no sea siempre identico.
  score += ((index * 37) % 5) * 0.01;

  return score;
}

function buildReason(track: CatalogTrack, request: RecommendationRequest): string {
  const parts: string[] = [];
  parts.push(`${track.volumeTitle} (${track.year})`);
  if (request.singlesOnly && track.single) parts.push('fue adelanto verificado');
  if (track.features.length > 0) {
    parts.push(`con ${track.features.join(', ')}`);
  }
  if (track.duration) parts.push(`dura ${track.duration}`);
  return parts.join(', ');
}

export const localRecommendationEngine: RecommendationEngine = {
  id: 'local',
  label: 'Motor local',
  description:
    'Puntua el catalogo en tu propio dispositivo con reglas sobre datos verificados: epoca, colaboraciones y adelantos. Sin red, sin claves y sin perfil de usuario.',
  requiresNetwork: false,

  recommend(request, catalog) {
    const limit = request.limit ?? 3;
    return catalog
      .map((track, index) => ({
        track,
        score: scoreTrack(track, request, index),
        reason: buildReason(track, request),
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.track.year - b.track.year)
      .slice(0, limit) satisfies RecommendationResult[];
  },
};
