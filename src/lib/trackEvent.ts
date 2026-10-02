/**
 * Capa de analitica abstracta de HDLR - El Universo.
 *
 * Reglas del proyecto:
 *  - Nada de Google Analytics.
 *  - Nada de cookies.
 *  - Nada de peticiones a servidores externos.
 *  - Sin datos personales: ni email, ni telefono, ni ubicacion exacta.
 *
 * De momento solo escribe en consola y guarda un contador anonimo en localStorage
 * para poder ver, en local, que los eventos se disparan. El dia que se quiera enviar
 * a un backend propio, basta con implementar otro `AnalyticsSink` y registrarlo aqui.
 */

export type TrackEventName =
  | 'app_view'
  | 'experience_open'
  | 'experience_locked'
  | 'nav_click'
  | 'cta_click'
  | 'song_open'
  | 'volume_open'
  | 'map_city_select'
  | 'map_filter_change'
  | 'recommender_run'
  | 'recommender_pick'
  | 'timeline_filter_change';

export interface TrackEventPayload {
  [key: string]: string | number | boolean | undefined;
}

export interface AnalyticsSink {
  readonly id: string;
  send(event: TrackEventName, payload: TrackEventPayload): void;
}

const STORAGE_KEY = 'hdlr.events.v1';
const DEBUG = import.meta.env.DEV;

function readCounters(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeCounters(counters: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
  } catch {
    /* almacenamiento no disponible: se ignora en silencio */
  }
}

/** Sumidero por defecto: consola en desarrollo, contador anonimo en localStorage. */
const localSink: AnalyticsSink = {
  id: 'local',
  send(event, payload) {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.info('[hdlr:event]', event, payload);
    }
    const counters = readCounters();
    counters[event] = (counters[event] ?? 0) + 1;
    writeCounters(counters);
  },
};

const sinks: AnalyticsSink[] = [localSink];

/** Registra un sumidero adicional (por ejemplo un backend propio, mas adelante). */
export function registerSink(sink: AnalyticsSink): void {
  sinks.push(sink);
}

/** Punto unico de entrada para registrar eventos. */
export function trackEvent(event: TrackEventName, payload: TrackEventPayload = {}): void {
  for (const sink of sinks) {
    try {
      sink.send(event, payload);
    } catch {
      /* un sumidero roto no debe romper la interfaz */
    }
  }
}

/** Lee los contadores anonimos guardados en este navegador. */
export function readLocalEventCounters(): Record<string, number> {
  return readCounters();
}
