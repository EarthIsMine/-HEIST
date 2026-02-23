import { getSocket } from '../net/socket';
import { useGameStore } from '../stores/useGameStore';
import { TICK_MS, STEAL_RANGE, BREAK_JAIL_RANGE, ARREST_RANGE } from '@heist/shared';
import type { Player, Storage } from '@heist/shared';

const keys = new Set<string>();
let inputInterval: number | null = null;

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function handleSpaceSkill(): void {
  const { snapshot, localPlayerId, myTeam } = useGameStore.getState();
  if (!snapshot || !localPlayerId) return;

  const me = snapshot.players.find((p) => p.id === localPlayerId);
  if (!me || me.isJailed || me.isStunned) return;

  const socket = getSocket();

  // If already channeling, cancel
  if (me.channeling) {
    socket.emit('cancel_skill');
    return;
  }

  if (myTeam === 'thief') {
    // Try steal from nearest storage in range
    let nearStorage: Storage | null = null;
    let minDist = Infinity;
    for (const s of snapshot.storages) {
      if (s.remainingCoins <= 0) continue;
      const d = dist(me.position, s.position);
      if (d < minDist) { minDist = d; nearStorage = s; }
    }
    if (nearStorage && minDist <= STEAL_RANGE + nearStorage.radius) {
      socket.emit('request_steal', nearStorage.id);
      return;
    }

    // Try break jail if near jail with inmates
    const jailDist = dist(me.position, snapshot.jail.position);
    if (jailDist <= BREAK_JAIL_RANGE + snapshot.jail.radius && snapshot.jail.inmates.length > 0) {
      socket.emit('request_break_jail');
      return;
    }
  } else if (myTeam === 'cop') {
    // Try arrest nearest thief in range
    let nearThief: Player | null = null;
    let minDist = Infinity;
    for (const p of snapshot.players) {
      if (p.team !== 'thief' || p.isJailed || p.id === me.id) continue;
      const d = dist(me.position, p.position);
      if (d < minDist) { minDist = d; nearThief = p; }
    }
    if (nearThief && minDist <= ARREST_RANGE) {
      socket.emit('request_arrest', nearThief.id);
    }
  }
}

function handleDisguise(): void {
  const { snapshot, localPlayerId, myTeam } = useGameStore.getState();
  if (!snapshot || !localPlayerId || myTeam !== 'thief') return;
  const me = snapshot.players.find((p) => p.id === localPlayerId);
  if (!me || me.isJailed || me.isStunned || me.channeling || me.isDisguised) return;
  getSocket().emit('request_disguise');
}

function handleBuildWall(): void {
  const { snapshot, localPlayerId, myTeam } = useGameStore.getState();
  if (!snapshot || !localPlayerId || myTeam !== 'thief') return;
  const me = snapshot.players.find((p) => p.id === localPlayerId);
  if (!me || me.isJailed || me.isStunned || me.channeling) return;
  getSocket().emit('request_build_wall');
}

function startInputLoop(): void {
  if (inputInterval) return;
  inputInterval = window.setInterval(() => {
    let x = 0;
    let y = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y = -1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y = 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x = -1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x = 1;

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
  const moveKeyCodes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  const onDown = (e: KeyboardEvent) => {
    const code = e.code;
    if (code === 'Space') {
      e.preventDefault();
      handleSpaceSkill();
      return;
    }
    if (code === 'KeyQ') {
      e.preventDefault();
      handleDisguise();
      return;
    }
    if (code === 'KeyE') {
      e.preventDefault();
      handleBuildWall();
      return;
    }
    if (moveKeyCodes.includes(code)) {
      e.preventDefault();
      keys.add(code);
      startInputLoop();
    }
  };

  const onUp = (e: KeyboardEvent) => {
    const code = e.code;
    keys.delete(code);
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
