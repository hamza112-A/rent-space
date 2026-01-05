const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketHandler = (io) => {
  // Authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user?.name || socket.id}`);
    
    // Join user's personal room
    if (socket.user) {
      socket.join(`user:${socket.user._id}`);
    }

    // Join conversation room
    socket.on('join:conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave:conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle new message
    socket.on('message:send', async (data) => {
      const { conversationId, message } = data;
      io.to(`conversation:${conversationId}`).emit('message:new', {
        ...message,
        sender: socket.user
      });
    });

    // Handle typing indicator
    socket.on('typing:start', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:update', {
        userId: socket.user._id,
        isTyping: true
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:update', {
        userId: socket.user._id,
        isTyping: false
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user?.name || socket.id}`);
    });
  });

  return io;
};

module.exports = socketHandler;
