import type { CatalogTrack } from './types';
import type { StoryMatch, StoryReading } from './storyEngine';

/**
 * Motor DeepSeek (opcional, APAGADO por defecto).
 *
 * POR QUE ESTA APAGADO
 * HDLR, El Universo se publica como sitio estatico en GitHub Pages. Todo lo que
 * llega al navegador es publico, asi que una clave de API metida aqui quedaria
 * expuesta al primero que abra las herramientas del desarrollador. Por eso este
 * motor NO se activa hoy y NO lee ninguna clave: solo sabe hablar con un proxy
 * propio que guarde la clave en el servidor.
 *
 * COMO SE ENCENDERIA (trabajo de servidor, no de frontend)
 * 1. Montar un endpoint propio (funcion serverless, Worker, VPS) que reciba el
 *    texto de la persona y el catalogo minimo, y que por dentro llame a DeepSeek
 *    usando `process.env.DEEPSEEK_API_KEY`. La clave se queda en el servidor.
 * 2. Publicar el motor al frontend con `window.__HDLR_AI__ = { endpoint: '...' }`
 *    o con la variable de build `VITE_HDLR_AI_ENDPOINT` (una URL publica, nunca
 *    una clave).
 * 3. Llamar a `resolveDeepseekConfig()`: si devuelve algo, el motor sigue sin
 *    encenderse solo; hay que pasarlo a mano a `deepseekRecommendationEngine()`.
 *
 * MIENTRAS TANTO
 * La app funciona con el motor local (`localStoryEngine`) y con cero variables de
 * entorno. Si este motor se llama sin configuracion, lanza un error explicito en
 * vez de devolver resultados inventados.
 */

export interface DeepseekEngineConfig {
  /** URL del proxy propio. Es lo unico que viaja al navegador. */
  endpoint: string;
  /** Nombre del modelo que el proxy usara por dentro. */
  model: string;
}

/** Mensaje unico si la recomendacion no estuviera disponible en esta entrega. */
export const DEEPSEEK_DISABLED_MESSAGE =
  'La recomendacion no esta disponible ahora mismo. Vuelve a intentarlo en un momento.';

interface InjectedAiConfig {
  endpoint?: unknown;
  model?: unknown;
}

/**
 * Lee la configuracion inyectada por el servidor. Devuelve null si no hay nada
 * util. No lee, ni busca, ni acepta claves de API: eso se queda en el servidor.
 */
export function resolveDeepseekConfig(): DeepseekEngineConfig | null {
  const fromWindow =
    typeof window === 'undefined'
      ? undefined
      : (window as Window & { __HDLR_AI__?: InjectedAiConfig }).__HDLR_AI__;

  const endpoint =
    (typeof fromWindow?.endpoint === 'string' ? fromWindow.endpoint : undefined) ??
    (import.meta.env.VITE_HDLR_AI_ENDPOINT as string | undefined);

  if (!endpoint || !/^https?:\/\//.test(endpoint)) return null;

  const model =
    (typeof fromWindow?.model === 'string' ? fromWindow.model : undefined) ??
    (import.meta.env.VITE_HDLR_AI_MODEL as string | undefined) ??
    'deepseek-chat';

  return { endpoint, model };
}

/**
 * Motor remoto, con la misma forma que el local pero asincrono. Se construye
 * apagado: si nadie lo enciende a proposito, no hay forma de que entre en juego.
 */
export interface AsyncStoryEngine {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly requiresNetwork: boolean;
  readonly enabled: boolean;
  recommend(reading: StoryReading, catalog: CatalogTrack[]): Promise<StoryMatch[]>;
}

export function deepseekRecommendationEngine(config?: DeepseekEngineConfig): AsyncStoryEngine {
  const resolved = config ?? null;

  return {
    id: 'deepseek',
    label: 'Recomendación',
    description:
      'Motor remoto de reserva. Necesita un proxy propio que guarde la clave en el servidor. Apagado por defecto: sin configuracion no se llama nunca.',
    requiresNetwork: true,
    enabled: false,

    async recommend(reading: StoryReading, catalog: CatalogTrack[]): Promise<StoryMatch[]> {
      if (!resolved) {
        throw new Error(DEEPSEEK_DISABLED_MESSAGE);
      }

      const response = await fetch(resolved.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: resolved.model,
          // Solo viaja lo que hace falta para ordenar el catalogo. Nada de datos
          // personales: el texto se manda porque es justo lo que se analiza.
          story: reading.raw,
          tags: reading.tags.map((tag) => tag.id),
          intensity: reading.intensity,
          catalog: catalog.map((track) => ({
            id: track.id,
            title: track.title,
            volumeId: track.volumeId,
            year: track.year,
            features: track.features,
            single: track.single,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`El proxy de IA ha respondido con ${response.status}.`);
      }

      // El proxy debe devolver la misma forma que el motor local: id de corte,
      // puntuacion y motivo. El frontend no confia en un motivo vacio: si falta,
      // se descarta la sugerencia.
      const data = (await response.json()) as { matches?: StoryMatch[] };
      return (data.matches ?? []).filter((match) => Boolean(match.trackId && match.reason));
    },
  };
}
