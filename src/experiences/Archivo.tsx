import { useEffect, useRef, useState } from 'react';
import { Badge } from '../components/Badge';
import { SectionHeading } from '../components/SectionHeading';
import { timeline } from '../data';
import { Link, ROUTES } from '../lib/router';
import { trackEvent } from '../lib/trackEvent';
import '../styles/archivo.css';

const TAG_LABEL: Record<string, string> = {
  origen: 'Origen',
  contexto: 'Contexto',
  hdlr: 'Hijos de la Ruina',
  hito: 'Hito',
};

function host(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/* ------------------------------------------------------------------ */
/* Vista                                                               */
/* ------------------------------------------------------------------ */

export function Archivo() {
  const events = timeline;
  const railRef = useRef<HTMLDivElement>(null);
  const [fill, setFill] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const firstYear = events[0]?.year ?? '';
  const lastYear = events[events.length - 1]?.year ?? '';
  const activeYear = events[activeIndex]?.year ?? firstYear;

  // Relleno de la espina: avanza segun lo que se ha recorrido de la cronologia.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const rail = railRef.current;
      if (!rail) return;
      const rect = rail.getBoundingClientRect();
      const marker = window.innerHeight * 0.45;
      const passed = marker - rect.top;
      setFill(rect.height > 0 ? Math.min(1, Math.max(0, passed / rect.height)) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Ano activo: el hito que cruza la banda central de la pantalla.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.ar-item'));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index') ?? '0');
            setActiveIndex(index);
          }
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {/* Portada */}
      <section className="relative overflow-hidden px-4 pt-24 pb-12 sm:px-8 sm:pt-32">
        <div className="tech-grid absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1400px]">
          <p className="rise font-body text-[11px] font-semibold tracking-[0.36em] text-blood-ink uppercase">
            05 · Archivo
          </p>
          <h1 className="rise mt-5 font-display text-[clamp(3rem,12vw,9rem)] leading-[0.84] text-bone [animation-delay:100ms]">
            LA HISTORIA,
            <br />
            HITO A HITO
          </h1>
          <p className="fade-in mt-8 max-w-2xl text-base leading-relaxed text-smoke sm:text-lg [animation-delay:320ms]">
            De las batallas de gallos de {firstYear} al cuarto volumen de {lastYear}. Baja despacio:
            cada hito lleva su fuente enlazada. Lo que no está documentado, no está aquí.
          </p>
          <div className="fade-in mt-8 flex flex-wrap items-center gap-3 [animation-delay:440ms]">
            <Badge kind="real" />
            <span className="font-body text-xs tracking-[0.16em] text-smoke uppercase">
              {events.length} hitos fechados · {firstYear} a {lastYear}
            </span>
          </div>
        </div>
      </section>

      {/* Recorrido */}
      <section className="border-t border-steel bg-ink px-4 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1100px]">
          <div className="ar-sticky">
            <span className="ar-sticky-label">Cronología</span>
            <span className="ar-sticky-track" aria-hidden="true">
              <span className="ar-sticky-thumb" style={{ width: `${fill * 100}%` }} />
            </span>
            <span className="ar-sticky-year" aria-live="polite">
              {activeYear}
            </span>
          </div>

          <div className="ar-rail" ref={railRef}>
            <div className="ar-spine" aria-hidden="true">
              <span className="ar-spine-fill" style={{ height: `${fill * 100}%` }} />
            </div>

            <ol>
              {events.map((event, index) => (
                <li
                  key={`${event.year}-${event.title}`}
                  className="ar-item reveal"
                  data-tag={event.tag}
                  data-active={index === activeIndex}
                  data-index={index}
                >
                  <span className="ar-node" aria-hidden="true" />
                  <time className="ar-year">{event.year}</time>
                  <p className="ar-when">{event.date ? `${event.date} de ${event.year}` : event.year}</p>
                  <h3 className="ar-title">{event.title}</h3>
                  <p className="ar-text">{event.text}</p>
                  <p className="ar-tag">{TAG_LABEL[event.tag] ?? event.tag}</p>
                  <a
                    href={event.source}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="ar-source link-sweep"
                    onClick={() => trackEvent('experience_open', { id: '05', via: 'fuente', year: event.year })}
                  >
                    Fuente: {host(event.source)}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1100px]">
          <SectionHeading
            index="Cómo está montado"
            title="Solo lo que se puede fechar"
            lead="Esta cronología se arma con lo que publican la web oficial y la prensa. Cada hito mantiene el enlace a su fuente para que se pueda comprobar sin salir del archivo."
          />
          <div className="mt-10 grid gap-px border border-steel bg-steel sm:grid-cols-3">
            {[
              { k: 'Sin relleno', v: 'Donde no hay dato, no se escribe nada. No hay fechas ni hechos inventados.' },
              { k: 'Con enlace', v: 'Cada hito enlaza a la fuente de la que sale, abierta en otra pestaña.' },
              { k: 'Con contexto', v: 'Los discos del dúo se marcan aparte de las entregas de la serie.' },
            ].map((item) => (
              <article key={item.k} className="reveal bg-carbon p-6">
                <h3 className="font-display text-base tracking-[0.06em] text-blood-ink uppercase">
                  {item.k}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-smoke">{item.v}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to={ROUTES.mapa}
              className="btn-outline btn-lg px-6 py-3.5"
              onClick={() => trackEvent('cta_click', { id: 'archivo_a_mapa' })}
            >
              <span className="font-display text-sm tracking-[0.24em] uppercase">03 Mapa</span>
              <span className="btn-arrow font-display text-sm leading-none" aria-hidden="true">
                →
              </span>
            </Link>
            <Link
              to={ROUTES.perfil}
              className="btn-outline btn-lg px-6 py-3.5"
              onClick={() => trackEvent('cta_click', { id: 'archivo_a_perfil' })}
            >
              <span className="font-display text-sm tracking-[0.24em] uppercase">02 Perfil</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
