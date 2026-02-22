import type { StateSnapshot, Player } from '@heist/shared';

export class FogLayer {
  private offscreen: OffscreenCanvas | null = null;
  private offCtx: OffscreenCanvasRenderingContext2D | null = null;

  draw(
    ctx: CanvasRenderingContext2D,
    snapshot: StateSnapshot,
    localPlayerId: string | null,
    cameraX: number,
    cameraY: number,
    viewW: number,
    viewH: number,
  ): void {
    if (!localPlayerId) return;

    const localPlayer = snapshot.players.find((p) => p.id === localPlayerId);
    if (!localPlayer) return;

    // Ensure offscreen canvas matches viewport
    if (!this.offscreen || this.offscreen.width !== viewW || this.offscreen.height !== viewH) {
      this.offscreen = new OffscreenCanvas(viewW, viewH);
      this.offCtx = this.offscreen.getContext('2d')!;
    }

    const oc = this.offCtx!;

    // Fill with dark fog
    oc.clearRect(0, 0, viewW, viewH);
    oc.fillStyle = 'rgba(0, 0, 0, 0.75)';
    oc.fillRect(0, 0, viewW, viewH);

    // Cut out vision circles using destination-out
    oc.globalCompositeOperation = 'destination-out';

    // Gather teammates (including self)
    const teammates = snapshot.players.filter(
      (p) => p.team === localPlayer.team && !p.isJailed,
    );

    for (const mate of teammates) {
      const screenX = mate.position.x - cameraX;
      const screenY = mate.position.y - cameraY;
      const radius = mate.visionRadius;

      const gradient = oc.createRadialGradient(
        screenX, screenY, radius * 0.4,
        screenX, screenY, radius,
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      oc.fillStyle = gradient;
      oc.beginPath();
      oc.arc(screenX, screenY, radius, 0, Math.PI * 2);
      oc.fill();
    }

    oc.globalCompositeOperation = 'source-over';

    // Draw fog overlay onto main canvas (in screen space)
    ctx.drawImage(this.offscreen, 0, 0);
  }
}
