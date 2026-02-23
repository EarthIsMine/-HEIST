import type { StateSnapshot, GameResult, Vec2, WinReason } from '@heist/shared';
import {
  TICK_MS,
  MATCH_DURATION_MS,
  HEAD_START_MS,
} from '@heist/shared';
import { GameState, type PlayerInit } from './GameState.js';
import { updatePlayerMovement, resolveObstacleCollision } from './physics.js';
import {
  tryStartSteal,
  tryStartBreakJail,
  tryArrest,
  tryDisguise,
  tryBuildWall,
  updateChanneling,
  updateStuns,
  updateDisguises,
  updateDynamicObstacles,
  cancelPlayerSkill,
  type SkillEvent,
} from './skills.js';
import { BotAI } from './BotAI.js';
import { log } from '../utils/logger.js';

export class GameLoop {
  private state: GameState;
  private intervalId: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private onTick: (getSnapshot: (playerId: string) => StateSnapshot) => void;
  private onEnd: (result: GameResult) => void;
  private onSkillEvent?: (event: SkillEvent) => void;
  private botAI: BotAI;

  constructor(
    players: PlayerInit[],
    onTick: (getSnapshot: (playerId: string) => StateSnapshot) => void,
    onEnd: (result: GameResult) => void,
    onSkillEvent?: (event: SkillEvent) => void,
    botIds?: string[],
  ) {
    this.state = new GameState(players);
    this.onTick = onTick;
    this.onEnd = onEnd;
    this.onSkillEvent = onSkillEvent;
    this.botAI = new BotAI();
    if (botIds) {
      for (const id of botIds) {
        this.botAI.registerBot(id);
      }
    }
  }

  start(): void {
    this.startTime = Date.now();
    this.state.phase = 'head_start';
    log('GameLoop', 'Game started (head_start phase)');

    this.intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = now - this.startTime;
      const dt = TICK_MS / 1000;

      // Phase transitions
      if (this.state.phase === 'head_start' && elapsed >= HEAD_START_MS) {
        this.state.phase = 'playing';
        log('GameLoop', 'Phase: playing');
      }

      // Update stuns
      updateStuns(this.state, now);

      // Update disguises
      const disguiseEvents = updateDisguises(this.state, now);
      for (const event of disguiseEvents) {
        this.onSkillEvent?.(event);
      }

      // Update dynamic obstacles (remove expired walls)
      const wallEvents = updateDynamicObstacles(this.state, now);
      for (const event of wallEvents) {
        this.onSkillEvent?.(event);
      }

      // Update movement + obstacle collision
      const allObstacles = this.state.getAllObstacles();
      for (const [, player] of this.state.players) {
        updatePlayerMovement(player, dt, this.state.phase);
        resolveObstacleCollision(player, allObstacles);
      }

      // Update bot AI
      if (this.state.phase !== 'head_start' || true) {
        this.botAI.update(this.state, (botId, skill, targetId) => {
          this.requestSkill(botId, skill, targetId);
        });
      }

      // Update channeling skills
      const skillEvents = updateChanneling(this.state, dt, now);
      for (const event of skillEvents) {
        this.onSkillEvent?.(event);
      }

      // Update timers
      this.state.tick++;
      this.state.matchTimerMs = Math.max(0, MATCH_DURATION_MS - elapsed);
      this.state.headStartTimerMs = Math.max(0, HEAD_START_MS - elapsed);

      // Win conditions
      const result = this.checkWinConditions();
      if (result) {
        this.stop();
        this.onEnd(result);
        return;
      }

      // Broadcast per-player filtered snapshots
      this.onTick((playerId: string) => this.state.toFilteredSnapshot(playerId));
    }, TICK_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getSnapshot(): StateSnapshot {
    return this.state.toSnapshot();
  }

  applyInput(playerId: string, direction: Vec2): void {
    this.state.setPlayerDirection(playerId, direction);
  }

  requestSkill(playerId: string, skill: string, targetId?: string): void {
    let events: SkillEvent[] = [];

    switch (skill) {
      case 'steal': {
        if (!targetId) return;
        const event = tryStartSteal(this.state, playerId, targetId);
        if (event) events = [event];
        break;
      }
      case 'break_jail': {
        const event = tryStartBreakJail(this.state, playerId);
        if (event) events = [event];
        break;
      }
      case 'arrest': {
        if (!targetId) return;
        events = tryArrest(this.state, playerId, targetId);
        break;
      }
      case 'disguise': {
        const event = tryDisguise(this.state, playerId, Date.now());
        if (event) events = [event];
        break;
      }
      case 'build_wall': {
        const event = tryBuildWall(this.state, playerId, Date.now());
        if (event) events = [event];
        break;
      }
    }

    for (const event of events) {
      this.onSkillEvent?.(event);
    }
  }

  cancelSkill(playerId: string): void {
    const event = cancelPlayerSkill(this.state, playerId);
    if (event) {
      this.onSkillEvent?.(event);
    }
  }

  private checkWinConditions(): GameResult | null {
    // Thieves win: all storages emptied
    const allEmpty = this.state.storages.every((s) => s.remainingCoins <= 0);
    if (allEmpty) {
      return this.buildResult('thief', 'all_coins_stolen');
    }

    // Cops win: all thieves jailed
    const thieves = this.state.getThieves();
    const allJailed = thieves.length > 0 && thieves.every((t) => t.isJailed);
    if (allJailed) {
      return this.buildResult('cop', 'all_thieves_jailed');
    }

    // Time expired: cops win
    if (this.state.matchTimerMs <= 0) {
      return this.buildResult('cop', 'time_expired');
    }

    return null;
  }

  private buildResult(winningTeam: 'cop' | 'thief', reason: WinReason): GameResult {
    const winners = [...this.state.players.values()].filter(
      (p) => p.team === winningTeam,
    );
    const totalPool = this.state.players.size * 100_000_000; // ENTRY_FEE_LAMPORTS per player
    const payoutPerWinner = Math.floor(totalPool / Math.max(winners.length, 1));

    return {
      winningTeam,
      reason,
      stolenCoins: this.state.stolenCoins,
      payoutLamports: payoutPerWinner,
      payoutTxSignatures: [], // Will be filled by payout module
    };
  }
}
