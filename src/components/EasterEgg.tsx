import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Easter egg muy discreto.
 *
 * No se anuncia en ningun sitio. Se desbloquea con dos gestos secretos:
 *  - cinco toques seguidos en el logo HDLR de la cabecera,
 *  - una pulsacion larga sobre la marca HDLR del pie.
 *
 * Ademas, nunca salta en la primera pantalla: hace falta haber explorado
 * algo antes (haber pasado por mas de una experiencia o haber bajado a
 * fondo en una pagina larga). El desbloqueo no se recuerda entre visitas,
 * pero lo explorado si, para que no se dispare nada mas cargar.
 *
 * Al desbloquearse muestra un mensaje en orden, con calma, y se cierra.
 * No pide nada: ni entradas, ni regalos, ni respuestas, ni contacto.
 */

const EXPLORED_KEY = 'hdlr.ee.explored.v1';

const LINES = [
  'Esto lo hice por una persona.',
  'Mi hija lleva tiempo escuchándoos.',
  'Y pensé que, ya que sé construir cosas, podía construir algo para vosotros.',
  'David.',
];

function readRoute(): string {
  const raw = window.location.hash.replace(/^#/, '');
  return raw.startsWith('/') ? raw : '/';
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function EasterEgg() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const exploredRef = useRef(false);
  const routesRef = useRef<Set<string>>(new Set());
  const tapRef = useRef({ count: 0, last: 0 });
  const longRef = useRef<number | null>(null);
  const longStart = useRef<{ x: number; y: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /* --- Puerta de exploracion: nada en la primera pantalla ---------- */
  useEffect(() => {
    let stored = false;
    try {
      stored = localStorage.getItem(EXPLORED_KEY) === '1';
    } catch {
      stored = false;
    }
    if (stored) exploredRef.current = true;

    const markExplored = () => {
      if (exploredRef.current) return;
      exploredRef.current = true;
      try {
        localStorage.setItem(EXPLORED_KEY, '1');
      } catch {
        /* almacenamiento no disponible: se sigue en memoria */
      }
    };

    routesRef.current.add(readRoute());

    const onHashChange = () => {
      routesRef.current.add(readRoute());
      if (routesRef.current.size >= 2) markExplored();
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        if (max > 400 && doc.scrollTop / max > 0.5) markExplored();
      });
    };

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const unlock = useCallback(() => {
    if (!exploredRef.current) return;
    setStep(0);
    setOpen(true);
  }, []);

  /* --- Gestos secretos -------------------------------------------- */
  useEffect(() => {
    // Cinco toques seguidos en el logo HDLR de la cabecera.
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      const link = target.closest('header a');
      if (!link) return;
      const text = (link.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (!/^HDLR/i.test(text)) return;

      const now = Date.now();
      const state = tapRef.current;
      if (now - state.last > 700) state.count = 0;
      state.count += 1;
      state.last = now;
      if (state.count >= 5) {
        state.count = 0;
        unlock();
      }
    };

    const brandInFooter = (target: Element | null): boolean => {
      if (!target || !target.closest('footer')) return false;
      const node = target.closest('p, span, a, h2');
      if (!node) return false;
      return /hdlr/i.test(node.textContent ?? '');
    };

    const cancelLong = () => {
      if (longRef.current !== null) {
        window.clearTimeout(longRef.current);
        longRef.current = null;
      }
      longStart.current = null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!brandInFooter(event.target as Element | null)) return;
      longStart.current = { x: event.clientX, y: event.clientY };
      if (longRef.current !== null) window.clearTimeout(longRef.current);
      longRef.current = window.setTimeout(() => {
        longRef.current = null;
        longStart.current = null;
        unlock();
      }, 1100);
    };

    const onPointerMove = (event: PointerEvent) => {
      const start = longStart.current;
      if (!start) return;
      if (Math.abs(event.clientX - start.x) > 12 || Math.abs(event.clientY - start.y) > 12) {
        cancelLong();
      }
    };

    document.addEventListener('click', onDocClick, true);
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', cancelLong);
    window.addEventListener('pointercancel', cancelLong);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', cancelLong, { passive: true });

    return () => {
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', cancelLong);
      window.removeEventListener('pointercancel', cancelLong);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', cancelLong);
      cancelLong();
    };
  }, [unlock]);

  /* --- Secuencia de aparicion, con calma -------------------------- */
  useEffect(() => {
    if (!open) return;
    if (prefersReducedMotion()) {
      setStep(LINES.length);
      return;
    }
    setStep(1);
    const timers = LINES.slice(1).map((_, index) =>
      window.setTimeout(() => setStep(index + 2), (index + 1) * 1500),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [open]);

  /* --- Foco, teclado y bloqueo de scroll -------------------------- */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      // Dentro del aviso solo hay un control (Cerrar): el foco no se escapa.
      if (event.key === 'Tab') {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Dedicatoria"
      className="fixed inset-0 z-[95] overflow-y-auto overscroll-contain bg-void/95 px-6 py-12 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div className="pointer-events-none flex min-h-full items-center justify-center">
        <div className="pointer-events-auto relative w-full max-w-lg text-center">
          <span
            className="mx-auto block h-px w-16 bg-blood-bright"
            aria-hidden="true"
          />

          <p className="mt-8 font-display text-[clamp(1.8rem,8vw,3rem)] leading-[0.98] tracking-[0.01em] text-bone uppercase">
            {step >= 1 ? LINES[0] : '\u00a0'}
          </p>

          <div className="mt-7 space-y-5">
            {step >= 2 ? (
              <p className="fade-in text-base leading-relaxed text-smoke sm:text-lg">{LINES[1]}</p>
            ) : null}
            {step >= 3 ? (
              <p className="fade-in text-base leading-relaxed text-smoke sm:text-lg">{LINES[2]}</p>
            ) : null}
          </div>

          {step >= 4 ? (
            <p className="fade-in mt-9 font-display text-lg tracking-[0.3em] text-blood-ink uppercase">
              {LINES[3]}
            </p>
          ) : null}

          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            className="btn-outline mt-12 min-h-[48px] px-7 py-3 font-display text-xs tracking-[0.24em] uppercase"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
