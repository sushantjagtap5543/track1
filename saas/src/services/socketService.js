import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

/**
 * Initializes the Socket.io server and sets up event handlers.
 * @param {Object} server - The HTTP server instance.
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
      methods: ['GET', 'POST']
    }
  });

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id} (User: ${socket.user.userId})`);

    // Join a room for this user to receive their specific device updates
    socket.join(`user:${socket.user.userId}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Broadcasts a location update to a specific user.
 * @param {string} userId - The SaaS user ID.
 * @param {Object} data - The location/position data.
 */
export const broadcastLocation = (userId, data) => {
  if (io) {
    io.to(`user:${userId}`).emit('locationUpdate', data);
  }
};

/**
 * Broadcasts a status event (e.g., online/offline, alarm).
 * @param {string} userId - The SaaS user ID.
 * @param {Object} event - The event data.
 */
export const broadcastEvent = (userId, event) => {
  if (io) {
    io.to(`user:${userId}`).emit('event', event);
  }
};

export default {
  initSocket,
  broadcastLocation,
  broadcastEvent
};
