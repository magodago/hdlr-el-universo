import previewsData from '../data/previews.json';
import { suscribir } from './previewAudio';
import { soundManager } from './sound';

/**
 * Banda sonora de la entrada: el fragmento oficial de "Hijos de la ruina"
 * (Vol. 1, 2012), cortesia de Deezer. Es el corte que le da nombre al
 * proyecto.
 *
 * Reglas:
 *  - Suena solo si la persona enciende el interruptor de sonido.
 *  - En bucle y a volumen bajo: acompaña la lectura, no la tapa.
 *  - Si arranca cualquier otro fragmento del catalogo, este se aparta y
 *    vuelve cuando el otro termina.
 */

interface EntradaPreview {
  url: string;
  fuente: string;
}

const PREVIEWS = previewsData as unknown as Record<string, EntradaPreview>;

export const TITULO_ENTRADA = 'Hijos de la ruina';

let audio: HTMLAudioElement | null = null;
let apartadoPorFragmento = false;

function nodo(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  const entrada = PREVIEWS[TITULO_ENTRADA];
  if (!entrada?.url) return null;
  if (!audio) {
    audio = new Audio(entrada.url);
    audio.loop = true;
    audio.volume = 0.34;
    audio.preload = 'none';
  }
  return audio;
}

/** Solo hay banda sonora si el corte tiene fragmento oficial registrado. */
export function entradaDisponible(): boolean {
  return Boolean(PREVIEWS[TITULO_ENTRADA]?.url);
}

export function fuenteEntrada(): string {
  return PREVIEWS[TITULO_ENTRADA]?.fuente ?? '';
}

export function arrancarEntrada(): void {
  const el = nodo();
  if (!el) return;
  apartadoPorFragmento = false;
  void el.play().catch(() => {
    /* el navegador puede pedir otro gesto: se reintenta al siguiente toque */
  });
}

export function pararEntrada(): void {
  if (!audio) return;
  apartadoPorFragmento = false;
  audio.pause();
}

/* Mientras suena un fragmento del catalogo, la banda sonora se aparta. */
suscribir((estado) => {
  if (!audio || !soundManager.isEnabled()) return;

  if (estado.sonando) {
    if (!audio.paused) {
      apartadoPorFragmento = true;
      audio.pause();
    }
    return;
  }

  if (apartadoPorFragmento) {
    apartadoPorFragmento = false;
    void audio.play().catch(() => undefined);
  }
});
