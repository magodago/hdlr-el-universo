/**
 * Contratos del motor de recomendacion.
 *
 * La interfaz esta pensada para que hoy funcione el motor local (sin red, sin claves)
 * y mañana se pueda enchufar otro motor (por ejemplo uno con embeddings) sin tocar la UI.
 */

/** Un corte del catalogo, ya normalizado desde src/data/songs.json. */
export interface CatalogTrack {
  id: string;
  title: string;
  volumeId: string;
  volumeTitle: string;
  year: number;
  duration?: string;
  durationSeconds?: number;
  features: string[];
  single: boolean;
  explicit: boolean;
}

/** Criterios que el usuario puede pedir desde la interfaz. */
export interface RecommendationRequest {
  /** Preferencia de epoca: 'inicios' | 'mitad' | 'nuevo' | 'cualquiera' */
  era?: 'inicios' | 'mitad' | 'nuevo' | 'cualquiera';
  /** Si es true, solo se devuelven cortes con colaboraciones externas. */
  withFeaturesOnly?: boolean;
  /** Si es true, solo se devuelven adelantos y singles verificados. */
  singlesOnly?: boolean;
  /** Cuantos resultados devolver. */
  limit?: number;
}

export interface RecommendationResult {
  track: CatalogTrack;
  /** Puntuacion interna del motor local. */
  score: number;
  /** Motivo en lenguaje natural, generado a partir de los campos reales del corte. */
  reason: string;
}

export interface RecommendationEngine {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** Indica si el motor necesita red o claves externas. El local siempre devuelve false. */
  requiresNetwork: boolean;
  recommend(request: RecommendationRequest, catalog: CatalogTrack[]): RecommendationResult[];
}
