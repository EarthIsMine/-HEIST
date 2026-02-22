import 'dotenv/config';
import { createApp } from './server.js';
import { RoomManager } from './rooms/RoomManager.js';
import { log } from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '8032', 10);
const MIN_PLAYERS = parseInt(process.env.MIN_PLAYERS || '1', 10);

const { httpServer, io } = createApp();
const roomManager = new RoomManager(io, MIN_PLAYERS);

io.on('connection', (socket) => {
  log('Server', `Client connected: ${socket.id}`);

  socket.on('list_rooms', (ack) => {
    ack(roomManager.listRooms());
  });

  socket.on('join_room', (roomId, payload, ack) => {
    roomManager.handleJoinRoom(socket, roomId, payload, ack);
  });

  socket.on('confirm_entry', (txSignature, ack) => {
    roomManager.handleConfirmEntry(socket, txSignature, ack);
  });

  socket.on('select_team', (team) => {
    roomManager.handleSelectTeam(socket, team);
  });

  socket.on('ready', () => {
    roomManager.handleReady(socket);
  });

  socket.on('input_move', (direction) => {
    roomManager.handleInputMove(socket, direction);
  });

  socket.on('request_steal', (storageId) => {
    roomManager.handleRequestSkill(socket, 'steal', storageId);
  });

  socket.on('request_break_jail', () => {
    roomManager.handleRequestSkill(socket, 'break_jail');
  });

  socket.on('request_arrest', (targetId) => {
    roomManager.handleRequestSkill(socket, 'arrest', targetId);
  });

  socket.on('cancel_skill', () => {
    roomManager.handleCancelSkill(socket);
  });

  socket.on('disconnect', () => {
    log('Server', `Client disconnected: ${socket.id}`);
    roomManager.handleDisconnect(socket);
  });
});

httpServer.listen(PORT, () => {
  log('Server', `HEIST server running on port ${PORT} (min players: ${MIN_PLAYERS})`);
});

// Graceful shutdown for tsx watch
function shutdown() {
  io.close();
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 500);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
