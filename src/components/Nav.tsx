import { useEffect, useState } from 'react';
import { Link, ROUTES } from '../lib/router';
import { trackEvent } from '../lib/trackEvent';
import logoNav from '../assets/logo/logo-hdlr-128.png';

/**
 * Cabecera minima. No es un panel de control: es una lista corta de puertas.
 * HDLR arriba y, debajo, cuatro accesos numerados. El resto del universo
 * aparece mas adelante.
 */
const NAV_ITEMS = [
  { n: '01', label: 'Tu ruina', to: ROUTES.perfil },
  { n: '02', label: 'Tu historia', to: ROUTES.cancion },
  { n: '03', label: 'La ruina', to: ROUTES.mapa },
  { n: '04', label: 'Live', to: ROUTES.live },
];

/** Barra de progreso de lectura, atada al scroll. */
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(1, doc.scrollTop / max) : 0);
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
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

  return (
    <div className="fixed top-0 left-0 z-[70] h-[2px] w-full bg-transparent" aria-hidden="true">
      <div className="h-full origin-left bg-blood-bright" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

interface NavProps {
  path: string;
}

export function Nav({ path }: NavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <ScrollProgress />
      <header
        className={`fixed inset-x-0 top-0 z-[60] transition-colors duration-500 ${
          scrolled
            ? 'border-b border-steel/80 bg-void/88 backdrop-blur-md'
            : 'border-b border-transparent'
        }`}
      >
        <nav aria-label="Navegación principal" className="mx-auto max-w-[1400px] px-4 py-2 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              to={ROUTES.entrada}
              className="nav-brand group inline-flex min-h-[44px] items-center gap-2"
              onClick={() => trackEvent('nav_click', { from: path, to: ROUTES.entrada })}
            >
              <img src={logoNav} alt="" aria-hidden="true" className="logo-hdlr nav-logo" />
              <span className="font-display text-xl leading-none tracking-[0.06em] text-bone sm:text-2xl">
                HDLR
              </span>
              <span className="hidden font-body text-[10px] font-semibold tracking-[0.34em] text-ash uppercase sm:inline">
                El Universo
              </span>
            </Link>

            <span className="hidden font-body text-[10px] font-semibold tracking-[0.3em] text-ash uppercase sm:block">
              Explora
            </span>
          </div>

          <ul className="nav-row mt-0.5 flex items-center gap-2.5 overflow-x-auto pb-1 sm:gap-6">
            {NAV_ITEMS.map((item) => {
              const active = path === item.to;
              return (
                <li key={item.to} className="shrink-0">
                  <Link
                    to={item.to}
                    data-active={active}
                    aria-current={active ? 'page' : undefined}
                    className="nav-link inline-flex min-h-[44px] items-center font-body text-[11px] font-semibold tracking-[0.1em] uppercase sm:text-xs sm:tracking-[0.24em]"
                    onClick={() => {
                      trackEvent('nav_click', { from: path, to: item.to });
                    }}
                  >
                    <span className="nav-inner">
                      <span className="nav-num">{item.n}</span>
                      <span className="nav-label ml-1.5">{item.label}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
    </>
  );
}
