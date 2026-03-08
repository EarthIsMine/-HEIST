import { Module } from '@nestjs/common';
import { HealthController } from '../web/health.controller';
import { OpsController } from '../web/ops.controller';
import { LegacyReadProxyService } from '../services/legacy-read-proxy.service';
import { RoomLifecycleController } from '../web/room-lifecycle.controller';
import { RoomLifecycleService } from '../services/room-lifecycle.service';
import { HeistGateway } from '../gateway/heist.gateway';

@Module({
  controllers: [HealthController, OpsController, RoomLifecycleController],
  providers: [LegacyReadProxyService, RoomLifecycleService, HeistGateway],
})
export class AppModule {}
