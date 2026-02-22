import { create } from 'zustand';
import type { RoomInfo } from '@heist/shared';

interface LobbyStore {
  currentRoom: RoomInfo | null;
  entryPaid: boolean;
  isReady: boolean;
  txSignature: string | null;

  setCurrentRoom: (room: RoomInfo | null) => void;
  setEntryPaid: (paid: boolean, sig?: string) => void;
  setReady: (ready: boolean) => void;
  reset: () => void;
}

export const useLobbyStore = create<LobbyStore>((set) => ({
  currentRoom: null,
  entryPaid: false,
  isReady: false,
  txSignature: null,

  setCurrentRoom: (room) => set({ currentRoom: room }),
  setEntryPaid: (paid, sig) => set({ entryPaid: paid, txSignature: sig || null }),
  setReady: (ready) => set({ isReady: ready }),
  reset: () =>
    set({
      currentRoom: null,
      entryPaid: false,
      isReady: false,
      txSignature: null,
    }),
}));
