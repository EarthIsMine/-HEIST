import type { StateSnapshot, PlayerId, Player } from '@heist/shared';
import { PLAYER_RADIUS } from '@heist/shared';

const COP_COLOR = '#4a9eff';
const COP_LIGHT = '#7bb8ff';
const THIEF_COLOR = '#ff4757';
const THIEF_LIGHT = '#ff6b7a';

export class EntityLayer {
  draw(ctx: CanvasRenderingContext2D, snapshot: StateSnapshot, localPlayerId: string | null): void {
    for (const player of snapshot.players) {
      this.drawPlayer(ctx, player, player.id === localPlayerId);
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: Player, isLocal: boolean): void {
    const { x, y } = player.position;
    const isCop = player.team === 'cop';
    const baseColor = isCop ? COP_COLOR : THIEF_COLOR;
    const lightColor = isCop ? COP_LIGHT : THIEF_LIGHT;

    ctx.save();

    // Stunned: pulsing opacity
    if (player.isStunned) {
      ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 150) * 0.2;
    }

    // Jailed: dimmed
    if (player.isJailed) {
      ctx.globalAlpha = 0.3;
    }

    // Player circle
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = isLocal ? lightColor : baseColor;
    ctx.fill();

    // Border
    ctx.strokeStyle = isLocal ? '#ffffff' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = isLocal ? 3 : 1.5;
    ctx.stroke();

    // Channeling indicator
    if (player.channeling) {
      const pulse = 1 + Math.sin(Date.now() / 200) * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, PLAYER_RADIUS + 6 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle =
        player.channeling === 'steal'
          ? 'rgba(255, 215, 0, 0.6)'
          : 'rgba(0, 255, 128, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Stunned stars
    if (player.isStunned) {
      ctx.fillStyle = '#ffff00';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('*', x - 8, y - PLAYER_RADIUS - 5);
      ctx.fillText('*', x + 8, y - PLAYER_RADIUS - 5);
    }

    ctx.restore();

    // Name tag (always full opacity)
    ctx.fillStyle = '#e8e8e8';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(player.name, x, y - PLAYER_RADIUS - 4);

    // Role label
    ctx.fillStyle = isCop ? COP_COLOR : THIEF_COLOR;
    ctx.font = 'bold 9px system-ui';
    ctx.fillText(isCop ? 'COP' : 'THIEF', x, y + PLAYER_RADIUS + 12);
  }
}
