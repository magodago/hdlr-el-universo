import type { CatalogTrack } from './types';

/**
 * Motor local de "historia a cancion".
 *
 * Funciona entero en el navegador, sin red y sin claves. Lee lo que escribe la
 * persona, lo convierte en etiquetas (emocion, contexto y temas) y busca esas
 * etiquetas en el catalogo real de src/data/songs.json.
 *
 * COMO EVITA INVENTAR
 * Este motor NO trabaja con letras de canciones: el proyecto no aloja ni analiza
 * letras. Lo unico que compara es:
 *  - la etiqueta que ha detectado en el texto libre, y
 *  - el TITULO del corte y sus datos publicados (volumen, año, colaboraciones,
 *    si fue adelanto).
 * Es decir: si la persona escribe "noche", el motor puede señalar un corte titulado
 * "De madrugada". No afirma nada sobre lo que dice la cancion. Cuando no hay
 * ninguna coincidencia decente, no la fuerza: devuelve una lista vacia y la
 * interfaz lo dice claro en vez de rellenar el hueco con algo inventado.
 */

export type TagDimension = 'emocion' | 'contexto' | 'tema';

export interface StoryTag {
  id: string;
  label: string;
  /** Etiqueta corta para los chips de la interfaz. */
  chip: string;
  dimension: TagDimension;
}

export type Intensity = 'baja' | 'media' | 'alta';

export interface StoryReading {
  /** Texto original tal cual lo escribio la persona (solo se usa en memoria). */
  raw: string;
  tags: StoryTag[];
  intensity: Intensity;
  /** Motivos que han sumado intensidad, para poder explicarla en pantalla. */
  intensitySignals: string[];
  wordCount: number;
  /** Texto demasiado corto para leer nada con sentido. */
  tooShort: boolean;
}

export interface StoryMatch {
  trackId: string;
  title: string;
  artist: string;
  volumeTitle: string;
  year: number;
  score: number;
  /** Etiquetas de la historia que han encajado con este corte. */
  matchedTags: StoryTag[];
  /** Palabras del titulo que han hecho de puente. */
  bridges: string[];
  reason: string;
  /** Coincidencia clara (por encima del umbral de confianza). */
  strong: boolean;
  spotify?: string;
  youtube?: string;
}

export interface StoryEngine {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly requiresNetwork: boolean;
  readonly enabled: boolean;
  recommend(reading: StoryReading, catalog: CatalogTrack[], options?: RecommendOptions): StoryMatch[];
}

/* ------------------------------------------------------------------ */
/* Normalizacion                                                       */
/* ------------------------------------------------------------------ */

/** Pasa el texto a minusculas, sin acentos y solo con letras y numeros. */
export function normalise(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function words(input: string): string[] {
  const value = normalise(input);
  return value ? value.split(' ') : [];
}

/**
 * Una palabra del titulo encaja con una raiz si es igual, o si la raiz tiene 4
 * letras o mas y la palabra empieza por ella (asi "cansad" coge "cansado" pero
 * "no" no coge "nosotros").
 */
function wordMatches(word: string, root: string): boolean {
  if (word === root) return true;
  return root.length >= 4 && word.startsWith(root);
}

/* ------------------------------------------------------------------ */
/* Lexico                                                              */
/* ------------------------------------------------------------------ */

interface TagRule {
  id: string;
  label: string;
  chip: string;
  dimension: TagDimension;
  weight: number;
  /** Raices que se buscan en lo que escribe la persona. */
  triggers: string[];
  /** Raices que se buscan en el TITULO del corte. Vacio = no puntua, solo se muestra. */
  titleTokens: string[];
}

const RULES: TagRule[] = [
  /* --- Emocion ----------------------------------------------------- */
  {
    id: 'soledad',
    label: 'soledad',
    chip: 'Soledad',
    dimension: 'emocion',
    weight: 2,
    triggers: ['sol', 'sola', 'solo', 'soledad', 'nadie', 'vacio', 'vacia', 'aislad', 'incomprendid', 'marginad', 'apartad'],
    titleTokens: ['nadie'],
  },
  {
    id: 'nostalgia',
    label: 'nostalgia',
    chip: 'Nostalgia',
    dimension: 'emocion',
    weight: 2,
    triggers: ['recuerdo', 'recordar', 'antes', 'pasado', 'añoro', 'añoranza', 'infancia', 'niñez', 'cuando era', 'antiguo', 'otra epoca', 'volver a'],
    titleTokens: ['otra', 'vez', 'cambiado', 'cambio'],
  },
  {
    id: 'rabia',
    label: 'rabia',
    chip: 'Rabia',
    dimension: 'emocion',
    weight: 2,
    triggers: ['rabia', 'cabread', 'furia', 'odio', 'odiar', 'hart', 'ira', 'cabreo', 'explot', 'grit', 'hostia', 'indignad', 'me enciende'],
    titleTokens: ['fuego', 'matar', 'control', 'puta'],
  },
  {
    id: 'tristeza',
    label: 'dolor',
    chip: 'Dolor',
    dimension: 'emocion',
    weight: 2,
    triggers: ['triste', 'llor', 'llanto', 'dolor', 'roto', 'rota', 'hundid', 'bajon', 'jodid', 'penas', 'sufri', 'me duele'],
    titleTokens: ['roto', 'penas', 'muerto', 'sudores'],
  },
  {
    id: 'amor',
    label: 'amor',
    chip: 'Amor',
    dimension: 'emocion',
    weight: 2,
    triggers: ['amor', 'enamorad', 'quiero', 'cariño', 'pareja', 'novi', 'beso', 'abraz', 'corazon', 'quiero estar con'],
    titleTokens: ['love', 'amor'],
  },
  {
    id: 'despedida',
    label: 'una despedida',
    chip: 'Despedida',
    dimension: 'emocion',
    weight: 2,
    triggers: ['dej', 'ruptur', 'rompim', 'olvid', 'desamor', 'separ', 'adios', 'ultima vez', 'se fue', 'desped', 'me dejo'],
    titleTokens: ['tumba', 'dime'],
  },
  {
    id: 'ansiedad',
    label: 'ansiedad',
    chip: 'Ansiedad',
    dimension: 'emocion',
    weight: 2,
    triggers: ['ansied', 'miedo', 'panico', 'angust', 'nervi', 'agobi', 'presion', 'preocup', 'insomnio', 'no puedo dormir', 'no duermo', 'desvelad'],
    titleTokens: ['control', 'frios'],
  },
  {
    id: 'calma',
    label: 'calma',
    chip: 'Calma',
    dimension: 'emocion',
    weight: 1,
    triggers: ['calma', 'tranquil', 'relax', 'paz', 'respir', 'pausa', 'serenid', 'sin prisa', 'chill', 'despacio'],
    titleTokens: ['chillin'],
  },
  {
    id: 'euforia',
    label: 'ganas de fiesta',
    chip: 'Euforia',
    dimension: 'emocion',
    weight: 2,
    triggers: ['fiesta', 'euforia', 'ganas', 'celebr', 'bail', 'locura', 'subidon', 'marcha', 'salir de noche', 'verbena', 'disfrut'],
    titleTokens: ['fuego', 'alcohol', 'domingos', 'chandal'],
  },
  {
    id: 'orgullo',
    label: 'orgullo',
    chip: 'Orgullo',
    dimension: 'emocion',
    weight: 1,
    triggers: ['orgull', 'logro', 'consegui', 'conseguid', 'crecer', 'campeon', 'lo he hecho', 'mio'],
    titleTokens: ['glorias', 'capital', 'first'],
  },
  {
    id: 'esperanza',
    label: 'ganas de seguir',
    chip: 'Esperanza',
    dimension: 'emocion',
    weight: 1,
    triggers: ['esperanza', 'futuro', 'animo', 'salir adelante', 'mejor', 'superar', 'arrancar', 'tirar para adelante', 'resurgir'],
    titleTokens: ['glorias', 'dime'],
  },
  {
    id: 'cansancio',
    label: 'cansancio',
    chip: 'Cansancio',
    dimension: 'emocion',
    weight: 2,
    triggers: ['cansad', 'cansancio', 'agotad', 'no puedo mas', 'quemad', 'hartazgo', 'extenuad', 'pesad', 'sin fuerzas'],
    titleTokens: ['cansado', 'fingir'],
  },
  {
    id: 'culpa',
    label: 'arrepentimiento',
    chip: 'Culpa',
    dimension: 'emocion',
    weight: 1,
    triggers: ['culpa', 'arrepent', 'perdon', 'fallo', 'falle', 'error', 'equivoqu', 'remord', 'la cague'],
    titleTokens: ['trampa', 'fingir'],
  },
  {
    id: 'rebeldia',
    label: 'ir por libre',
    chip: 'Rebeldía',
    dimension: 'emocion',
    weight: 2,
    triggers: ['diferent', 'raro', 'rara', 'distint', 'oveja negra', 'no encajo', 'fuera de lugar', 'inadaptad', 'a mi rollo', 'no sigo'],
    titleTokens: ['oveja'],
  },
  {
    id: 'frialdad',
    label: 'frialdad',
    chip: 'Frialdad',
    dimension: 'emocion',
    weight: 1,
    triggers: ['frialdad', 'indiferent', 'da igual', 'nada me importa', 'pasot', 'seco', 'sin sentir'],
    titleTokens: ['frios', 'zero'],
  },

  /* --- Contexto ---------------------------------------------------- */
  {
    id: 'noche',
    label: 'la noche',
    chip: 'Noche',
    dimension: 'contexto',
    weight: 3,
    triggers: ['noche', 'madrugada', 'de madrugada', 'amanecer', 'luna', 'estrellas', 'a las tantas', 'trasnoch'],
    titleTokens: ['madrugada', 'noche', 'luna'],
  },
  {
    id: 'calle',
    label: 'la calle y el barrio',
    chip: 'Barrio',
    dimension: 'contexto',
    weight: 2,
    triggers: ['barrio', 'calle', 'callejon', 'bloque', 'parque', 'plaza', 'portal', 'esquina', 'vecin', 'block', 'urbanizacion'],
    titleTokens: ['barrio', 'calles', 'calle'],
  },
  {
    id: 'ciudad',
    label: 'la ciudad',
    chip: 'Ciudad',
    dimension: 'contexto',
    weight: 2,
    triggers: ['ciudad', 'madrid', 'capital', 'centro', 'metro', 'urbe', 'vallecas', 'lavapies', 'carabanchel', 'mi barrio de madrid'],
    titleTokens: ['madriz', 'madrid', 'capital', 'chandal'],
  },
  {
    id: 'carretera',
    label: 'la carretera',
    chip: 'Carretera',
    dimension: 'contexto',
    weight: 3,
    triggers: ['carretera', 'viaje', 'coche', 'conduc', 'kilometro', 'ruta', 'autopista', 'volante', 'huida', 'marchar', 'pirar', 'irme', 'aeropuerto', 'tren', 'escapar'],
    titleTokens: ['carretera'],
  },
  {
    id: 'exceso',
    label: 'el exceso',
    chip: 'Exceso',
    dimension: 'contexto',
    weight: 3,
    triggers: ['copa', 'birra', 'alcohol', 'cubata', 'borrach', 'botellon', 'discoteca', 'garito', 'beber', 'bebo', 'cuba', 'resaca', 'droga', 'porro', 'pastilla', 'vicio', 'adiccion', 'pedo', 'colocad', 'bar '],
    titleTokens: ['alcohol', 'fuego'],
  },
  {
    id: 'casa',
    label: 'casa',
    chip: 'Casa',
    dimension: 'contexto',
    weight: 1,
    triggers: ['casa', 'sofa', 'cama', 'habitacion', 'piso', 'hogar', 'techo', 'cocina', 'salon', 'encerrad', 'a solas en'],
    titleTokens: ['dentro'],
  },
  {
    id: 'curro',
    label: 'el trabajo',
    chip: 'Curro',
    dimension: 'contexto',
    weight: 1,
    triggers: ['trabajo', 'curro', 'jefe', 'turno', 'nomina', 'dinero', 'pasta', 'deuda', 'factura', 'pagar', 'sueldo', 'paro', 'hipoteca', 'alquiler', 'euros'],
    titleTokens: ['class', 'first'],
  },
  {
    id: 'gente',
    label: 'los tuyos',
    chip: 'Los tuyos',
    dimension: 'contexto',
    weight: 2,
    triggers: ['amigo', 'colega', 'hermano', 'familia', 'madre', 'padre', 'primo', 'cuadrilla', 'peña', 'banda', 'gente', 'compis', 'pandilla', 'los mios'],
    titleTokens: ['hijos', 'ruina', 'nosotros', 'ninos', 'capital', 'hdlr'],
  },
  {
    id: 'frionvierno',
    label: 'el frío',
    chip: 'Frío',
    dimension: 'contexto',
    weight: 2,
    triggers: ['invierno', 'frio', 'nieve', 'lluvia', 'diciembre', 'helad', 'chaqueta', 'abrigo', 'zero grados', 'bajo cero'],
    titleTokens: ['frios', 'zero'],
  },
  {
    id: 'verano',
    label: 'el calor',
    chip: 'Verano',
    dimension: 'contexto',
    weight: 1,
    triggers: ['verano', 'calor', 'agosto', 'playa', 'vacacion', 'julio'],
    titleTokens: ['fuego'],
  },

  /* --- Temas ------------------------------------------------------- */
  {
    id: 'descontrol',
    label: 'perder el control',
    chip: 'Descontrol',
    dimension: 'tema',
    weight: 2,
    triggers: ['demasiado', 'exceso', 'sin limite', 'descontrol', 'pierdo el control', 'me paso', 'no me controlo', 'a lo loco'],
    titleTokens: ['control', 'alcohol'],
  },
  {
    id: 'dudas',
    label: 'las dudas',
    chip: 'Dudas',
    dimension: 'tema',
    weight: 1,
    triggers: ['dudo', 'dudas', 'no se', 'indecis', 'altibajos', 'confusion', 'perdid', 'no encuentro', 'medias tintas', 'tiras y aflojas'],
    titleTokens: ['tiras', 'aflojas', 'tintas', 'no', 'se'],
  },
  {
    id: 'muerte',
    label: 'la muerte',
    chip: 'Muerte',
    dimension: 'tema',
    weight: 2,
    triggers: ['muerte', 'morir', 'muerto', 'tumba', 'funeral', 'entierro', 'fallecid', 'no esta', 'se fue para siempre'],
    titleTokens: ['morir', 'matar', 'muerto', 'tumba', 'vida'],
  },
  {
    id: 'fe',
    label: 'la fe',
    chip: 'Fe',
    dimension: 'tema',
    weight: 2,
    triggers: ['dios', 'fe', 'rezar', 'iglesia', 'alma', 'destino', 'suerte', 'karma', 'señal', 'creer en'],
    titleTokens: ['fe'],
  },
  {
    id: 'trampa',
    label: 'la mentira',
    chip: 'Mentira',
    dimension: 'tema',
    weight: 2,
    triggers: ['engaño', 'mentira', 'mentir', 'trampa', 'traicion', 'falso', 'usaron', 'utilizan', 'te fallo'],
    titleTokens: ['trampa', 'fingir'],
  },
  {
    id: 'sacrificio',
    label: 'aguantar',
    chip: 'Aguantar',
    dimension: 'tema',
    weight: 1,
    triggers: ['aguanto', 'aguantar', 'sacrificio', 'esfuerzo', 'luchar', 'pelear', 'sobrevivir', 'resistir', 'carne de cañon', 'me toca'],
    titleTokens: ['carne', 'canon'],
  },
  {
    id: 'mezcla',
    label: 'no encajar',
    chip: 'Choque',
    dimension: 'tema',
    weight: 1,
    triggers: ['mezcla', 'incompatible', 'agua y aceite', 'no encajamos', 'polos opuestos', 'contradictori', 'a la vez'],
    titleTokens: ['agua', 'aceite'],
  },
  {
    id: 'tiempo',
    label: 'el paso del tiempo',
    chip: 'Tiempo',
    dimension: 'tema',
    weight: 1,
    triggers: ['tiempo', 'años', 'envejec', 'reloj', 'mayor', 'juventud', 'viejo', 'pequeño', 'niñez', 'hace años'],
    titleTokens: ['vida'],
  },
];

/* ------------------------------------------------------------------ */
/* Indice de reglas (triggers normalizados, listos para comparar)      */
/* ------------------------------------------------------------------ */

interface MatchRule extends TagRule {
  triggerChecks: { phrase: boolean; norm: string }[];
  titleRoots: string[];
}

const MATCH_RULES: MatchRule[] = RULES.map((rule) => ({
  ...rule,
  triggerChecks: rule.triggers.map((trigger) => ({
    phrase: trigger.includes(' '),
    norm: normalise(trigger),
  })),
  titleRoots: rule.titleTokens.map((token) => normalise(token)),
}));

/**
 * Una regla salta si alguna de sus raices aparece en el texto. Las expresiones de
 * varias palabras se buscan tal cual; las de una sola palabra se comparan contra
 * palabras completas (o su principio, si la raiz tiene cuatro letras o mas), para
 * que "sol" no se dispare con "solidario" ni "ira" con "mira".
 */
function triggerHits(textWords: string[], paddedPlain: string, rule: MatchRule): boolean {
  return rule.triggerChecks.some((check) => {
    if (check.phrase) return paddedPlain.includes(` ${check.norm} `);
    return textWords.some((word) => wordMatches(word, check.norm));
  });
}

/* ------------------------------------------------------------------ */
/* Lectura del texto                                                   */
/* ------------------------------------------------------------------ */

const INTENSIFIERS = [
  'mucho',
  'mucha',
  'muchisimo',
  'demasiado',
  'mil',
  'nunca',
  'siempre',
  'nada',
  'todo',
  'joder',
  'hostia',
  'brutal',
  'horrible',
  'fatal',
  'increible',
  'muy',
  'super',
  'terrible',
  'harto',
  'harta',
  'no puedo mas',
  'de verdad',
  'en serio',
];

function countIntensitySignals(text: string): string[] {
  const signals: string[] = [];
  const plain = normalise(text);
  const exclamations = (text.match(/!/g) ?? []).length;
  const questions = (text.match(/\?/g) ?? []).length;
  const capsWords = (text.match(/\b[A-ZÁÉÍÓÚÑ]{3,}\b/g) ?? []).length;

  if (exclamations >= 2) signals.push(`${exclamations} exclamaciones`);
  else if (exclamations === 1) signals.push('una exclamacion');

  if (questions >= 1) signals.push('preguntas en el texto');
  if (capsWords >= 2) signals.push('palabras en mayusculas');

  const repeated = /(.)\1{2,}/.test(text);
  if (repeated) signals.push('letras repetidas');

  const hits = INTENSIFIERS.filter((word) => plain.includes(word));
  if (hits.length > 0) signals.push(`intensificadores: ${hits.slice(0, 4).join(', ')}`);

  return signals;
}

export function analyseStory(text: string): StoryReading {
  const padded = ` ${normalise(text)} `;
  const textWords = words(text);
  const wordCount = textWords.length;

  const tags: StoryTag[] = [];
  const seen = new Set<string>();

  for (const rule of MATCH_RULES) {
    if (triggerHits(textWords, padded, rule) && !seen.has(rule.id)) {
      seen.add(rule.id);
      tags.push({ id: rule.id, label: rule.label, chip: rule.chip, dimension: rule.dimension });
    }
  }

  const intensitySignals = countIntensitySignals(text);
  const intensityValue = intensitySignals.length + (wordCount >= 60 ? 1 : 0) + tags.length * 0.5;
  const intensity: Intensity = intensityValue >= 5 ? 'alta' : intensityValue >= 2.5 ? 'media' : 'baja';

  return {
    raw: text,
    tags,
    intensity,
    intensitySignals,
    wordCount,
    tooShort: wordCount < 4,
  };
}

/* ------------------------------------------------------------------ */
/* Emparejamiento                                                      */
/* ------------------------------------------------------------------ */

const MIN_SCORE = 2;
const STRONG_SCORE = 4;
const BASE_ARTIST = 'Natos y Waor y Recycled J';

export function artistFor(track: CatalogTrack): string {
  if (track.features.length === 0) return BASE_ARTIST;
  return `${BASE_ARTIST}, con ${track.features.join(', ')}`;
}

function bridgesFor(titleWords: string[], tokens: string[]): string[] {
  return tokens.filter((token) => titleWords.some((word) => wordMatches(word, token)));
}

export interface RecommendOptions {
  limit?: number;
  /** Enlaces verificados por id de corte. Se inyectan para no acoplar el motor a los datos. */
  links?: Record<string, { spotify?: string; youtube?: string }>;
}

export function recommendForStory(
  reading: StoryReading,
  catalog: CatalogTrack[],
  options: RecommendOptions = {},
): StoryMatch[] {
  const limit = options.limit ?? 3;
  if (reading.tooShort || reading.tags.length === 0) return [];

  const matchedRules = MATCH_RULES.filter((rule) => reading.tags.some((tag) => tag.id === rule.id));

  const scored = catalog.map((track) => {
    const titleWords = words(track.title);
    const hitTags: StoryTag[] = [];
    const bridges: string[] = [];
    let score = 0;

    for (const rule of matchedRules) {
      if (rule.titleRoots.length === 0) continue;
      const bridgesForRule = bridgesFor(titleWords, rule.titleRoots);
      if (bridgesForRule.length === 0) continue;
      score += rule.weight;
      hitTags.push({ id: rule.id, label: rule.label, chip: rule.chip, dimension: rule.dimension });
      for (const bridge of bridgesForRule) {
        if (!bridges.includes(bridge)) bridges.push(bridge);
      }
    }

    if (score === 0) return null;

    // Señales secundarias, todas comprobables en el catalogo.
    if (track.single) score += 0.75;
    if (track.features.length > 0 && hitTags.some((tag) => tag.id === 'gente')) score += 0.5;

    return {
      trackId: track.id,
      title: track.title,
      artist: artistFor(track),
      volumeTitle: track.volumeTitle,
      year: track.year,
      score,
      matchedTags: hitTags,
      bridges,
      strong: score >= STRONG_SCORE,
    };
  });

  const results = scored
    .filter((match): match is NonNullable<typeof match> => match !== null)
    .filter((match) => match.score >= MIN_SCORE)
    .sort(
      (a, b) =>
        b.score - a.score ||
        // A igualdad de puntuacion, gana el corte que recoge mas etiquetas
        // de la historia: asi la explicacion cubre mas de lo que se ha leido.
        b.matchedTags.length - a.matchedTags.length ||
        a.year - b.year ||
        a.title.localeCompare(b.title),
    )
    .slice(0, limit);

  return results.map((match) => ({
    ...match,
    reason: buildReason(match),
    spotify: options.links?.[match.trackId]?.spotify,
    youtube: options.links?.[match.trackId]?.youtube,
  }));
}

function buildReason(match: Omit<StoryMatch, 'reason'>): string {
  const labels = match.matchedTags.map((tag) => tag.label);
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;

  const parts: string[] = [];
  parts.push(`Tu historia y este corte se cruzan en ${list}.`);
  parts.push(`Se llama «${match.title}» y entra en el ${match.volumeTitle} (${match.year}).`);
  return parts.join(' ');
}

export const localStoryEngine: StoryEngine = {
  id: 'local',
  label: 'Motor local',
  description:
    'Lee el texto en tu propio dispositivo, lo convierte en etiquetas y las cruza con los titulos y los datos del catalogo. Sin red, sin claves y sin enviar nada a ningun sitio.',
  requiresNetwork: false,
  enabled: true,
  recommend: recommendForStory,
};

/** Motor activo hoy. La interfaz siempre llama aqui, no al motor concreto. */
export function getActiveStoryEngine(): StoryEngine {
  return localStoryEngine;
}
