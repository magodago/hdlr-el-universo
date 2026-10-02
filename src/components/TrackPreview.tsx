import { useEffect, useState } from 'react';
import previewsData from '../data/previews.json';
import { alternar, detenerSi, suscribir, type PreviewState } from '../lib/previewAudio';
import '../styles/preview.css';

interface EntradaPreview {
  url?: string;
  youtube?: string;
  fuente?: string;
}

const PREVIEWS = previewsData as unknown as Record<string, EntradaPreview>;

/** Hay fragmento para este corte: solo entonces se pinta el boton. */
export function tienePreview(titulo: string): boolean {
  const entrada = PREVIEWS[titulo];
  return Boolean(entrada?.youtube || entrada?.url);
}

interface TrackPreviewProps {
  /** Titulo del corte, tal cual figura en el catalogo. */
  titulo: string;
  /** Variante estrecha para listas densas. */
  compacto?: boolean;
}

const SIN_REPRODUCCION: PreviewState = { clave: null, sonando: false, progreso: 0 };

/**
 * Boton de escucha de 30 segundos con barra de progreso.
 *
 * Si el corte no tiene fragmento en previews.json no se pinta nada: nunca un
 * boton muerto. Al arrancar un corte, el reproductor unico para el anterior.
 */
export function TrackPreview({ titulo, compacto = false }: TrackPreviewProps) {
  const entrada = PREVIEWS[titulo] as EntradaPreview | undefined;
  const [estado, setEstado] = useState<PreviewState>(SIN_REPRODUCCION);

  useEffect(() => {
    const desuscribir = suscribir(setEstado);
    return () => {
      desuscribir();
      detenerSi(titulo);
    };
  }, [titulo]);

  if (!entrada?.url && !entrada?.youtube) return null;

  const activo = estado.clave === titulo;
  const sonando = activo && estado.sonando;
  const progreso = activo ? estado.progreso : 0;
  const segundos = Math.min(30, Math.round(progreso * 30));

  return (
    <div className={`tp${activo ? ' is-active' : ''}${compacto ? ' tp--compacto' : ''}`}>
      <button
        type="button"
        className="tp-btn"
        aria-pressed={sonando}
        aria-label={
          sonando
            ? `Pausar el fragmento de ${titulo}`
            : `Escuchar 30 segundos de ${titulo}, audio oficial`
        }
        onClick={() => alternar(titulo, entrada)}
      >
        {sonando ? (
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" fill="currentColor" />
            <rect x="14" y="5" width="4" height="14" fill="currentColor" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 5v14l12-7z" fill="currentColor" />
          </svg>
        )}
      </button>
      <span className="tp-bar" aria-hidden="true">
        <span className="tp-fill" style={{ transform: `scaleX(${progreso})` }} />
      </span>
      <span className="tp-time">{activo ? `${segundos}s / 30s` : '30 s'}</span>
    </div>
  );
}
