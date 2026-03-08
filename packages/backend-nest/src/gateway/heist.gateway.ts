import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { RoomLifecycleService } from '../services/room-lifecycle.service';

type JoinRoomPayload = {
  name: string;
  walletAddress: string;
  requestId?: string;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket', 'polling'],
})
export class HeistGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(HeistGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly roomLifecycle: RoomLifecycleService) {}

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('list_rooms')
  handleListRooms() {
    // Stage4 이식 단계에서는 lobby 목록을 빈 배열로 시작하고, 이후 room registry 연동으로 확장한다.
    return [];
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: [string, JoinRoomPayload],
  ) {
    const [roomId, payload] = body;
    if (!roomId || !payload?.walletAddress) {
      return {
        ok: false,
        error: 'roomId and walletAddress are required',
      };
    }

    client.join(roomId);
    // roomId를 파티션 키로 사용하는 join 정책을 Nest 서비스에서 처리한다.
    return this.roomLifecycle.joinRoom({
      roomId,
      walletAddress: payload.walletAddress,
      requestId: payload.requestId,
    });
  }
}

