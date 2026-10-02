import { useEffect } from 'react';

/**
 * Marca elementos con la clase `reveal` cuando entran en pantalla,
 * añadiendoles `is-in`. Si el navegador no soporta IntersectionObserver,
 * o el usuario pide movimiento reducido, todo se muestra directamente.
 */
export function useRevealOnScroll(): void {
  useEffect(() => {
    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((node) => node.classList.add('is-in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    nodes.forEach((node) => observer.observe(node));

    // Cualquier nodo que se añada despues (cambio de vista) se observa igualmente.
    const mutation = new MutationObserver(() => {
      document
        .querySelectorAll<HTMLElement>('.reveal:not(.is-in)')
        .forEach((node) => observer.observe(node));
    });
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, []);
}
