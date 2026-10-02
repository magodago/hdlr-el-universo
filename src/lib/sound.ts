/**
 * Capa de sonido opcional de HDLR - El Universo.
 *
 * Reglas:
 *  - Apagada por defecto. No suena nada hasta que la persona la enciende.
 *  - Nada de audio automatico: todo sale de un gesto explicito.
 *  - Sin ficheros externos y sin musica protegida: son tonos cortos
 *    sintetizados en el dispositivo con la Web Audio API.
 *  - La preferencia se recuerda en localStorage (no es una cookie).
 */

export type SoundCue = 'click' | 'transition' | 'result' | 'live';

const STORAGE_KEY = 'hdlr.sound.v1';

type Listener = (enabled: boolean) => void;

interface CueShape {
  type: OscillatorType;
  from: number;
  to: number;
  duration: number;
  gain: number;
  delay?: number;
}

/** Tonos cortos. Volumen bajo a proposito: acompaña, no protagoniza. */
const CUES: Record<SoundCue, CueShape[]> = {
  click: [{ type: 'triangle', from: 240, to: 190, duration: 0.07, gain: 0.045 }],
  transition: [
    { type: 'sine', from: 68, to: 210, duration: 0.8, gain: 0.06 },
    { type: 'triangle', from: 150, to: 54, duration: 0.95, gain: 0.032, delay: 0.04 },
  ],
  result: [
    { type: 'sine', from: 174, to: 174, duration: 0.55, gain: 0.05 },
    { type: 'sine', from: 261, to: 261, duration: 0.55, gain: 0.034, delay: 0.12 },
    { type: 'triangle', from: 87, to: 87, duration: 0.8, gain: 0.04, delay: 0.24 },
  ],
  live: [
    { type: 'square', from: 330, to: 330, duration: 0.05, gain: 0.026 },
    { type: 'square', from: 247, to: 247, duration: 0.05, gain: 0.026, delay: 0.13 },
    { type: 'square', from: 330, to: 330, duration: 0.05, gain: 0.026, delay: 0.26 },
  ],
};

class SoundManager {
  private enabled = false;
  private ctx: AudioContext | null = null;
  private listeners = new Set<Listener>();

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      this.enabled = window.localStorage.getItem(STORAGE_KEY) === 'on';
    } catch {
      this.enabled = false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Avisa cada vez que cambia el estado. Devuelve la funcion para cancelar. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.enabled);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off');
    } catch {
      /* almacenamiento no disponible: se ignora en silencio */
    }
    if (value) {
      this.ensureContext();
      this.play('click');
    }
    this.notify();
  }

  toggle(): boolean {
    const next = !this.enabled;
    this.setEnabled(next);
    return next;
  }

  /** Reproduce una senal. Si esta apagado no hace nada. */
  play(cue: SoundCue): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const shape of CUES[cue]) {
      const start = now + (shape.delay ?? 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = shape.type;
      osc.frequency.setValueAtTime(shape.from, start);
      if (shape.to !== shape.from) {
        osc.frequency.linearRampToValueAtTime(shape.to, start + shape.duration);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(shape.gain, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + shape.duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + shape.duration + 0.05);
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.enabled);
      } catch {
        /* un suscriptor roto no debe romper la interfaz */
      }
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    return this.ctx;
  }
}

export const soundManager = new SoundManager();
