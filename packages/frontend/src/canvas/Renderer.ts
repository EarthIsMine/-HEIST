import { Camera } from './Camera';
import { MapLayer } from './layers/MapLayer';
import { EntityLayer } from './layers/EntityLayer';
import { EffectLayer } from './layers/EffectLayer';
import { FogLayer } from './layers/FogLayer';
import { useGameStore } from '../stores/useGameStore';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private mapLayer: MapLayer;
  private entityLayer: EntityLayer;
  private effectLayer: EffectLayer;
  private fogLayer: FogLayer;
  private animFrameId = 0;
  private lastTime = 0;
  private running = false;
  private dpr: number;

  constructor(canvas: HTMLCanvasElement, dpr = 1) {
    this.ctx = canvas.getContext('2d')!;
    this.dpr = dpr;
    this.camera = new Camera(canvas.width / dpr, canvas.height / dpr);
    this.mapLayer = new MapLayer();
    this.entityLayer = new EntityLayer();
    this.effectLayer = new EffectLayer();
    this.fogLayer = new FogLayer();
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

    const canvas = this.ctx.canvas;
    const w = canvas.width / this.dpr;
    const h = canvas.height / this.dpr;

    // Update camera viewport on resize
    this.camera.setViewport(w, h);

    const snapshot = useGameStore.getState().snapshot;
    const localPlayerId = useGameStore.getState().localPlayerId;

    // Clear with identity transform
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scale for HiDPI
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (snapshot) {
      const localPlayer = snapshot.players.find((p) => p.id === localPlayerId);
      if (localPlayer) {
        this.camera.follow(localPlayer.position, dt);
      }

      this.ctx.save();
      this.camera.applyTransform(this.ctx);

      this.mapLayer.draw(this.ctx, snapshot);
      this.entityLayer.draw(this.ctx, snapshot, localPlayerId);
      this.effectLayer.draw(this.ctx, snapshot, now);

      this.ctx.restore();

      // Fog of war (drawn in screen space, after restoring camera transform)
      this.fogLayer.draw(this.ctx, snapshot, localPlayerId, this.camera.x, this.camera.y, w, h);
    } else {
      this.ctx.fillStyle = '#0a0e17';
      this.ctx.fillRect(0, 0, w, h);
      this.ctx.fillStyle = '#8892a4';
      this.ctx.font = '20px system-ui';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('Waiting for game...', w / 2, h / 2);
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };
}
