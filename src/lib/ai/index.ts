import { localRecommendationEngine } from './localRecommendationEngine';
import type { RecommendationEngine } from './types';

/**
 * Registro de motores de recomendacion disponibles.
 *
 * Hoy hay uno solo, el local, que no necesita red ni claves. Para añadir otro motor
 * (por ejemplo uno con embeddings servido por un backend propio) basta con implementar
 * la interfaz `RecommendationEngine` y añadirlo a esta lista. La interfaz de usuario
 * consume siempre `getActiveEngine()`, asi que no hay que tocar componentes.
 */
const engines: RecommendationEngine[] = [localRecommendationEngine];

export function listEngines(): RecommendationEngine[] {
  return engines;
}

export function getActiveEngine(): RecommendationEngine {
  return engines[0];
}

export * from './types';
export { localRecommendationEngine };
