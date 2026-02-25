import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  Vec2,
  Team,
} from '@heist/shared';
import type { RoomInfo } from '@heist/shared';

import { Room } from './Room.js';
import { log } from '../utils/logger.js';

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerRoomMap: Map<string, string> = new Map(); // socketId -> roomId
  private io: TypedIO;
  private minPlayers: number;

  constructor(io: TypedIO, minPlayers: number) {
    this.io = io;
    this.minPlayers = minPlayers;
  }

  handleJoinRoom(
    socket: TypedSocket,
    roomId: string,
    payload: { name: string; walletAddress: string },
    ack: (result: { ok: boolean; error?: string }) => void,
  ): void {
    let room = this.rooms.get(roomId);

    if (!room) {
      room = new Room(roomId, `Room ${roomId.slice(0, 6)}`, this.io, this.minPlayers);
      room.onCleanup = (playerIds) => {
        for (const pid of playerIds) {
          this.playerRoomMap.delete(pid);
        }
        this.rooms.delete(roomId);
        log('RoomManager', `Room ${roomId} removed after game ended`);
      };
      this.rooms.set(roomId, room);
      log('RoomManager', `Created room ${roomId}`);
    }

    // Kick stale socket if same wallet is already in a room (reconnection)
    for (const [rid, r] of this.rooms) {
      for (const [oldSocketId, p] of r.players) {
        if (p.walletAddress === payload.walletAddress) {
          // Same socket re-joining the same room — just ack OK
          if (oldSocketId === socket.id && rid === roomId) {
            ack({ ok: true });
            return;
          }
          if (r.phase !== 'filling') {
            ack({ ok: false, error: 'This wallet is already in an active game' });
            return;
          }
          log('RoomManager', `Kicking stale session ${oldSocketId} for wallet ${payload.walletAddress}`);
          r.removePlayer(oldSocketId);
          this.playerRoomMap.delete(oldSocketId);
          const oldSocket = this.io.sockets.sockets.get(oldSocketId);
          if (oldSocket && oldSocketId !== socket.id) {
            oldSocket.emit('kicked', 'Same wallet connected from another session');
            oldSocket.leave(rid);
            oldSocket.disconnect(true);
          }
          if (r.isEmpty) {
            this.rooms.delete(rid);
          }
          break;
        }
      }
    }

    socket.join(roomId);

    const success = room.addPlayer(socket.id, payload.name, payload.walletAddress);
    if (!success) {
      socket.leave(roomId);
      ack({ ok: false, error: 'Room is full or game in progress' });
      return;
    }

    socket.data.roomId = roomId;
    socket.data.playerId = socket.id;
    socket.data.walletAddress = payload.walletAddress;
    this.playerRoomMap.set(socket.id, roomId);

    log('RoomManager', `Player ${payload.name} joined room ${roomId}`);
    ack({ ok: true });
  }

  handleConfirmEntry(
    socket: TypedSocket,
    txSignature: string,
    ack: (result: { ok: boolean; error?: string }) => void,
  ): void {
    const room = this.getPlayerRoom(socket.id);
    if (!room) {
      ack({ ok: false, error: 'Not in a room' });
      return;
    }

    // MVP: Trust the signature without on-chain verification
    const success = room.confirmEntry(socket.id);
    if (success) {
      log('RoomManager', `Entry confirmed for ${socket.id} with tx ${txSignature}`);
      ack({ ok: true });
    } else {
      ack({ ok: false, error: 'Failed to confirm entry' });
    }
  }

  handleSelectTeam(socket: TypedSocket, team: Team): { ok: boolean; error?: string } {
    const room = this.getPlayerRoom(socket.id);
    if (!room) return { ok: false, error: 'Not in a room' };
    const result = room.selectTeam(socket.id, team);
    if (result.ok) {
      log('RoomManager', `Player ${socket.id} selected team: ${team}`);
    }
    return result;
  }

  handleReady(socket: TypedSocket): void {
    const room = this.getPlayerRoom(socket.id);
    if (!room) return;
    room.setReady(socket.id);
    log('RoomManager', `Player ${socket.id} is ready in room ${room.id}`);
  }

  handleInputMove(socket: TypedSocket, direction: Vec2): void {
    const room = this.getPlayerRoom(socket.id);
    if (!room) return;
    room.handleInputMove(socket.id, direction);
  }

  handleRequestSkill(socket: TypedSocket, skill: string, targetId?: string): void {
    const room = this.getPlayerRoom(socket.id);
    if (!room) return;
    room.handleRequestSkill(socket.id, skill, targetId);
  }

  handleCancelSkill(socket: TypedSocket): void {
    const room = this.getPlayerRoom(socket.id);
    if (!room) return;
    room.handleCancelSkill(socket.id);
  }

  handleDisconnect(socket: TypedSocket): void {
    const room = this.getPlayerRoom(socket.id);
    if (!room) return;

    room.removePlayer(socket.id);
    this.playerRoomMap.delete(socket.id);

    if (room.isEmpty) {
      this.rooms.delete(room.id);
      log('RoomManager', `Room ${room.id} deleted (empty)`);
    }
  }

  abortAllGames(reason: string): void {
    for (const room of this.rooms.values()) {
      room.abort(reason);
    }
  }

  listRooms(): RoomInfo[] {
    return [...this.rooms.values()]
      .filter((r) => r.phase === 'filling')
      .map((r) => r.toRoomInfo());
  }

  private getPlayerRoom(socketId: string): Room | undefined {
    const roomId = this.playerRoomMap.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }
}
