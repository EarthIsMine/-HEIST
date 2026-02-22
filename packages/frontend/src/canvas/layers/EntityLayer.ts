import type { StateSnapshot, Player } from '@heist/shared';
import { PLAYER_RADIUS } from '@heist/shared';
import { spriteManager, type SpriteKey } from '../SpriteManager';

const COP_COLOR = '#4a9eff';
const THIEF_COLOR = '#ff4757';
const SPRITE_SIZE = PLAYER_RADIUS * 3.5;

export class EntityLayer {
  private prevPositions: Map<string, { x: number; y: number }> = new Map();

  draw(ctx: CanvasRenderingContext2D, snapshot: StateSnapshot, localPlayerId: string | null): void {
    for (const player of snapshot.players) {
      this.drawPlayer(ctx, player, player.id === localPlayerId);
    }
  }

  private isMoving(player: Player): boolean {
    const prev = this.prevPositions.get(player.id);
    const moving =
      prev !== undefined &&
      (Math.abs(player.position.x - prev.x) > 0.5 ||
        Math.abs(player.position.y - prev.y) > 0.5);
    this.prevPositions.set(player.id, { x: player.position.x, y: player.position.y });
    return moving;
  }

  private getSpriteKey(player: Player, moving: boolean): SpriteKey {
    if (player.team === 'thief') {
      if (player.channeling === 'steal') return 'thief_drain';
      if (moving) return 'thief_move';
      return 'thief_active';
    } else {
      if (moving) return 'cop_move';
      return 'cop_active';
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: Player, isLocal: boolean): void {
    const { x, y } = player.position;
    const isCop = player.team === 'cop';
    const moving = this.isMoving(player);

    ctx.save();

    if (player.isStunned) {
      ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 150) * 0.2;
    }

    if (player.isJailed) {
      ctx.globalAlpha = 0.3;
    }

    const bounce = moving ? Math.sin(Date.now() / 100) * 4 : 0;
    const facingLeft = player.velocity.x < -0.1;

    const spriteKey = this.getSpriteKey(player, moving);
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
