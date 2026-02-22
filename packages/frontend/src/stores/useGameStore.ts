import { create } from 'zustand';
import type { StateSnapshot, Team, GameResult, PlayerId } from '@heist/shared';

interface AbortInfo {
  reason: string;
  refundTxSignatures: string[];
}

interface GameStore {
  localPlayerId: PlayerId | null;
  myTeam: Team | null;
  snapshot: StateSnapshot | null;
  gameResult: GameResult | null;
  showResultModal: boolean;
  abortInfo: AbortInfo | null;
  showAbortModal: boolean;

  setLocalPlayer: (id: PlayerId) => void;
  setTeam: (team: Team) => void;
  updateSnapshot: (snap: StateSnapshot) => void;
  setGameResult: (result: GameResult) => void;
  setAbortInfo: (info: AbortInfo) => void;
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

  setLocalPlayer: (id) => set({ localPlayerId: id }),
  setTeam: (team) => set({ myTeam: team }),
  updateSnapshot: (snap) => set({ snapshot: snap }),
  setGameResult: (result) => set({ gameResult: result, showResultModal: true }),
  setAbortInfo: (info) => set({ abortInfo: info, showAbortModal: true }),
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
