import { useEffect, useState } from 'react';
import { soundManager } from './sound';

/**
 * Interruptor visible de sonido. Arranca apagado. El usuario lo enciende
 * cuando quiere: ninguna experiencia suena por su cuenta.
 */
export function SoundToggle() {
  const [enabled, setEnabled] = useState(() => soundManager.isEnabled());

  useEffect(() => soundManager.subscribe(setEnabled), []);

  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={enabled}
      onClick={() => soundManager.toggle()}
    >
      <span className="sound-toggle-dot" aria-hidden="true" />
      <span>Sonido</span>
      <span className="sound-toggle-state">{enabled ? 'On' : 'Off'}</span>
    </button>
  );
}
