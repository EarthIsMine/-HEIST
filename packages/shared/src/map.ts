import type { Vec2, Storage, Jail } from './types';
import { COINS_PER_STORAGE } from './constants';

export const STORAGE_POSITIONS: Vec2[] = [
  { x: 200, y: 150 },
  { x: 800, y: 150 },
  { x: 900, y: 500 },
  { x: 800, y: 850 },
  { x: 200, y: 850 },
  { x: 100, y: 500 },
];

export function createStorages(): Storage[] {
  return STORAGE_POSITIONS.map((pos, i) => ({
    id: `storage_${i}`,
    position: pos,
    radius: 40,
    totalCoins: COINS_PER_STORAGE,
    remainingCoins: COINS_PER_STORAGE,
  }));
}

export const COP_SPAWNS: Vec2[] = [
  { x: 500, y: 400 },
  { x: 460, y: 430 },
  { x: 540, y: 430 },
];

export const THIEF_SPAWNS: Vec2[] = [
  { x: 100, y: 100 },
  { x: 900, y: 100 },
  { x: 500, y: 950 },
];

export const JAIL_CONFIG: Jail = {
  position: { x: 500, y: 500 },
  radius: 60,
  inmates: [],
};
