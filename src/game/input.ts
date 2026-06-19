import type { InputState } from './types';

export function createInput(): {
  state: InputState;
  onKeyDown: (e: KeyboardEvent) => void;
  onKeyUp: (e: KeyboardEvent) => void;
  reset: () => void;
} {
  const state: InputState = {
    turnLeft: false,
    turnRight: false,
    thrust: false,
  };

  const map: Record<string, keyof InputState> = {
    ArrowLeft: 'turnLeft',
    KeyA: 'turnLeft',
    ArrowRight: 'turnRight',
    KeyD: 'turnRight',
    ArrowUp: 'thrust',
    KeyW: 'thrust',
    Space: 'thrust',
  };

  function onKeyDown(e: KeyboardEvent): void {
    const k = map[e.code];
    if (k) {
      state[k] = true;
      e.preventDefault();
    }
  }

  function onKeyUp(e: KeyboardEvent): void {
    const k = map[e.code];
    if (k) {
      state[k] = false;
      e.preventDefault();
    }
  }

  function reset(): void {
    state.turnLeft = false;
    state.turnRight = false;
    state.thrust = false;
  }

  return { state, onKeyDown, onKeyUp, reset };
}
