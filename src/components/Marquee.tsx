interface MarqueeProps {
  items: string[];
  className?: string;
}

/** Cinta continua. Solo transform/opacity, sin coste de layout. */
export function Marquee({ items, className = '' }: MarqueeProps) {
  const doubled = [...items, ...items];
  return (
    <div className={`overflow-hidden border-y border-steel py-3 ${className}`} aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center gap-6 pr-6 font-display text-sm tracking-[0.28em] text-ash uppercase sm:text-base"
          >
            {item}
            <span className="text-blood-ink">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}
