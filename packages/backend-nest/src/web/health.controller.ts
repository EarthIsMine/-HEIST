import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  getHealth() {
    return {
      status: 'ok',
      service: 'backend-nest',
      phase: 'parallel-migration',
      checkedAt: new Date().toISOString(),
    };
  }
}

