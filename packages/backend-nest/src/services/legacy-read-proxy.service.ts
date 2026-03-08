import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LegacyReadProxyService {
  private readonly logger = new Logger(LegacyReadProxyService.name);
  private readonly enabled = process.env.NEST_LEGACY_READ_PROXY === 'true';
  private readonly legacyBaseUrl = process.env.LEGACY_BACKEND_URL || 'http://127.0.0.1:3001';

  isEnabled(): boolean {
    return this.enabled;
  }

  async getJson<T>(path: string): Promise<T | null> {
    if (!this.enabled) return null;
    const url = `${this.legacyBaseUrl}${path}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        this.logger.warn(`Legacy proxy ${path} failed with status ${res.status}`);
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      this.logger.warn(`Legacy proxy ${path} error: ${String(err)}`);
      return null;
    }
  }
}

