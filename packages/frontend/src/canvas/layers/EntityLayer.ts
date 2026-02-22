import type { StateSnapshot, Player } from '@heist/shared';
import { PLAYER_RADIUS } from '@heist/shared';
import { spriteManager, type SpriteKey } from '../SpriteManager';

const COP_COLOR = '#4a9eff';
const THIEF_COLOR = '#ff4757';
const SPRITE_SIZE = PLAYER_RADIUS * 3.5;
const LERP_SPEED = 15; // higher = snappier interpolation

interface LerpState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

export class EntityLayer {
  private lerpStates: Map<string, LerpState> = new Map();
  private lastFrameTime = 0;

  draw(ctx: CanvasRenderingContext2D, snapshot: StateSnapshot, localPlayerId: string | null): void {
    const now = performance.now();
    const dt = this.lastFrameTime ? (now - this.lastFrameTime) / 1000 : 0.016;
    this.lastFrameTime = now;

    for (const player of snapshot.players) {
      this.updateLerp(player, dt);
      this.drawPlayer(ctx, player, player.id === localPlayerId);
    }
  }

  private updateLerp(player: Player, dt: number): void {
    const state = this.lerpStates.get(player.id);
    if (!state) {
      this.lerpStates.set(player.id, {
        x: player.position.x,
        y: player.position.y,
        targetX: player.position.x,
        targetY: player.position.y,
      });
      return;
    }

    state.targetX = player.position.x;
    state.targetY = player.position.y;

    const t = Math.min(1, LERP_SPEED * dt);
    state.x += (state.targetX - state.x) * t;
    state.y += (state.targetY - state.y) * t;
  }

  private isMoving(id: string): boolean {
    const state = this.lerpStates.get(id);
    if (!state) return false;
    return Math.abs(state.targetX - state.x) > 0.5 || Math.abs(state.targetY - state.y) > 0.5;
  }

  private getSpriteKey(player: Player): SpriteKey {
    if (player.team === 'thief') {
      if (player.channeling === 'steal') return 'thief_drain';
      return 'thief_active';
    } else {
      return 'cop_active';
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: Player, isLocal: boolean): void {
    const state = this.lerpStates.get(player.id);
    const x = state ? state.x : player.position.x;
    const y = state ? state.y : player.position.y;
    const isCop = player.team === 'cop';
    const moving = this.isMoving(player.id);

    ctx.save();

    if (player.isStunned) {
      ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 150) * 0.2;
    }

    if (player.isJailed) {
      ctx.globalAlpha = 0.3;
    }

    const bounce = moving ? Math.sin(Date.now() / 100) * 4 : 0;
    const facingLeft = player.velocity.x < -0.1;

    const spriteKey = this.getSpriteKey(player);
    const sprite = spriteManager.get(spriteKey);

    if (sprite) {
      ctx.save();
      ctx.translate(x, y + bounce);
      if (facingLeft) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(sprite, -SPRITE_SIZE / 2, -SPRITE_SIZE / 2, SPRITE_SIZE, SPRITE_SIZE);
      ctx.restore();

      if (isLocal) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px system-ui';
        ctx.textAlign = 'center';
        const arrowBounce = Math.sin(Date.now() / 300) * 4;
        ctx.fillText('\u25BC', x, y - SPRITE_SIZE / 2 - 12 + arrowBounce);
      }
    } else {
      ctx.beginPath();
      ctx.arc(x, y + bounce, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isCop ? COP_COLOR : THIEF_COLOR;
      ctx.fill();
      ctx.strokeStyle = isLocal ? '#ffffff' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = isLocal ? 3 : 1.5;
      ctx.stroke();
    }

    if (player.channeling) {
      const pulse = 0.7 + Math.sin(Date.now() / 200) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = player.channeling === 'steal' ? '#ffd700' : '#00ff80';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(
        player.channeling === 'steal' ? 'STEALING...' : 'CHANNELING...',
        x,
        y + SPRITE_SIZE / 2 + 6,
      );
      ctx.globalAlpha = 1;
    }

    if (player.isStunned) {
      ctx.fillStyle = '#ffff00';
      ctx.font = '20px system-ui';
      ctx.textAlign = 'center';
      const starBounce = Math.sin(Date.now() / 200) * 5;
      ctx.fillText('*', x - 14, y - SPRITE_SIZE / 2 - 4 + starBounce);
      ctx.fillText('*', x + 14, y - SPRITE_SIZE / 2 - 4 - starBounce);
    }

    ctx.restore();

    ctx.fillStyle = '#e8e8e8';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(player.name, x, y - SPRITE_SIZE / 2 - 4);

    ctx.fillStyle = isCop ? COP_COLOR : THIEF_COLOR;
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(isCop ? 'COP' : 'THIEF', x, y + SPRITE_SIZE / 2 + 20);
  }
}
