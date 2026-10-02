import type { ReactNode } from 'react';

interface SectionHeadingProps {
  index: string;
  title: string;
  lead?: ReactNode;
  aside?: ReactNode;
}

/** Titular de seccion con numero, regla que se dibuja y entradilla. */
export function SectionHeading({ index, title, lead, aside }: SectionHeadingProps) {
  return (
    <header className="reveal">
      <div className="flex items-center gap-4">
        <span className="font-display text-xs tracking-[0.3em] text-blood-ink">{index}</span>
        <span className="rule-draw h-px flex-1 bg-steel" />
        {aside}
      </div>
      <h2 className="mt-5 max-w-4xl font-display text-[clamp(2.2rem,6vw,5rem)] text-bone">
        {title}
      </h2>
      {lead ? (
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-smoke sm:text-lg">{lead}</p>
      ) : null}
    </header>
  );
}
