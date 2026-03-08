import { Module } from '@nestjs/common';
import { HealthController } from '../web/health.controller';
import { OpsController } from '../web/ops.controller';
import { LegacyReadProxyService } from '../services/legacy-read-proxy.service';

@Module({
  controllers: [HealthController, OpsController],
  providers: [LegacyReadProxyService],
})
export class AppModule {}
