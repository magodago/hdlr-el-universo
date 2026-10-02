interface BadgeProps {
  kind: 'real' | 'demo' | 'aviso';
  className?: string;
}

const LABELS: Record<BadgeProps['kind'], { text: string; desc: string }> = {
  real: {
    text: 'REAL',
    desc: 'Dato verificado con fuente oficial o de tienda, citada al pie de la seccion.',
  },
  demo: {
    text: 'DEMO',
    desc: 'Dato no confirmado por la fuente oficial. Se muestra marcado para no hacerlo pasar por real.',
  },
  aviso: {
    text: 'AVISO',
    desc: 'Anotacion del proyecto sobre el estado de este contenido.',
  },
};

/**
 * Etiqueta de trazabilidad. Todo dato que no venga de una fuente oficial va marcado
 * con DEMO. La etiqueta es visible, con texto, no solo color: tiene que leerse.
 */
export function Badge({ kind, className = '' }: BadgeProps) {
  const { text, desc } = LABELS[kind];
  const palette =
    kind === 'demo'
      ? 'border-blood-bright/70 text-blood-ink'
      : kind === 'aviso'
        ? 'border-smoke/50 text-smoke'
        : 'border-bone/30 text-smoke';

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 border px-2 py-[3px] align-middle font-body text-[10px] font-semibold tracking-[0.2em] uppercase ${palette} ${className}`}
      title={desc}
    >
      {text}
    </span>
  );
}
