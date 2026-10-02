import { useEffect, useState } from 'react';
import { soundManager } from './sound';
import { entradaDisponible, arrancarEntrada, pararEntrada } from './entradaTrack';

/**
 * Interruptor visible de sonido. Arranca apagado. El usuario lo enciende
 * cuando quiere: ninguna experiencia suena por su cuenta.
 *
 * Al encenderlo suena "Hijos de la ruina" (fragmento oficial del Vol. 1,
 * cortesia de Deezer) de fondo, en bucle y a volumen bajo, ademas de los
 * tonos cortos de la interfaz. Al apagarlo, se para todo.
 */
export function SoundToggle() {
  const [enabled, setEnabled] = useState(() => soundManager.isEnabled());
  const [hayBanda, setHayBanda] = useState(false);

  useEffect(() => soundManager.subscribe(setEnabled), []);
  useEffect(() => setHayBanda(entradaDisponible()), []);

  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={enabled}
      title={hayBanda ? 'Suena «Hijos de la ruina» (fragmento oficial)' : 'Efectos de sonido'}
      onClick={() => {
        soundManager.toggle();
        if (soundManager.isEnabled()) arrancarEntrada();
        else pararEntrada();
      }}
    >
      <span className="sound-toggle-dot" aria-hidden="true" />
      <span>Sonido</span>
      <span className="sound-toggle-state">
        {enabled ? 'On' : 'Off'}
        {enabled && hayBanda ? ' · Hijos de la ruina' : ''}
      </span>
    </button>
  );
}
