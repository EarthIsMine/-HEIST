import { create } from 'zustand';
import type { StateSnapshot, Team, GameResult, PlayerId } from '@heist/shared';

interface AbortInfo {
  reason: string;
  refundTxSignatures: string[];
}

interface FloatingMessage {
  text: string;
  startTime: number;
}

interface GameStore {
  localPlayerId: PlayerId | null;
  myTeam: Team | null;
  snapshot: StateSnapshot | null;
  gameResult: GameResult | null;
  showResultModal: boolean;
  abortInfo: AbortInfo | null;
  showAbortModal: boolean;
  floatingMessage: FloatingMessage | null;

  setLocalPlayer: (id: PlayerId) => void;
  setTeam: (team: Team) => void;
  updateSnapshot: (snap: StateSnapshot) => void;
  setGameResult: (result: GameResult) => void;
  setAbortInfo: (info: AbortInfo) => void;
  showFloatingMessage: (text: string) => void;
  closeResultModal: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  localPlayerId: null,
  myTeam: null,
  snapshot: null,
  gameResult: null,
  showResultModal: false,
  abortInfo: null,
  showAbortModal: false,
  floatingMessage: null,

  setLocalPlayer: (id) => set({ localPlayerId: id }),
  setTeam: (team) => set({ myTeam: team }),
  updateSnapshot: (snap) => set({ snapshot: snap }),
  setGameResult: (result) => set({ gameResult: result, showResultModal: true }),
  setAbortInfo: (info) => set({ abortInfo: info, showAbortModal: true }),
  showFloatingMessage: (text) => {
    set({ floatingMessage: { text, startTime: performance.now() } });
    setTimeout(() => set({ floatingMessage: null }), 2000);
  },
  closeResultModal: () => set({ showResultModal: false }),
  reset: () =>
    set({
      localPlayerId: null,
      myTeam: null,
      snapshot: null,
      gameResult: null,
      showResultModal: false,
      abortInfo: null,
      showAbortModal: false,
    }),
}));
