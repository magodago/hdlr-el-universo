#!/usr/bin/env node
/**
 * Renueva los fragmentos de 30 segundos que ofrece Deezer para cada corte del
 * catalogo y los deja en src/data/previews.json.
 *
 * Por que existe: la direccion del fragmento que devuelve Deezer lleva firma con
 * fecha de caducidad. Guardarla y olvidarse no sirve: a los pocos dias deja de
 * sonar. Este script vuelve a pedir cada fragmento y reescribe el fichero, de modo
 * que el flujo diario de GitHub Actions mantiene siempre enlaces frescos.
 *
 * Sin claves y sin cuentas: la API publica de Deezer no pide ninguna.
 *
 * Uso: node scripts/refrescar-previews.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SONGS_PATH = join(ROOT, 'src', 'data', 'songs.json');
const OUT_PATH = join(ROOT, 'src', 'data', 'previews.json');

/** Artista con el que se firma el catalogo. Se busca siempre artista mas titulo. */
const ARTISTA = 'Natos y Waor';
const FUENTE = 'Deezer';

function escribe(linea) {
  process.stdout.write(`${linea}\n`);
}

function dormir(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Quita acentos, mayusculas y signos para comparar titulos sin falsos negativos. */
function normaliza(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Comprueba que el titulo devuelto se parece al buscado. No se acepta una
 * coincidencia vaga: asi se evitan otras versiones o versiones de otros artistas.
 */
function tituloParecido(devuelto, buscado) {
  const a = normaliza(devuelto);
  const b = normaliza(buscado);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const tokensA = a.split(' ');
  const tokensB = new Set(b.split(' '));
  const comunes = tokensA.filter((token) => tokensB.has(token)).length;
  const minimo = Math.min(tokensA.length, tokensB.size);
  return minimo > 0 && comunes / minimo >= 0.75;
}

async function buscaEnDeezer(titulo) {
  const consulta = encodeURIComponent(`${ARTISTA} ${titulo}`);
  const url = `https://api.deezer.com/search?q=${consulta}&limit=1`;

  for (let intento = 0; intento < 3; intento += 1) {
    try {
      const respuesta = await fetch(url, {
        headers: { accept: 'application/json' },
      });
      if (!respuesta.ok) {
        await dormir(600 * (intento + 1));
        continue;
      }
      const cuerpo = await respuesta.json();
      return Array.isArray(cuerpo.data) ? cuerpo.data[0] : undefined;
    } catch {
      await dormir(600 * (intento + 1));
    }
  }
  return undefined;
}

async function main() {
  const catalogo = JSON.parse(readFileSync(SONGS_PATH, 'utf8'));
  const cortes = catalogo.volumes.flatMap((volumen) =>
    volumen.tracks.map((corte) => ({ volumen: volumen.shortTitle, titulo: corte.title })),
  );

  const previews = {};
  const sinPreview = [];

  for (let i = 0; i < cortes.length; i += 1) {
    const { titulo } = cortes[i];
    const resultado = await buscaEnDeezer(titulo);

    const valido =
      resultado &&
      typeof resultado.preview === 'string' &&
      resultado.preview.length > 0 &&
      tituloParecido(resultado.title, titulo);

    if (valido) {
      previews[titulo] = { url: resultado.preview, fuente: FUENTE };
    } else {
      sinPreview.push({ titulo, motivo: resultado ? 'sin coincidencia clara o sin fragmento' : 'sin respuesta de Deezer' });
    }

    await dormir(320);
  }

  writeFileSync(OUT_PATH, `${JSON.stringify(previews, null, 2)}\n`, 'utf8');

  const total = cortes.length;
  const conPreview = Object.keys(previews).length;

  escribe(`Previews renovados: ${conPreview} de ${total} cortes`);
  if (sinPreview.length > 0) {
    escribe(`Sin fragmento (fuera del JSON, no se ha inventado nada): ${sinPreview.length}`);
    for (const corte of sinPreview) {
      escribe(`  - ${corte.titulo} (${corte.motivo})`);
    }
  }
  escribe(`Escrito en ${OUT_PATH}`);
}

main().catch((error) => {
  process.stderr.write(`Fallo al renovar los previews: ${error?.message ?? error}\n`);
  process.exit(1);
});
