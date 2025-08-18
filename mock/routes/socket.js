// Socket.IO REST endpoints untuk testing dan monitoring
const express = require('express');

function createSocketRoutes(db, io) {
  const router = express.Router();

  // Get online users
  router.get('/users/online', (req, res) => {
    const connectedSockets = Array.from(io.sockets.sockets.values());
    const onlineUsers = connectedSockets
      .filter(s => s.data.userId)
      .map(s => ({
        userId: s.data.userId,
        socketId: s.id,
        connectedAt: s.handshake.time
      }));

    res.json({
      success: true,
      data: {
        total: onlineUsers.length,
        users: onlineUsers
      }
    });
  });

  // Send message via REST (untuk testing)
  router.post('/message/send', (req, res) => {
    const { room, message, fromUserId } = req.body;
    
    if (!room || !message) {
      return res.status(400).json({
        success: false,
        message: 'room and message are required'
      });
    }

    const messageData = {
      room,
      message,
      fromUserId: fromUserId || 'system',
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    io.to(room).emit('chat:new', messageData);

    res.json({
      success: true,
      message: 'Message sent to room',
      data: messageData
    });
  });

  // Get room info
  router.get('/room/:roomId/info', (req, res) => {
    const { roomId } = req.params;
    const room = io.sockets.adapter.rooms.get(roomId);
    
    if (!room) {
      return res.json({
        success: true,
        data: {
          roomId,
          exists: false,
          members: 0,
          sockets: []
        }
      });
    }

    const sockets = Array.from(room).map(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      return {
        socketId,
        userId: socket?.data?.userId || 'unknown',
        connected: !!socket
      };
    });

    res.json({
      success: true,
      data: {
        roomId,
        exists: true,
        members: room.size,
        sockets
      }
    });
  });

  return router;
}

module.exports = createSocketRoutes;