import type { StateSnapshot } from '@heist/shared';
import { MAP_WIDTH, MAP_HEIGHT, WALL_DURATION_MS } from '@heist/shared';

export class MapLayer {
  private jailImg: HTMLImageElement;
  private jailImgLoaded = false;
  private storageImg: HTMLImageElement;
  private storageImgLoaded = false;
  private mapImg: HTMLImageElement;
  private mapImgLoaded = false;

  constructor() {
    this.jailImg = new Image();
    this.jailImg.src = '/sprites/jail.png';
    this.jailImg.onload = () => {
      this.jailImgLoaded = true;
    };
    this.storageImg = new Image();
    this.storageImg.src = '/sprites/storage.png';
    this.storageImg.onload = () => {
      this.storageImgLoaded = true;
    };
    this.mapImg = new Image();
    this.mapImg.src = '/sprites/map.png';
    this.mapImg.onload = () => {
      this.mapImgLoaded = true;
    };
  }

  draw(ctx: CanvasRenderingContext2D, snapshot: StateSnapshot): void {
    // Background
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    if (this.mapImgLoaded) {
      const scale = 2.0;
      const drawSize = MAP_WIDTH * scale;
      const offset = (MAP_WIDTH - drawSize) / 2;
      ctx.drawImage(this.mapImg, offset, offset, drawSize, drawSize);
    }

    // Obstacles
    for (const obs of snapshot.obstacles) {
      if (obs.expiresAt) {
        // Dynamic wall - orange with fade
        const remaining = obs.expiresAt - Date.now();
        const ratio = Math.max(0, remaining / WALL_DURATION_MS);
        ctx.globalAlpha = 0.4 + ratio * 0.6;
        ctx.fillStyle = '#6b7b8d';
        ctx.fillRect(obs.position.x, obs.position.y, obs.width, obs.height);
        ctx.strokeStyle = '#8899aa';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.position.x, obs.position.y, obs.width, obs.height);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = '#2a3a4a';
        ctx.fillRect(obs.position.x, obs.position.y, obs.width, obs.height);
        ctx.strokeStyle = '#3d5060';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.position.x, obs.position.y, obs.width, obs.height);
      }
    }

    // Storages
    for (const storage of snapshot.storages) {
      const ratio = storage.remainingCoins / storage.totalCoins;

      if (this.storageImgLoaded) {
        const size = storage.radius * 3.5;
        if (ratio <= 0) ctx.globalAlpha = 0.3;
        ctx.drawImage(
          this.storageImg,
          storage.position.x - size / 2,
          storage.position.y - size / 2,
          size,
          size,
        );
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = ratio > 0 ? '#ffd700' : '#555';
      ctx.font = 'bold 20px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `${Math.ceil(storage.remainingCoins)}`,
        storage.position.x,
        storage.position.y,
      );
    }

    // Jail
    const jail = snapshot.jail;
    if (this.jailImgLoaded) {
      const size = jail.radius * 2;
      ctx.drawImage(
        this.jailImg,
        jail.position.x - jail.radius,
        jail.position.y - jail.radius,
        size,
        size,
      );
    }

    if (jail.inmates.length > 0) {
      ctx.fillStyle = '#ff4757';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `${jail.inmates.length} imprisoned`,
        jail.position.x,
        jail.position.y + jail.radius + 20,
      );
    }
  }
}
