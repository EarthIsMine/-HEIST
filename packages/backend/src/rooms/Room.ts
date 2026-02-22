import type { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  RoomInfo,
  RoomPlayer,
  Team,
  Vec2,
  GameResult,
} from '@heist/shared';
import { MAX_PLAYERS, ENTRY_FEE_LAMPORTS, COP_COUNT, THIEF_COUNT } from '@heist/shared';
import { GameLoop } from '../game/GameLoop.js';
import type { PlayerInit } from '../game/GameState.js';
import { refundAllPlayers } from '../solana/payout.js';
import { log } from '../utils/logger.js';

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const BOT_NAMES_COP = ['Officer Bot', 'Deputy Bot'];
const BOT_NAMES_THIEF = ['Bandit Bot', 'Rogue Bot', 'Shadow Bot', 'Phantom Bot'];

export class Room {
  id: string;
  name: string;
  players: Map<string, RoomPlayer> = new Map();
  socketMap: Map<string, string> = new Map();
  teamPreference: Map<string, Team> = new Map();
  gameLoop: GameLoop | null = null;
  phase: 'filling' | 'head_start' | 'playing' | 'ended' = 'filling';
  onCleanup?: (playerIds: string[]) => void;

  private io: TypedIO;
  private minPlayers: number;

  constructor(id: string, name: string, io: TypedIO, minPlayers: number) {
    this.id = id;
    this.name = name;
    this.io = io;
    this.minPlayers = minPlayers;
  }

  addPlayer(socketId: string, name: string, walletAddress: string): boolean {
    if (this.players.size >= MAX_PLAYERS) return false;
    if (this.phase !== 'filling') return false;

    this.players.set(socketId, {
      id: socketId,
      name,
      walletAddress,
      ready: false,
      confirmed: ENTRY_FEE_LAMPORTS === 0,
    });
    this.socketMap.set(socketId, walletAddress);

    this.broadcastRoomState();
    return true;
  }

  removePlayer(socketId: string): void {
    // Capture wallet before deleting
    const disconnectedWallet = this.socketMap.get(socketId) || '';

    this.players.delete(socketId);
    this.socketMap.delete(socketId);
    this.teamPreference.delete(socketId);

    if (this.gameLoop) {
      log('Room', `Player ${socketId} left during game, aborting match`);
      this.gameLoop.stop();
      this.gameLoop = null;
      this.phase = 'ended';

      const reason = 'A player disconnected. Entry fees will be refunded.';

      // Refund all players (including the one who disconnected)
      if (ENTRY_FEE_LAMPORTS > 0) {
        const allWallets = [...this.players.values()]
          .map((p) => ({ walletAddress: p.walletAddress }));
        if (disconnectedWallet && disconnectedWallet !== 'bot') {
          allWallets.push({ walletAddress: disconnectedWallet });
        }

        // Emit immediate abort notice, then refund in background
        this.io.to(this.id).emit('game_aborted', {
          reason,
          refundTxSignatures: [],
        });
        this.cleanup();

        refundAllPlayers(allWallets, ENTRY_FEE_LAMPORTS).then((sigs) => {
          log('Room', `Refund complete: ${sigs.length} transactions`);
        });
      } else {
        this.io.to(this.id).emit('game_aborted', {
          reason,
          refundTxSignatures: [],
        });
        this.cleanup();
      }
      return;
    }

    this.broadcastRoomState();
  }

  confirmEntry(socketId: string): boolean {
    const player = this.players.get(socketId);
    if (!player) return false;
    player.confirmed = true;
    this.broadcastRoomState();
    return true;
  }

  selectTeam(socketId: string, team: Team): void {
    this.teamPreference.set(socketId, team);
    log('Room', `Player ${socketId} selected team: ${team}`);
  }

  setReady(socketId: string): void {
    const player = this.players.get(socketId);
    if (!player) return;
    player.ready = true;
    this.broadcastRoomState();
    this.checkAllReady();
  }

  handleInputMove(socketId: string, direction: Vec2): void {
    this.gameLoop?.applyInput(socketId, direction);
  }

  handleRequestSkill(socketId: string, skill: string, targetId?: string): void {
    this.gameLoop?.requestSkill(socketId, skill, targetId);
  }

  handleCancelSkill(socketId: string): void {
    this.gameLoop?.cancelSkill(socketId);
  }

  private checkAllReady(): void {
    const realPlayers = [...this.players.values()];
    if (realPlayers.length < this.minPlayers) return;
    const allReady = realPlayers.every((p) => p.ready);
    if (!allReady) return;

    this.startGame();
  }

  private startGame(): void {
    log('Room', `Starting game in room ${this.id} with bots`);

    const teamAssignments = new Map<string, Team>();
    for (const id of this.players.keys()) {
      teamAssignments.set(id, this.teamPreference.get(id) || 'thief');
    }

    let copCount = [...teamAssignments.values()].filter((t) => t === 'cop').length;
    let thiefCount = [...teamAssignments.values()].filter((t) => t === 'thief').length;

    const botIds: string[] = [];
    const playerInits: PlayerInit[] = [];

    for (const [socketId, p] of this.players) {
      playerInits.push({
        id: socketId,
        walletAddress: p.walletAddress,
        name: p.name,
        team: teamAssignments.get(socketId)!,
      });
    }

    // Fill cops with bots
    let botCopIdx = 0;
    while (copCount < COP_COUNT) {
      const botId = `bot_cop_${botCopIdx}`;
      playerInits.push({
        id: botId,
        walletAddress: 'bot',
        name: BOT_NAMES_COP[botCopIdx % BOT_NAMES_COP.length],
        team: 'cop',
      });
      botIds.push(botId);
      copCount++;
      botCopIdx++;
    }

    // Fill thieves with bots
    let botThiefIdx = 0;
    while (thiefCount < THIEF_COUNT) {
      const botId = `bot_thief_${botThiefIdx}`;
      playerInits.push({
        id: botId,
        walletAddress: 'bot',
        name: BOT_NAMES_THIEF[botThiefIdx % BOT_NAMES_THIEF.length],
        team: 'thief',
      });
      botIds.push(botId);
      thiefCount++;
      botThiefIdx++;
    }

    log('Room', `Players: ${playerInits.map((p) => `${p.name}(${p.team})`).join(', ')}`);
    log('Room', `Bots: ${botIds.length}`);

    this.gameLoop = new GameLoop(
      playerInits,
      (getSnapshot) => {
        for (const [socketId] of this.players) {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.emit('state_snapshot', getSnapshot(socketId));
          }
        }
      },
      (result: GameResult) => {
        this.phase = 'ended';
        this.io.to(this.id).emit('game_ended', result);
        log('Room', `Game ended: ${result.winningTeam} wins (${result.reason})`);
        this.cleanup();
      },
      undefined,
      botIds,
    );

    for (const [socketId] of this.players) {
      const team = teamAssignments.get(socketId)!;
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('game_started', {
          yourTeam: team,
          snapshot: this.gameLoop.getSnapshot(),
        });
      }
    }

    this.phase = 'head_start';
    this.gameLoop.start();
  }

  private broadcastRoomState(): void {
    this.io.to(this.id).emit('room_state', this.toRoomInfo());
  }

  toRoomInfo(): RoomInfo {
    return {
      id: this.id,
      name: this.name,
      players: [...this.players.values()],
      maxPlayers: MAX_PLAYERS,
      entryFeeLamports: ENTRY_FEE_LAMPORTS,
    };
  }

  private cleanup(): void {
    this.gameLoop?.stop();
    this.gameLoop = null;

    const playerIds = [...this.players.keys()];

    // Remove all players from the Socket.IO room so they can rejoin fresh
    for (const socketId of playerIds) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(this.id);
        socket.data.roomId = '';
      }
    }
    this.players.clear();
    this.socketMap.clear();
    this.teamPreference.clear();

    this.onCleanup?.(playerIds);
    log('Room', `Room ${this.id} cleaned up`);
  }

  get isEmpty(): boolean {
    return this.players.size === 0;
  }
}
