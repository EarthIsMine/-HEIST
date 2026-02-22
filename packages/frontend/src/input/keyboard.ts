import { getSocket } from '../net/socket';
import { TICK_MS } from '@heist/shared';

const keys = new Set<string>();
let inputInterval: number | null = null;

function startInputLoop(): void {
  if (inputInterval) return;
  inputInterval = window.setInterval(() => {
    let x = 0;
    let y = 0;
    if (keys.has('w') || keys.has('arrowup')) y = -1;
    if (keys.has('s') || keys.has('arrowdown')) y = 1;
    if (keys.has('a') || keys.has('arrowleft')) x = -1;
    if (keys.has('d') || keys.has('arrowright')) x = 1;

    getSocket().emit('input_move', { x, y });
  }, TICK_MS);
}

function stopInputLoop(): void {
  if (inputInterval) {
    clearInterval(inputInterval);
    inputInterval = null;
    getSocket().emit('input_move', { x: 0, y: 0 });
  }
}

export function initKeyboard(): () => void {
  const validKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

  const onDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (validKeys.includes(key)) {
      e.preventDefault();
      keys.add(key);
      startInputLoop();
    }
  };

  const onUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    keys.delete(key);
    if (keys.size === 0) stopInputLoop();
  };

  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);

  return () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    stopInputLoop();
  };
}
