/**
 * Capa de sonido opcional de HDLR - El Universo.
 *
 * Reglas:
 *  - Apagada por defecto. No suena nada hasta que la persona la enciende.
 *  - Nada de audio automatico: todo sale de un gesto explicito.
 *  - Sin ficheros externos y sin musica protegida: tonos cortos y una cama
 *    sonora sintetizados en el dispositivo con la Web Audio API. Al encender
 *    el interruptor, ademas, entra el fragmento oficial de «Hijos de la
 *    ruina» (Vol. 1, cortesia de Deezer) desde entradaTrack.
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
  /** Cama sonora de fondo: se enciende y se apaga con el interruptor. */
  private bedStop: (() => void) | null = null;

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
      this.startBed();
      this.play('click');
    } else {
      this.stopBed();
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

  /**
   * Cama sonora: sub grave con respiracion, quinta suave y lluvia filtrada.
   * Se sintetiza aqui mismo, asi que no depende de ningun fichero ni de
   * ninguna direccion que pueda caducar. Suena por debajo de la cancion.
   */
  private startBed(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.bedStop) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.045, now + 2.5);
    master.connect(ctx.destination);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 55;
    const subGain = ctx.createGain();
    subGain.gain.value = 1;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.16;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.45;
    lfo.connect(lfoGain).connect(subGain.gain);
    sub.connect(subGain).connect(master);

    const quinta = ctx.createOscillator();
    quinta.type = 'triangle';
    quinta.frequency.value = 82.5;
    const quintaGain = ctx.createGain();
    quintaGain.gain.value = 0.3;
    quinta.connect(quintaGain).connect(master);

    const samples = Math.floor(ctx.sampleRate * 4);
    const ruido = ctx.createBuffer(1, samples, ctx.sampleRate);
    const datos = ruido.getChannelData(0);
    for (let i = 0; i < samples; i += 1) datos[i] = (Math.random() * 2 - 1) * 0.35;
    const lluvia = ctx.createBufferSource();
    lluvia.buffer = ruido;
    lluvia.loop = true;
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 620;
    const lluviaGain = ctx.createGain();
    lluviaGain.gain.value = 0.2;
    lluvia.connect(filtro).connect(lluviaGain).connect(master);

    sub.start(now);
    quinta.start(now);
    lfo.start(now);
    lluvia.start(now);

    this.bedStop = () => {
      const t = ctx.currentTime;
      try {
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      } catch {
        /* si el contexto ya no acepta rampas, se corta directo */
      }
      window.setTimeout(() => {
        for (const nodo of [sub, quinta, lfo, lluvia]) {
          try {
            nodo.stop();
          } catch {
            /* ya estaba parado */
          }
        }
      }, 1400);
    };
  }

  private stopBed(): void {
    if (!this.bedStop) return;
    this.bedStop();
    this.bedStop = null;
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
