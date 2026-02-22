type SpriteKey =
  | 'thief_active'
  | 'thief_move'
  | 'thief_drain'
  | 'cop_active'
  | 'cop_move';

const SPRITE_PATHS: Record<SpriteKey, string> = {
  thief_active: '/sprites/thief/active.png',
  thief_move: '/sprites/thief/move.png',
  thief_drain: '/sprites/thief/drain.png',
  cop_active: '/sprites/cop/active.png',
  cop_move: '/sprites/cop/move.png',
};

/** Flood-fill from corners to remove background cleanly */
function removeBackground(img: HTMLImageElement): HTMLCanvasElement {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const visited = new Uint8Array(w * h);

  const idx = (x: number, y: number) => (y * w + x) * 4;
  const isBackground = (i: number) => {
    const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
    if (a < 10) return true;
    // Light/white pixels (covers white + checkerboard grays)
    if (r > 180 && g > 180 && b > 180) return true;
    return false;
  };

  // BFS flood fill from all 4 corners
  const queue: number[] = [];
  const seeds = [
    0, 0,
    w - 1, 0,
    0, h - 1,
    w - 1, h - 1,
    // Also seed from edge midpoints for better coverage
    Math.floor(w / 2), 0,
    Math.floor(w / 2), h - 1,
    0, Math.floor(h / 2),
    w - 1, Math.floor(h / 2),
  ];

  for (let s = 0; s < seeds.length; s += 2) {
    const sx = seeds[s], sy = seeds[s + 1];
    const si = sy * w + sx;
    if (!visited[si] && isBackground(idx(sx, sy))) {
      visited[si] = 1;
      queue.push(sx, sy);
    }
  }

  while (queue.length > 0) {
    const y = queue.pop()!;
    const x = queue.pop()!;
    const i = idx(x, y);
    d[i + 3] = 0; // Make transparent

    const neighbors = [
      x - 1, y,
      x + 1, y,
      x, y - 1,
      x, y + 1,
    ];
    for (let n = 0; n < neighbors.length; n += 2) {
      const nx = neighbors[n], ny = neighbors[n + 1];
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const ni = ny * w + nx;
      if (visited[ni]) continue;
      visited[ni] = 1;
      if (isBackground(idx(nx, ny))) {
        queue.push(nx, ny);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return c;
}

class SpriteManager {
  private sprites: Map<string, HTMLCanvasElement> = new Map();
  private loading: Set<string> = new Set();

  constructor() {
    for (const [key, path] of Object.entries(SPRITE_PATHS)) {
      this.load(key, path);
    }
  }

  private load(key: string, path: string): void {
    this.loading.add(key);
    const img = new Image();
    img.src = path;
    img.onload = () => {
      this.sprites.set(key, removeBackground(img));
      this.loading.delete(key);
    };
    img.onerror = () => {
      this.loading.delete(key);
    };
  }

  get(key: SpriteKey): HTMLCanvasElement | null {
    return this.sprites.get(key) ?? null;
  }

  isReady(): boolean {
    return this.loading.size === 0;
  }
}

export const spriteManager = new SpriteManager();
export type { SpriteKey };
