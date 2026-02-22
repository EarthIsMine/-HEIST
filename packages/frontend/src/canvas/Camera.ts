import type { Vec2 } from '@heist/shared';
import { MAP_WIDTH, MAP_HEIGHT } from '@heist/shared';

export class Camera {
  x = 0;
  y = 0;
  private viewW: number;
  private viewH: number;
  private smoothing = 8;

  constructor(viewW: number, viewH: number) {
    this.viewW = viewW;
    this.viewH = viewH;
  }

  follow(target: Vec2, dt: number): void {
    const targetX = target.x - this.viewW / 2;
    const targetY = target.y - this.viewH / 2;

    this.x += (targetX - this.x) * this.smoothing * dt;
    this.y += (targetY - this.y) * this.smoothing * dt;

    this.x = Math.max(0, Math.min(MAP_WIDTH - this.viewW, this.x));
    this.y = Math.max(0, Math.min(MAP_HEIGHT - this.viewH, this.y));
  }

  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.translate(-this.x, -this.y);
  }
}
