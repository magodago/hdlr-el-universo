/*
 * Un solo publicador.
 *
 * Este repositorio se construye y se publica SOLO desde el portátil de David.
 * Si este aviso te para, es que estás en otro equipo: no insistas, no fuerces
 * el push y no publiques. Trae los cambios con `git pull` y avisa a David.
 *
 * Para una publicación legítima desde otro equipo: HDLR_PUBLICAR=1 npm run build
 */

import os from 'node:os';

const PERMITIDOS = ['DavidOrtiz', 'dorti-laptop', 'dorti'];
const anfitrion = os.hostname();
const forzado = process.env.HDLR_PUBLICAR === '1';

if (!PERMITIDOS.includes(anfitrion) && !forzado) {
  console.error(
    [
      '',
      '  ────────────────────────────────────────────────────────────────',
      '   ALTO: este repositorio se publica solo desde el portátil de David.',
      `   Equipo actual: ${anfitrion}`,
      '',
      '   Desde otra máquina: NO construyas ni publiques. Haz `git pull`',
      '   para traer la última versión. Si crees que hace falta un cambio,',
      '   avisa a David ANTES de tocar `main` o `gh-pages`.',
      '   Prohibido `git push --force`: ya ha borrado trabajo tres veces.',
      '  ────────────────────────────────────────────────────────────────',
      '',
    ].join('\n'),
  );
  process.exit(1);
}
