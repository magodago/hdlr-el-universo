interface BadgeProps {
  kind: 'real' | 'demo' | 'aviso';
  className?: string;
}

/**
 * Cada etiqueta lleva su significado pegado al lado. En movil no hay tooltip
 * ni hover, asi que el texto tiene que explicarse solo, sin depender del color.
 */
const LABELS: Record<BadgeProps['kind'], { text: string; short: string; desc: string }> = {
  real: {
    text: 'REAL',
    short: 'fuente oficial',
    desc: 'Dato verificado con fuente oficial o de tienda, citada al pie de la seccion.',
  },
  demo: {
    text: 'DEMO',
    short: 'sin confirmar',
    desc: 'Dato no confirmado por la fuente oficial. Se muestra marcado para no hacerlo pasar por real.',
  },
  aviso: {
    text: 'AVISO',
    short: 'nota del proyecto',
    desc: 'Anotacion del proyecto sobre el estado de este contenido.',
  },
};

/**
 * Etiqueta de trazabilidad. Todo dato que no venga de una fuente oficial va marcado
 * con DEMO. La etiqueta es visible, con texto, no solo color: tiene que leerse.
 */
export function Badge({ kind, className = '' }: BadgeProps) {
  const { text, short, desc } = LABELS[kind];
  const palette =
    kind === 'demo'
      ? 'border-blood-bright/70 text-blood-ink'
      : kind === 'aviso'
        ? 'border-smoke/50 text-smoke'
        : 'border-bone/30 text-smoke';

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 border px-2 py-[3px] align-middle font-body text-[10px] font-semibold tracking-[0.18em] uppercase ${palette} ${className}`}
      title={desc}
    >
      <span>{text}</span>
      <span aria-hidden="true" className="text-ash">
        ·
      </span>
      <span className="font-normal tracking-[0.1em] normal-case">{short}</span>
    </span>
  );
}
