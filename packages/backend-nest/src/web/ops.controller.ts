import { Controller, Get } from '@nestjs/common';
import { LegacyReadProxyService } from '../services/legacy-read-proxy.service';

@Controller()
export class OpsController {
  constructor(private readonly legacyProxy: LegacyReadProxyService) {}

  @Get('/_metrics')
  async getMetrics() {
    // 병행 이관 초반에는 legacy 관측치를 그대로 프록시해 대시보드 스키마를 안정화한다.
    const legacy = await this.legacyProxy.getJson<Record<string, unknown>>('/_metrics');
    if (legacy) return legacy;
    return {
      source: 'nest-local',
      migrationPhase: 'phase-1-bootstrap',
      legacyReadProxy: this.legacyProxy.isEnabled(),
      generatedAt: new Date().toISOString(),
    };
  }

  @Get('/_state/consistency')
  async getConsistency() {
    const legacy = await this.legacyProxy.getJson<Record<string, unknown>>('/_state/consistency');
    if (legacy) return legacy;
    return {
      ok: true,
      source: 'nest-local',
      migrationPhase: 'phase-1-bootstrap',
      checkedAt: new Date().toISOString(),
      note: 'legacy proxy disabled or unavailable',
    };
  }
}
