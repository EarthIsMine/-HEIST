import type { Player, Phase } from '@heist/shared';
import { MAP_WIDTH, MAP_HEIGHT, PLAYER_RADIUS, PLAYER_SPEED } from '@heist/shared';

export function updatePlayerMovement(player: Player, dt: number, phase: Phase): void {
  if (player.isJailed) return;
  if (player.isStunned) return;
  if (player.channeling) return;

  // During head_start, cops can't move
  if (phase === 'head_start' && player.team === 'cop') return;

  const dir = player.velocity;
  if (dir.x === 0 && dir.y === 0) return;

  // Normalize
  const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
  if (len === 0) return;

  const nx = dir.x / len;
  const ny = dir.y / len;

  player.position.x += nx * PLAYER_SPEED * dt;
  player.position.y += ny * PLAYER_SPEED * dt;

  // Clamp to map bounds
  player.position.x = Math.max(
    PLAYER_RADIUS,
    Math.min(MAP_WIDTH - PLAYER_RADIUS, player.position.x),
  );
  player.position.y = Math.max(
    PLAYER_RADIUS,
    Math.min(MAP_HEIGHT - PLAYER_RADIUS, player.position.y),
  );
}

export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
