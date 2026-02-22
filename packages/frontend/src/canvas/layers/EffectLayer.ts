import type { StateSnapshot } from '@heist/shared';

export class EffectLayer {
  draw(ctx: CanvasRenderingContext2D, snapshot: StateSnapshot, now: number): void {
    // Draw channeling lines from player to target
    for (const player of snapshot.players) {
      if (!player.channeling || !player.channelingTarget) continue;

      let targetPos: { x: number; y: number } | null = null;

      if (player.channeling === 'steal') {
        const storage = snapshot.storages.find((s) => s.id === player.channelingTarget);
        if (storage) targetPos = storage.position;
      } else if (player.channeling === 'break_jail') {
        targetPos = snapshot.jail.position;
      }

      if (!targetPos) continue;

      // Animated dashed line
      const dashOffset = (now / 50) % 20;
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = -dashOffset;
      ctx.strokeStyle =
        player.channeling === 'steal'
          ? 'rgba(255, 215, 0, 0.5)'
          : 'rgba(0, 255, 128, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(player.position.x, player.position.y);
      ctx.lineTo(targetPos.x, targetPos.y);
      ctx.stroke();
      ctx.restore();
    }

    // Head start overlay
    if (snapshot.phase === 'head_start' && snapshot.headStartTimerMs > 0) {
      // This will be rendered in HUD instead for better UX
    }
  }
}
