import previewsData from '../data/previews.json';
import { alternar, detenerSi, type FuentePreview } from './previewAudio';

/**
 * Banda sonora de la entrada: «Hijos de la ruina» (Vol. 1, 2012), el corte que
 * da nombre al proyecto.
 *
 * Suena por el mismo reproductor unico que los fragmentos del catalogo: si
 * alguien pulsa un corte de la lista, la entrada calla y suena lo que ha pedido.
 * El audio va por el video oficial, asi que no depende de ninguna direccion que
 * pueda caducar.
 */

export const CLAVE_ENTRADA = 'Hijos de la ruina';

const PREVIEWS = previewsData as unknown as Record<string, FuentePreview>;

/** Hay audio para la entrada: solo entonces el interruptor enciende de verdad. */
export function entradaDisponible(): boolean {
  const entrada = PREVIEWS[CLAVE_ENTRADA];
  return Boolean(entrada?.youtube || entrada?.url);
}

/** Enciende la entrada, en bucle. Devuelve false si no hay nada que poner. */
export function arrancarEntrada(): boolean {
  const entrada = PREVIEWS[CLAVE_ENTRADA];
  if (!entrada?.youtube && !entrada?.url) return false;
  alternar(CLAVE_ENTRADA, entrada, { bucle: true });
  return true;
}

/** Apaga la entrada si es la que esta sonando. */
export function pararEntrada(): void {
  detenerSi(CLAVE_ENTRADA);
}
