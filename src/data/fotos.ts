/**
 * Fotografía real del universo HDLR.
 *
 * Regla del proyecto: nada de banco de imágenes. Cada foto que entra lleva su
 * origen, su autoría y su licencia, y se cita en la interfaz (pie de foto y
 * créditos del pie de página). Las portadas son las oficiales de la serie.
 *
 * - Fotos de directo: Wikimedia Commons, CC BY-SA 4.0 (autoría citada).
 * - Retrato del dúo y banda de sala: material promocional de natosywaor.com.
 * - Recycled J en directo: Wikimedia Commons, CC BY-SA 4.0.
 * - Portadas Vol. 1 a Vol. 4: tienda oficial del proyecto.
 */

import puertaDirectoImg from '../assets/fotos/puerta-directo.jpg';
import directoEscenaImg from '../assets/fotos/directo-escena.jpg';
import vozDuoImg from '../assets/fotos/voz-duo.jpg';
import vozRecycledImg from '../assets/fotos/voz-recycled.jpg';
import bandaDuoImg from '../assets/fotos/banda-duo.jpg';
import coverVol1Img from '../assets/fotos/cover-vol1.jpg';
import coverVol2Img from '../assets/fotos/cover-vol2.jpg';
import coverVol3Img from '../assets/fotos/cover-vol3.jpg';
import coverVol4Img from '../assets/fotos/cover-vol4.jpg';

export interface Foto {
  /** Ruta ya resuelta por Vite (con la base de GitHub Pages aplicada). */
  src: string;
  alt: string;
  /** Pie de foto que se muestra en la interfaz. */
  pie: string;
  /** Quién firma la foto. */
  credito: string;
  creditoUrl: string;
  licencia: string;
}

export const FOTOS: Record<'puerta' | 'escenario' | 'duo' | 'recycled' | 'sala', Foto> = {
  puerta: {
    src: puertaDirectoImg,
    alt: 'Natos y Waor en directo, con la pantalla de la calavera al fondo',
    pie: 'Natos y Waor en directo',
    credito: 'Ilain Sagunto',
    creditoUrl: 'https://commons.wikimedia.org/wiki/File:Natos_y_Waor.jpg',
    licencia: 'CC BY-SA 4.0 · Wikimedia Commons',
  },
  escenario: {
    src: directoEscenaImg,
    alt: 'Escenario de Natos y Waor con la calavera de Hijos de la Ruina en la pantalla',
    pie: 'La calavera de la Ruina, en el escenario',
    credito: 'Dgr95',
    creditoUrl: 'https://commons.wikimedia.org/wiki/File:Natos_y_Waor_en_concierto.png',
    licencia: 'CC BY-SA 4.0 · Wikimedia Commons',
  },
  duo: {
    src: vozDuoImg,
    alt: 'Natos y Waor, retrato del dúo en la calle',
    pie: 'Natos y Waor',
    credito: 'Deezer',
    creditoUrl: 'https://www.deezer.com/artist/4731196',
    licencia: 'foto del artista en Deezer',
  },
  recycled: {
    src: vozRecycledImg,
    alt: 'Recycled J cantando en directo en el Weekend Beach Festival',
    pie: 'Recycled J, en directo',
    credito: 'María García Muñoz',
    creditoUrl:
      'https://commons.wikimedia.org/wiki/File:Recycled_en_el_Weekend_Beach_Festival.jpg',
    licencia: 'CC BY-SA 4.0 · Wikimedia Commons',
  },
  sala: {
    src: bandaDuoImg,
    alt: 'Natos y Waor retratados delante de un fondo rojo',
    pie: 'Natos y Waor',
    credito: 'natosywaor.com',
    creditoUrl: 'https://natosywaor.com',
    licencia: 'material promocional del proyecto',
  },
};

export const PUERTA: string = FOTOS.puerta.src;

/** Portada oficial de cada volumen, por id del volumen. */
export const COVERS: Record<string, string> = {
  vol1: coverVol1Img,
  vol2: coverVol2Img,
  vol3: coverVol3Img,
  vol4: coverVol4Img,
};

export const CREDITO_PORTADAS = {
  texto: 'Portadas oficiales de la serie',
  url: 'https://natosywaor.com',
};

/** Lista plana para los créditos del pie de página. */
export const CREDITOS_FOTO: Foto[] = [
  FOTOS.puerta,
  FOTOS.escenario,
  FOTOS.duo,
  FOTOS.recycled,
  FOTOS.sala,
];
