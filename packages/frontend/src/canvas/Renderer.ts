import { Camera } from './Camera';
import { MapLayer } from './layers/MapLayer';
import { EntityLayer } from './layers/EntityLayer';
import { EffectLayer } from './layers/EffectLayer';
import { useGameStore } from '../stores/useGameStore';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private mapLayer: MapLayer;
  private entityLayer: EntityLayer;
  private effectLayer: EffectLayer;
  private animFrameId = 0;
  private lastTime = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.camera = new Camera(canvas.width, canvas.height);
    this.mapLayer = new MapLayer();
    this.entityLayer = new EntityLayer();
    this.effectLayer = new EffectLayer();
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animFrameId);
  }

  private loop = (now: number): void => {
    if (!this.running) return;

    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    const snapshot = useGameStore.getState().snapshot;
    const localPlayerId = useGameStore.getState().localPlayerId;

    // Clear
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    if (snapshot) {
      // Update camera to follow local player
      const localPlayer = snapshot.players.find((p) => p.id === localPlayerId);
      if (localPlayer) {
        this.camera.follow(localPlayer.position, dt);
      }

      // Apply camera transform
      this.ctx.save();
      this.camera.applyTransform(this.ctx);

      // Draw layers
      this.mapLayer.draw(this.ctx, snapshot);
      this.entityLayer.draw(this.ctx, snapshot, localPlayerId);
      this.effectLayer.draw(this.ctx, snapshot, now);

      this.ctx.restore();
    } else {
      // No snapshot - show loading
      this.ctx.fillStyle = '#0a0e17';
      this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      this.ctx.fillStyle = '#8892a4';
      this.ctx.font = '20px system-ui';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(
        'Waiting for game...',
        this.ctx.canvas.width / 2,
        this.ctx.canvas.height / 2,
      );
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };
}
