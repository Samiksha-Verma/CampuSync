const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Custom path so this stays under the same /api/notifications prefix the gateway
// already uses for everything else (see api-gateway/server.js for the matching proxy).
const SOCKET_PATH = '/api/notifications/socket';

// Same multi-origin handling as the gateway (see api-gateway/server.js) -
// FRONTEND_ORIGIN may be a comma-separated list, and localhost:5173 is always
// allowed so local frontend dev keeps working against a deployed instance.
const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.FRONTEND_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean),
];

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    path: SOCKET_PATH,
    cors: {
      origin: allowedOrigins,
    },
  });

  // Socket.io's own handshake auth - the authoritative check for this connection,
  // independent of whatever the gateway does with the HTTP layer (same
  // defense-in-depth principle as every REST service re-verifying its own JWT).
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Missing auth token'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role !== 'student') {
        return next(new Error('Only students can connect to this socket'));
      }

      socket.user = decoded;
      return next();
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`student:${socket.user.id}`);
    socket.join('students');
    console.log(`[notification-service] socket connected: student ${socket.user.id}`);

    socket.on('disconnect', () => {
      console.log(`[notification-service] socket disconnected: student ${socket.user.id}`);
    });
  });

  return io;
};

module.exports = { initSocket, SOCKET_PATH };
