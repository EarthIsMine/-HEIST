import type { StateSnapshot } from '@heist/shared';
import { MAP_WIDTH, MAP_HEIGHT } from '@heist/shared';

const GRID_SIZE = 100;

export class MapLayer {
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

      ctx.beginPath();
      ctx.arc(storage.position.x, storage.position.y, storage.radius, 0, Math.PI * 2);
      ctx.fillStyle = ratio > 0 ? 'rgba(255, 215, 0, 0.15)' : 'rgba(100, 100, 100, 0.1)';
      ctx.fill();
      ctx.strokeStyle = ratio > 0 ? '#ffd700' : '#555';
      ctx.lineWidth = 3;
      ctx.stroke();

      if (ratio > 0) {
        ctx.beginPath();
        ctx.moveTo(storage.position.x, storage.position.y);
        ctx.arc(
          storage.position.x,
          storage.position.y,
          storage.radius - 6,
          -Math.PI / 2,
          -Math.PI / 2 + ratio * Math.PI * 2,
        );
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fill();
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
    ctx.beginPath();
    ctx.arc(jail.position.x, jail.position.y, jail.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(136, 136, 136, 0.1)';
    ctx.fill();
    ctx.setLineDash([10, 6]);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#888';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('JAIL', jail.position.x, jail.position.y - jail.radius - 14);

    if (jail.inmates.length > 0) {
      ctx.fillStyle = '#ff4757';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText(
        `${jail.inmates.length} imprisoned`,
        jail.position.x,
        jail.position.y + jail.radius + 20,
      );
    }
  }
}
