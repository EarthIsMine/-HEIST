import type { Vec2, Storage, Jail, Obstacle } from './types';
import { COINS_PER_STORAGE } from './constants';

export const STORAGE_POSITIONS: Vec2[] = [
  { x: 480, y: 360 },
  { x: 1920, y: 360 },
  { x: 2160, y: 1200 },
  { x: 1920, y: 2040 },
  { x: 480, y: 2040 },
  { x: 240, y: 1200 },
];

export function createStorages(): Storage[] {
  return STORAGE_POSITIONS.map((pos, i) => ({
    id: `storage_${i}`,
    position: pos,
    radius: 70,
    totalCoins: COINS_PER_STORAGE,
    remainingCoins: COINS_PER_STORAGE,
  }));
}

export const COP_SPAWNS: Vec2[] = [
  { x: 1200, y: 1100 },
  { x: 1200, y: 1300 },
];

export const THIEF_SPAWNS: Vec2[] = [
  { x: 240, y: 240 },
  { x: 2160, y: 240 },
  { x: 2160, y: 2160 },
  { x: 240, y: 2160 },
];

export const JAIL_CONFIG: Jail = {
  position: { x: 1200, y: 1200 },
  radius: 100,
  inmates: [],
};

export const OBSTACLES: Obstacle[] = [
  // Walls around jail creating approach corridors
  { id: 'obs_0', position: { x: 1000, y: 900 }, width: 140, height: 20 },
  { id: 'obs_1', position: { x: 1260, y: 900 }, width: 140, height: 20 },
  { id: 'obs_2', position: { x: 1000, y: 1480 }, width: 140, height: 20 },
  { id: 'obs_3', position: { x: 1260, y: 1480 }, width: 140, height: 20 },
  // Vertical walls near jail
  { id: 'obs_4', position: { x: 900, y: 1000 }, width: 20, height: 140 },
  { id: 'obs_5', position: { x: 1480, y: 1000 }, width: 20, height: 140 },
  { id: 'obs_6', position: { x: 900, y: 1260 }, width: 20, height: 140 },
  { id: 'obs_7', position: { x: 1480, y: 1260 }, width: 20, height: 140 },
  // Cover near storages
  { id: 'obs_8', position: { x: 600, y: 500 }, width: 120, height: 20 },
  { id: 'obs_9', position: { x: 1700, y: 500 }, width: 120, height: 20 },
  { id: 'obs_10', position: { x: 600, y: 1900 }, width: 120, height: 20 },
  { id: 'obs_11', position: { x: 1700, y: 1900 }, width: 120, height: 20 },
  // Mid-map barriers
  { id: 'obs_12', position: { x: 400, y: 800 }, width: 20, height: 200 },
  { id: 'obs_13', position: { x: 1980, y: 800 }, width: 20, height: 200 },
  { id: 'obs_14', position: { x: 400, y: 1400 }, width: 20, height: 200 },
  { id: 'obs_15', position: { x: 1980, y: 1400 }, width: 20, height: 200 },
];
