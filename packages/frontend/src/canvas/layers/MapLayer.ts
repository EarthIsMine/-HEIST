import type { StateSnapshot } from '@heist/shared';
import { MAP_WIDTH, MAP_HEIGHT } from '@heist/shared';

const GRID_SIZE = 100;

export class MapLayer {
  private jailImg: HTMLImageElement;
  private jailImgLoaded = false;
  private storageImg: HTMLImageElement;
  private storageImgLoaded = false;

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
  }

  draw(ctx: CanvasRenderingContext2D, snapshot: StateSnapshot): void {
    // Background
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Grid lines
    ctx.strokeStyle = '#222d3d';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= MAP_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, MAP_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= MAP_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(MAP_WIDTH, y);
      ctx.stroke();
    }

    // Map border
    ctx.strokeStyle = '#3a4a5a';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Obstacles
    for (const obs of snapshot.obstacles) {
      ctx.fillStyle = '#2a3a4a';
      ctx.fillRect(obs.position.x, obs.position.y, obs.width, obs.height);
      ctx.strokeStyle = '#3d5060';
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.position.x, obs.position.y, obs.width, obs.height);
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
