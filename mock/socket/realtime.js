// Socket.IO Real-time handler untuk Customer Care
const { Server } = require('socket.io');

// userId -> Set<socketId>
const userSockets = new Map();

const addUserSocket = (userId, sid) => {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(sid);
};

const removeUserSocket = (userId, sid) => {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(sid);
  if (set.size === 0) userSockets.delete(userId);
};

const dmRoomOf = (a, b) => `dm:${[a, b].sort().join(':')}`;

function peersIn(io, room) {
  const r = io.sockets.adapter.rooms.get(room);
  if (!r) return [];
  return Array.from(r).map((sid) => {
    const s = io.sockets.sockets.get(sid);
    return { sid, userId: s?.data?.userId || 'unknown' };
  });
}

function emitPresence(io, room) {
  io.to(room).emit('presence:list', { room, peers: peersIn(io, room) });
}

function setupSocketIO(server, corsOrigin) {
  const io = new Server(server, {
    cors: { origin: corsOrigin },
    pingInterval: 25000,
    pingTimeout: 20000,
    allowEIO3: true,
    path: '/socket.io'
  });

  io.engine.on('connection_error', (err) => {
    console.log('[socket] connection_error', err?.code, err?.message);
  });

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // Authentication
    socket.on('auth:register', ({ userId }) => {
      if (!userId) return;
      socket.data.userId = userId;
      addUserSocket(userId, socket.id);
      socket.emit('auth:ok', { userId });
      console.log(`[auth] ${socket.id} -> ${userId}`);
    });

    // Direct Messaging
    socket.on('dm:open', ({ toUserId }) => {
      const from = socket.data.userId;
      if (!from || !toUserId) return;
      const room = dmRoomOf(from, toUserId);
      
      socket.join(room);
      emitPresence(io, room);
      socket.emit('dm:pending', { room, toUserId });

      const targets = userSockets.get(toUserId);
      if (targets && targets.size > 0) {
        for (const sid of targets) {
          io.to(sid).emit('dm:request', { room, fromUserId: from });
        }
      }
    });

    socket.on('dm:join', ({ room }) => {
      if (!room) return;
      socket.join(room);
      emitPresence(io, room);
      const set = io.sockets.adapter.rooms.get(room);
      if (set && set.size >= 2) {
        io.to(room).emit('dm:ready', { room });
      }
    });

    // Chat
    socket.on('chat:send', (msg) => {
      if (!msg?.room) return;
      socket.to(msg.room).emit('chat:new', msg);
    });

    socket.on('typing', ({ room }) => {
      if (!room) return;
      socket.to(room).emit('typing');
    });

    // Presence
    socket.on('presence:get', ({ room }) => {
      if (!room) return;
      socket.emit('presence:list', { room, peers: peersIn(io, room) });
    });

    // Mock Call System
    socket.on('call:invite', ({ room }) => {
      if (!room) return;
      socket.to(room).emit('call:ringing', { fromUserId: socket.data.userId });
    });

    socket.on('call:accept', ({ room }) => {
      if (!room) return;
      socket.to(room).emit('call:accepted', {});
    });

    socket.on('call:decline', ({ room }) => {
      if (!room) return;
      socket.to(room).emit('call:declined', {});
    });

    socket.on('call:hangup', ({ room }) => {
      if (!room) return;
      socket.to(room).emit('call:ended', {});
    });

    // Disconnect
    socket.on('disconnect', (reason) => {
      const uid = socket.data.userId;
      if (uid) removeUserSocket(uid, socket.id);
      console.log(`[socket] disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  return io;
}

module.exports = { setupSocketIO };