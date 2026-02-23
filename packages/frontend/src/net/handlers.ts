import { getSocket } from './socket';
import { useGameStore } from '../stores/useGameStore';
import { useLobbyStore } from '../stores/useLobbyStore';

let wired = false;

export function wireSocketHandlers(): void {
  if (wired) return;
  wired = true;

  const socket = getSocket();

  socket.on('room_state', (room) => {
    useLobbyStore.getState().setCurrentRoom(room);
  });

  socket.on('game_started', ({ yourTeam, snapshot }) => {
    const store = useGameStore.getState();
    store.setLocalPlayer(socket.id!);
    store.setTeam(yourTeam);
    store.updateSnapshot(snapshot);
  });

  socket.on('state_snapshot', (snapshot) => {
    useGameStore.getState().updateSnapshot(snapshot);
  });

  socket.on('game_ended', (result) => {
    useGameStore.getState().setGameResult(result);
  });

  socket.on('player_jailed', () => {
    useGameStore.getState().showFloatingMessage('ARREST SUCCESS!');
  });

  socket.on('player_disguised', (playerId) => {
    const store = useGameStore.getState();
    if (playerId === store.localPlayerId) {
      store.showFloatingMessage('DISGUISED!');
    }
  });

  socket.on('disguise_revealed', (playerId) => {
    const store = useGameStore.getState();
    if (playerId === store.localPlayerId) {
      store.showFloatingMessage('DISGUISE REVEALED!');
    }
  });

  socket.on('game_aborted', (payload) => {
    console.warn(`[HEIST] Game aborted: ${payload.reason}`);
    useGameStore.getState().setAbortInfo(payload);
  });

  socket.on('error', ({ code, message }) => {
    console.error(`[HEIST] Server error ${code}: ${message}`);
  });

  socket.on('connect', () => {
    console.log('[HEIST] Connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('[HEIST] Disconnected');
  });
}
