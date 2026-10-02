import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Marquee } from '../components/Marquee';
import { Link, ROUTES } from '../lib/router';
import { trackEvent } from '../lib/trackEvent';
import { soundManager } from '../lib/sound';
import logoHdlr from '../assets/logo/logo-hdlr.png';
import '../styles/logo.css';

/**
 * Experiencia 01. Entrada.
 *
 * Dos estados, nada mas: la puerta (pantalla negra, sin menu y sin tarjetas,
 * con el texto apareciendo poco a poco) y el interior (una antesala sobria que
 * invita a explorar). Al pulsar ENTRAR no hay un cambio de pantalla seco: hay
 * una transicion de camara de poco mas de un segundo.
 */

/** Cuando aparece cada bloque de la puerta, en milisegundos. */
const GATE_STEPS = [250, 1350, 2500, 3650];

/** Duracion de la transicion de entrada. Por debajo de 1,5 s. */
const TRANSITION_MS = 1200;

const MARQUEE_ITEMS = [
  'Hijos de la Ruina',
  'Natos',
  'Waor',
  'Recycled J',
  'Vol. 4',
  'Ruina',
  'Madrid',
  'Barrio',
];

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

interface GateProps {
  step: number;
  onSkip: () => void;
  onEnter: () => void;
}

function Gate({ step, onSkip, onEnter }: GateProps) {
  return (
    <section className="cine-gate" aria-label="Entrada a HDLR, El Universo">
      <div className="cine-glow" aria-hidden="true" />
      <div className="cine-grain" aria-hidden="true" />

      <div className="cine-gate-stack">
        <img
          src={logoHdlr}
          alt="Emblema de Hijos de la Ruina"
          className="logo-hdlr gate-logo"
        />
        <h1 className={`cine-line cine-hdlr${step >= 0 ? ' is-on' : ''}`}>HDLR</h1>
        <p className={`cine-line cine-sub${step >= 1 ? ' is-on' : ''}`}>El Universo</p>
        <p className={`cine-line cine-phrase${step >= 2 ? ' is-on' : ''}`}>
          Todos tenemos una <em>ruina</em> dentro.
        </p>
        <div className={`cine-line cine-close${step >= 3 ? ' is-on' : ''}`}>
          <p className="cine-question">¿Cuánto pesa la tuya?</p>
          <button
            type="button"
            className="cine-enter"
            onClick={(event) => {
              event.stopPropagation();
              onEnter();
            }}
          >
            <span>Entrar</span>
            <svg
              className="cine-enter-arrow"
              width="22"
              height="12"
              viewBox="0 0 22 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 6h18M13.6 1.2 19 6l-5.4 4.8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="square"
              />
            </svg>
          </button>
          <p className="cine-fine">Natos, Waor y Recycled J · 2012—2026</p>
        </div>
      </div>

      {step < 3 ? (
        <button type="button" className="cine-skip" onClick={onSkip} aria-label="Saltar la introducción">
          <span className="cine-hint">Toca la pantalla</span>
        </button>
      ) : null}
    </section>
  );
}

/** Transicion de entrada: grano, desenfoque, escala, barrido e interferencia. */
function TransitionOverlay() {
  return (
    <div className="cine-transition" aria-hidden="true">
      <div className="cine-wipe" />
      <div className="cine-scan" />
      <div className="cine-grain-pulse" />
      <div className="cine-flash" />
      <span className="cine-tag">HDLR</span>
    </div>
  );
}

export function Entrada() {
  const reduced = useRef(prefersReducedMotion()).current;
  const [step, setStep] = useState(reduced ? 3 : 0);
  const [entered, setEntered] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Secuencia de la puerta, con pausas. Se puede saltar tocando la pantalla.
  useEffect(() => {
    if (entered || reduced) return;
    const timers = GATE_STEPS.map((time, index) =>
      window.setTimeout(() => setStep((current) => Math.max(current, index)), time),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [entered, reduced]);

  // Mientras la puerta esta arriba, no se puede hacer scroll por detras y la
  // cabecera y el pie no existen: la entrada es solo la entrada.
  useEffect(() => {
    if (entered) {
      document.body.classList.remove('gate-open');
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('gate-open');
    return () => {
      document.body.style.overflow = previous;
      document.body.classList.remove('gate-open');
    };
  }, [entered]);

  useEffect(() => {
    if (entered) titleRef.current?.focus({ preventScroll: true });
  }, [entered]);

  const enter = useCallback(() => {
    soundManager.play('transition');
    trackEvent('gate_enter', { path: ROUTES.entrada });
    setEntered(true);
    if (reduced) return;
    setOverlay(true);
    window.setTimeout(() => setOverlay(false), TRANSITION_MS);
  }, [reduced]);

  if (!entered) {
    return createPortal(
      <Gate step={step} onSkip={() => setStep(3)} onEnter={enter} />,
      document.body,
    );
  }

  return (
    <>
      {overlay ? createPortal(<TransitionOverlay />, document.body) : null}

      <section className="interior" aria-labelledby="entrada-titulo">
        <div className="tech-grid absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="interior-glow" aria-hidden="true" />
        <img src={logoHdlr} alt="" aria-hidden="true" className="interior-watermark" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-3.25rem)] w-full max-w-[1080px] flex-col justify-center px-5 py-24 sm:px-8">
          <img
            src={logoHdlr}
            alt=""
            aria-hidden="true"
            className="logo-hdlr interior-logo"
          />
          <p className="interior-kicker">El universo de Hijos de la Ruina</p>
          <h1
            id="entrada-titulo"
            ref={titleRef}
            tabIndex={-1}
            className="interior-word focus-flat rise mt-4"
          >
            HDLR
          </h1>
          <p className="interior-line rise mt-6">Ya estás dentro. Aquí no hay prisa.</p>
          <p className="interior-sub fade-in mt-4">
            Empieza por lo tuyo o abre cualquiera de las puertas que tienes arriba.
          </p>

          <div className="fade-in mt-10 flex flex-wrap gap-3">
            <Link
              to={ROUTES.perfil}
              className="interior-cta"
              onClick={() => {
                soundManager.play('click');
                trackEvent('cta_click', { id: 'entrada_a_perfil', to: ROUTES.perfil });
              }}
            >
              <span className="interior-cta-num">01</span>
              <span className="interior-cta-label">Tu ruina</span>
              <svg
                className="interior-cta-arrow"
                width="22"
                height="12"
                viewBox="0 0 22 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 6h18M13.6 1.2 19 6l-5.4 4.8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="square"
                />
              </svg>
            </Link>

            <Link
              to={ROUTES.cancion}
              className="interior-cta"
              onClick={() => {
                soundManager.play('click');
                trackEvent('cta_click', { id: 'entrada_a_catalogo', to: ROUTES.cancion });
              }}
            >
              <span className="interior-cta-num">04</span>
              <span className="interior-cta-label">Los 39 cortes</span>
            </Link>
          </div>

          <p className="interior-fine">Hijos de la Ruina es un proyecto de Natos, Waor y Recycled J. El interruptor Sonido, arriba a la derecha, pone «Hijos de la ruina»: el fragmento oficial del Vol. 1.</p>
        </div>

        <Marquee items={MARQUEE_ITEMS} className="relative z-10" />
      </section>
    </>
  );
}
