import { useCallback, useEffect, useState } from 'react';
import type { AnchorHTMLAttributes, MouseEvent } from 'react';

/**
 * Router minimo basado en hash.
 *
 * Se usa hash y no history API a proposito: GitHub Pages sirve el sitio desde una
 * subruta y no reescribe rutas. Con hash, cualquier vista se puede compartir y
 * recargar sin 404.
 */

export const ROUTES = {
  entrada: '/',
  perfil: '/perfil',
  mapa: '/mapa',
  cancion: '/cancion',
  archivo: '/archivo',
  live: '/live',
  noche: '/noche',
  comunidad: '/comunidad',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

function readHash(): string {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw || raw === '/') return '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export function useRoute(): string {
  const [path, setPath] = useState<string>(() =>
    typeof window === 'undefined' ? '/' : readHash(),
  );

  useEffect(() => {
    const onChange = () => setPath(readHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return path;
}

export function navigate(path: string, opts: { replace?: boolean } = {}): void {
  const target = `#${path.startsWith('/') ? path : `/${path}`}`;
  if (opts.replace) {
    window.location.replace(target);
  } else if (window.location.hash !== target) {
    window.location.hash = target;
  }
}

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  onNavigate?: () => void;
}

/** Enlace interno accesible. Se comporta como un <a> normal (se puede abrir en pestaña nueva). */
export function Link({ to, onNavigate, children, ...rest }: LinkProps) {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      navigate(to);
      onNavigate?.();
    },
    [to, onNavigate],
  );

  return (
    <a href={`#${to}`} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

/** Vuelve arriba al cambiar de experiencia, como en un cambio de escena. */
export function useScrollReset(path: string): void {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [path]);
}
