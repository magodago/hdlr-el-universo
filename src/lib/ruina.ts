/**
 * MI RUINA: el motor del test de perfil de HDLR - El Universo.
 *
 * Cada respuesta mueve variables internas que no se ven durante el test.
 * Al final se normalizan a 0-100. Todo es aritmetica local y determinista:
 * las mismas respuestas dan siempre el mismo resultado. No hay azar, no hay
 * servidor y no se guarda nada.
 *
 * Las preguntas y las opciones son originales. No citan letras ni frases
 * protegidas de ninguna cancion.
 */

export const DISPLAY_DIMENSIONS = ['lealtad', 'caos', 'melancolia', 'energia', 'libertad'] as const;

export type DisplayDimension = (typeof DISPLAY_DIMENSIONS)[number];

/** Variables internas: las cinco que se muestran mas ruina y calle. */
export type Variable = DisplayDimension | 'ruina' | 'calle';

export type Weights = Partial<Record<Variable, number>>;

export interface RuinaOption {
  id: string;
  label: string;
  weights: Weights;
}

export interface RuinaQuestion {
  id: string;
  /** Tema que toca. No se muestra como etiqueta: es solo control interno. */
  theme: string;
  prompt: string;
  options: RuinaOption[];
}

const VARIABLES: Variable[] = ['ruina', 'calle', ...DISPLAY_DIMENSIONS];

export const QUESTIONS: RuinaQuestion[] = [
  {
    id: 'amistad',
    theme: 'amistad y lealtad',
    prompt: 'Un amigo se mete en un lío a las tres de la mañana.',
    options: [
      {
        id: 'a',
        label: 'Salgo sin preguntar. Ya hablaremos mañana.',
        weights: { lealtad: 3, calle: 2, energia: 1, ruina: 1 },
      },
      {
        id: 'b',
        label: 'Le pregunto qué pasa, pero voy igual.',
        weights: { lealtad: 2, calle: 1, libertad: 1, ruina: 1 },
      },
      {
        id: 'c',
        label: 'Le digo que él se ha metido. No es mi guerra.',
        weights: { libertad: 2, melancolia: 1, ruina: 2 },
      },
    ],
  },
  {
    id: 'noches',
    theme: 'las noches',
    prompt: 'La noche se estira. Son las cuatro y sigues despierto.',
    options: [
      {
        id: 'a',
        label: 'Aguanto hasta que apaguen las luces.',
        weights: { energia: 3, caos: 2, ruina: 1 },
      },
      {
        id: 'b',
        label: 'Me quedo mientras la conversación valga la pena.',
        weights: { melancolia: 2, energia: 1, libertad: 1, ruina: 1 },
      },
      {
        id: 'c',
        label: 'Me fui hace una hora. Mañana tengo cosas.',
        weights: { libertad: 2, calle: 1, ruina: 1 },
      },
    ],
  },
  {
    id: 'decisiones',
    theme: 'las decisiones',
    prompt: 'Te ofrecen dos trabajos: uno seguro y otro que no sabes cómo saldrá.',
    options: [
      {
        id: 'a',
        label: 'El seguro. La cabeza fría también es valentía.',
        weights: { calle: 2, melancolia: 1, energia: 1, ruina: 1 },
      },
      {
        id: 'b',
        label: 'El que no sé. Si sale mal, ya veré.',
        weights: { libertad: 3, caos: 2, ruina: 2 },
      },
      {
        id: 'c',
        label: 'Depende de quién me lo ofrezca.',
        weights: { lealtad: 2, libertad: 1, ruina: 1 },
      },
    ],
  },
  {
    id: 'perdidas',
    theme: 'las pérdidas',
    prompt: 'Alguien que estaba siempre ya no está.',
    options: [
      {
        id: 'a',
        label: 'Lo llevo conmigo y sigo andando.',
        weights: { melancolia: 2, lealtad: 2, energia: 1, ruina: 1 },
      },
      {
        id: 'b',
        label: 'Me paro. Hay que mirarlo de frente.',
        weights: { melancolia: 3, libertad: 1, ruina: 2 },
      },
      {
        id: 'c',
        label: 'De eso no hablo. Nunca.',
        weights: { melancolia: 3, calle: 1, caos: 1, ruina: 3 },
      },
    ],
  },
  {
    id: 'ambicion',
    theme: 'la ambición',
    prompt: 'Podrías tener mucho más si dejaras atrás lo de siempre.',
    options: [
      {
        id: 'a',
        label: 'Dejo lo que haga falta para llegar.',
        weights: { energia: 3, libertad: 2, ruina: 2 },
      },
      {
        id: 'b',
        label: 'Quiero más, pero no a cualquier precio.',
        weights: { energia: 2, lealtad: 2, ruina: 1 },
      },
      {
        id: 'c',
        label: 'Prefiero poco y mandar en mi tiempo.',
        weights: { libertad: 3, melancolia: 1, lealtad: 1, ruina: 1 },
      },
    ],
  },
  {
    id: 'caos',
    theme: 'el caos',
    prompt: 'Tu casa, tu cabeza y tu móvil. ¿Cómo va todo?',
    options: [
      {
        id: 'a',
        label: 'Un orden raro que solo entiendo yo.',
        weights: { caos: 2, calle: 1, energia: 1, ruina: 1 },
      },
      {
        id: 'b',
        label: 'Todo revuelto y me da igual.',
        weights: { caos: 3, libertad: 2, ruina: 2 },
      },
      {
        id: 'c',
        label: 'Controlado. El ruido me agobia.',
        weights: { caos: 0, melancolia: 1, calle: 1, ruina: 1 },
      },
    ],
  },
  {
    id: 'nostalgia',
    theme: 'la nostalgia',
    prompt: 'Vuelves al barrio donde creciste.',
    options: [
      {
        id: 'a',
        label: 'Me siento en el mismo sitio y pido lo de siempre.',
        weights: { melancolia: 3, lealtad: 2, ruina: 2 },
      },
      {
        id: 'b',
        label: 'Miro, me alegro y me voy.',
        weights: { melancolia: 1, libertad: 2, ruina: 1 },
      },
      {
        id: 'c',
        label: 'No vuelvo. Aquello ya no es lo mío.',
        weights: { libertad: 2, calle: 2, caos: 1, ruina: 2 },
      },
    ],
  },
  {
    id: 'supervivencia',
    theme: 'la supervivencia',
    prompt: 'Se te junta el mes: la pasta, el curro y la cabeza.',
    options: [
      {
        id: 'a',
        label: 'Aprieto los dientes y salgo de esta.',
        weights: { ruina: 2, energia: 3, calle: 2 },
      },
      {
        id: 'b',
        label: 'Pido ayuda. No siempre puedo solo.',
        weights: { ruina: 2, lealtad: 3, melancolia: 1 },
      },
      {
        id: 'c',
        label: 'Lo dejo todo un día y luego vuelvo.',
        weights: { ruina: 3, caos: 2, libertad: 2 },
      },
    ],
  },
];

export interface RuinaResult {
  /** Peso total de la ruina, 0 a 100. Es la cifra protagonista. */
  ruina: number;
  dims: Record<DisplayDimension, number>;
  /** Titular corto segun el peso. */
  verdict: string;
  verdictLine: string;
  /** Identificador estable para la tarjeta: mismas respuestas, mismo id. */
  id: string;
}

const VERDICTS: { max: number; title: string; line: string }[] = [
  {
    max: 19,
    title: 'Peso ligero',
    line: 'La llevas en el bolsillo y no te frena. Todavía.',
  },
  {
    max: 39,
    title: 'Peso justo',
    line: 'Sabes lo que pesa y aun así andas. Eso ya es algo.',
  },
  {
    max: 59,
    title: 'Peso real',
    line: 'Ni te aplasta ni te suelta. Convives con ella.',
  },
  {
    max: 79,
    title: 'Peso pesado',
    line: 'La notas cada mañana y cada mañana sales igual.',
  },
  {
    max: 100,
    title: 'Ruina pura',
    line: 'No la escondes. Es lo que eres y no pediste permiso.',
  },
];

function buildBounds(): Record<Variable, { min: number; max: number }> {
  const bounds = {} as Record<Variable, { min: number; max: number }>;
  for (const variable of VARIABLES) {
    let min = 0;
    let max = 0;
    for (const question of QUESTIONS) {
      let questionMin = Number.POSITIVE_INFINITY;
      let questionMax = Number.NEGATIVE_INFINITY;
      for (const option of question.options) {
        const value = option.weights[variable] ?? 0;
        if (value < questionMin) questionMin = value;
        if (value > questionMax) questionMax = value;
      }
      min += questionMin;
      max += questionMax;
    }
    bounds[variable] = { min, max };
  }
  return bounds;
}

const BOUNDS = buildBounds();

function normalise(raw: number, min: number, max: number): number {
  if (max <= min) return 0;
  const pct = ((raw - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function hashAnswers(answers: number[]): string {
  const base = answers.map((answer, index) => `${index}${answer}`).join('');
  let hash = 2166136261;
  for (let i = 0; i < base.length; i += 1) {
    hash ^= base.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(-6);
}

/**
 * Calcula el perfil a partir de las respuestas.
 * `answers[i]` es el indice de la opcion elegida en la pregunta `i`.
 */
export function computeRuina(answers: number[]): RuinaResult {
  const raw = {} as Record<Variable, number>;
  for (const variable of VARIABLES) raw[variable] = 0;

  QUESTIONS.forEach((question, index) => {
    const chosen = question.options[answers[index] ?? 0] ?? question.options[0];
    for (const variable of VARIABLES) {
      raw[variable] += chosen.weights[variable] ?? 0;
    }
  });

  const dims = {} as Record<DisplayDimension, number>;
  for (const dimension of DISPLAY_DIMENSIONS) {
    dims[dimension] = normalise(raw[dimension], BOUNDS[dimension].min, BOUNDS[dimension].max);
  }

  const ruina = normalise(raw.ruina, BOUNDS.ruina.min, BOUNDS.ruina.max);
  const verdict = VERDICTS.find((band) => ruina <= band.max) ?? VERDICTS[VERDICTS.length - 1];

  return {
    ruina,
    dims,
    verdict: verdict.title,
    verdictLine: verdict.line,
    id: `RUINA-${hashAnswers(answers)}`,
  };
}

/** Etiquetas legibles de las dimensiones mostradas. */
export const DIMENSION_LABELS: Record<DisplayDimension, string> = {
  lealtad: 'Lealtad',
  caos: 'Caos',
  melancolia: 'Melancolía',
  energia: 'Energía',
  libertad: 'Libertad',
};
