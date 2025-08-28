require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { PORT, NODE_ENV } = require('./src/config/config');
const { loadSLAData } = require('./src/services/sla-service');
const { setupRoutes } = require('./src/routes/routes');
const ChatService = require('./services/chatService');

// -----------------------------
// Initialize Express App & Socket.IO
// -----------------------------
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: false
  },
  allowEIO3: true,
  pingInterval: 25000,
  pingTimeout: 60000,
  transports: ['polling', 'websocket'], // Prioritize polling for tunnels
  upgradeTimeout: 30000,
  httpCompression: false,
  perMessageDeflate: false
});

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["*"]
}));
app.use(express.json({ limit: '2mb' }));

// -----------------------------
// Initialize Services
// -----------------------------
// Load SLA data on startup
loadSLAData();

// Test database connection
ChatService.testConnection().then(async (success) => {
  if (success) {
    console.log('\n📊 Running additional database tests...');
    await ChatService.testInsert();
    console.log('🚀 Database tests completed\n');
  } else {
    console.log('\n❌ Database connection failed - check your configuration\n');
  }
}).catch(err => {
  console.error('Database connection test failed:', err);
});

// -----------------------------
// Setup Routes
// -----------------------------
setupRoutes(app);

// -----------------------------
// Static Files & Frontend Routes
// -----------------------------
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chatbot', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chatbot.html'));
});

app.get('/socket-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'socket-test.html'));
});

// -----------------------------
// Socket.IO Real-time Features
// -----------------------------
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
const dmRoomOf = (a, b) => `dm:${[a, b].sort().join(":")}`;  
const ticketRoomOf = (ticketId) => `ticket:${ticketId}`;
const getTicketRoom = (ticketId) => ticketRoomOf(ticketId);

function peersIn(room) {
  const r = io.sockets.adapter.rooms.get(room);
  if (!r) return [];
  return Array.from(r).map((sid) => {
    const s = io.sockets.sockets.get(sid);
    return { sid, userId: s?.data?.userId || "unknown" };
  });
}
function emitPresence(room) {
  io.to(room).emit("presence:list", { room, peers: peersIn(room) });
}

// Add engine error logging for debugging
io.engine.on("connection_error", (err) => {
  console.log(
    "[engine] connection_error",
    err?.code,
    err?.message,
    err?.context ? JSON.stringify(err.context) : ""
  );
});

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id, "transport:", socket.conn.transport.name);
  
  // Add transport upgrade logging
  socket.conn.on("upgrade", () => {
    console.log("🔄 Transport upgraded to:", socket.conn.transport.name);
  });
  
  // ---- IDENTITAS dengan validation (email/NPP)
  socket.on("auth:register", async ({ userIdentifier, userType }) => {
    if (!userIdentifier) {
      socket.emit("auth:error", { message: userType === 'employee' ? "NPP is required" : "Email is required" });
      return;
    }
    
    try {
      // Validate user exists in database
      const validation = await ChatService.validateUser(userIdentifier, userType || 'customer');
      
      if (!validation.valid) {
        socket.emit("auth:error", { message: validation.message });
        console.log(`[auth] ❌ ${socket.id} -> ${userIdentifier} (${userType}) - VALIDATION FAILED: ${validation.message}`);
        return;
      }
      
      // Set socket data after validation
      socket.data.userIdentifier = userIdentifier;
      socket.data.userType = userType || 'customer';
      socket.data.userInfo = validation.user;
      
      // Use actual database ID for socket mapping
      const actualUserId = validation.user.customer_id || validation.user.employee_id;
      socket.data.userId = actualUserId;
      
      addUserSocket(actualUserId, socket.id);
      socket.emit("auth:ok", { 
        userIdentifier,
        userId: actualUserId,
        userType: userType || 'customer',
        userInfo: validation.user,
        message: validation.message
      });
      
      console.log(`[auth] ✅ ${socket.id} -> ${userIdentifier} (${userType}) - VALIDATED as ID ${actualUserId}`);
      
    } catch (error) {
      socket.emit("auth:error", { message: "Authentication failed: " + error.message });
      console.log(`[auth] ❌ ${socket.id} -> ${userIdentifier} (${userType}) - ERROR: ${error.message}`);
    }
  });

  // ---- BUKA DM BERDASAR ID
  socket.on("dm:open", ({ toUserId }) => {
    const from = socket.data.userId;
    if (!from || !toUserId) return;
    const room = dmRoomOf(from, toUserId);
    console.log(`[dm:open] ${from} -> ${toUserId} = ${room}`);

    socket.join(room);
    emitPresence(room);
    socket.emit("dm:pending", { room, toUserId });

    const targets = userSockets.get(toUserId);
    if (targets && targets.size > 0) {
      for (const sid of targets) {
        io.to(sid).emit("dm:request", { room, fromUserId: from });
      }
    }
  });

  socket.on("dm:join", ({ room }) => {
    if (!room) return;
    socket.join(room);
    emitPresence(room);
    const set = io.sockets.adapter.rooms.get(room);
    if (set && set.size >= 2) {
      io.to(room).emit("dm:ready", { room });
    }
  });

  // ---- Presence (umum)
  socket.on("presence:get", ({ room }) => {
    if (!room) return;
    socket.emit("presence:list", { room, peers: peersIn(room) });
  });

  // ---- Join ticket room
  socket.on("ticket:join", async ({ ticketId }) => {
    if (!ticketId) return;
    
    const room = getTicketRoom(ticketId);
    socket.join(room);
    socket.data.currentTicketRoom = room;
    socket.data.currentTicketId = ticketId;
    
    console.log(`🎫 User ${socket.data.userId} (${socket.data.userType}) joined ticket room: ${room}`);
    
    // Check who else is in the room
    const roomMembers = peersIn(room);
    console.log(`👥 Room ${room} now has ${roomMembers.length} members:`, roomMembers);
    
    socket.emit('ticket:joined', { ticketId, room, members: roomMembers });
    emitPresence(room);
  });
  
  // ---- Leave ticket room
  socket.on("ticket:leave", ({ ticketId }) => {
    const room = getTicketRoom(ticketId);
    socket.leave(room);
    socket.data.currentTicketRoom = null;
    socket.data.currentTicketId = null;
    
    console.log(`🎫 User ${socket.data.userId} left ticket room: ${room}`);
    emitPresence(room);
  });
  
  // ---- Chat dengan ticket-based room
  socket.on("chat:send", async (msg) => {
    if (!msg?.message) return;
    
    console.log('Received chat message:', msg);
    
    try {
      // Smart context detection dengan proper mapping
      let chatData = {
        ticketId: msg.ticketId || socket.data.currentTicketId,
        userIdentifier: msg.userIdentifier || socket.data.userIdentifier,
        senderType: msg.senderType || socket.data.userType || 'customer',
        message: msg.message
      };
      
      // Map sender type ke database ID
      const senderTypeMap = {
        'customer': 1,
        'employee': 2, 
        'system': 3,
        'bot': 3
      };
      
      chatData.senderTypeId = senderTypeMap[chatData.senderType] || 1;
      
      // Auto-detect missing data (only for customers)
      if (!chatData.ticketId && chatData.userIdentifier && chatData.senderType === 'customer') {
        chatData.ticketId = await ChatService.ensureTicket(chatData.userIdentifier);
        console.log(`🎫 Auto-created/found ticket: ${chatData.ticketId}`);
        
        // Auto-join ticket room
        const room = getTicketRoom(chatData.ticketId);
        socket.join(room);
        socket.data.currentTicketRoom = room;
        socket.data.currentTicketId = chatData.ticketId;
      }
      
      // Get ticket room
      const ticketRoom = getTicketRoom(chatData.ticketId);
      
      // Validate required data
      if (chatData.ticketId && chatData.userIdentifier && chatData.message) {
        
        // Cross-check user exists in appropriate table
        const userValidation = await ChatService.validateUser(chatData.userIdentifier, chatData.senderType);
        
        if (!userValidation.valid) {
          console.log(`❌ User validation failed: ${userValidation.message}`);
          socket.emit('chat:error', { 
            message: `Cannot send message: ${userValidation.message}`,
            code: 'USER_NOT_FOUND'
          });
          return;
        }
        
        console.log('Saving to database:', chatData);
        console.log(`✅ User validated: ${userValidation.user.full_name}`);
        
        await ChatService.saveUserMessage(
          chatData.ticketId, 
          chatData.userIdentifier, 
          chatData.message,
          chatData.senderTypeId,
          chatData.senderType
        );
        console.log(`💾 User message saved: ticket=${chatData.ticketId}, user=${chatData.userIdentifier}`);
        
        socket.emit('chat:success', { 
          message: 'Message saved successfully',
          ticketId: chatData.ticketId,
          room: ticketRoom,
          senderInfo: userValidation.user
        });
        
        // Broadcast ke semua user di ticket room KECUALI pengirim
        console.log(`📢 Broadcasting message to room ${ticketRoom}`);
        const roomMembers = peersIn(ticketRoom);
        console.log(`👥 Broadcasting to ${roomMembers.length} members:`, roomMembers);
        
        socket.to(ticketRoom).emit("chat:new", {
          ...chatData,
          senderInfo: userValidation.user,
          senderId: userValidation.user.customer_id || userValidation.user.employee_id,
          timestamp: new Date().toISOString(),
          room: ticketRoom
        });
        
      } else {
        console.log('Missing required fields after auto-detection:', chatData);
        socket.emit('chat:error', { message: 'Unable to determine chat context' });
      }
      
    } catch (error) {
      console.error('Error handling chat message:', error.message);
      socket.emit('chat:error', { message: 'Failed to save message', error: error.message });
    }
  });
  
  // ---- Chatbot response (tidak disimpan ke database)
  socket.on("chatbot:response", (data) => {
    // Hanya emit response ke client, tidak simpan ke database
    socket.emit("chatbot:message", data);
  });
  
  // ---- Get chat history
  socket.on("chat:history", async ({ ticketId }) => {
    try {
      if (ticketId) {
        const history = await ChatService.getChatHistory(ticketId);
        socket.emit("chat:history", { ticketId, messages: history });
      }
    } catch (error) {
      console.error('Error getting chat history:', error);
      socket.emit('chat:error', { message: 'Failed to get chat history' });
    }
  });

  // ---- Typing indicator untuk ticket room
  socket.on("typing", ({ ticketId }) => {
    const room = ticketId ? getTicketRoom(ticketId) : socket.data.currentTicketRoom;
    if (!room) return;
    socket.to(room).emit("typing", { 
      userId: socket.data.userId,
      userType: socket.data.userType 
    });
  });
  
  socket.on("typing:stop", ({ ticketId }) => {
    const room = ticketId ? getTicketRoom(ticketId) : socket.data.currentTicketRoom;
    if (!room) return;
    socket.to(room).emit("typing:stop", { 
      userId: socket.data.userId 
    });
  });

  // ---- Mock call features
  socket.on("call:invite", ({ room }) => {
    if (!room) return;
    socket.to(room).emit("call:ringing", { fromUserId: socket.data.userId });
  });
  
  socket.on("call:accept", ({ room }) => {
    if (!room) return;
    socket.to(room).emit("call:accepted", {});
  });
  
  socket.on("call:decline", ({ room }) => {
    if (!room) return;
    socket.to(room).emit("call:declined", {});
  });

  socket.on("call:hangup", ({ room }) => {
    if (!room) return;
    socket.to(room).emit("call:ended", {});
  });

  socket.on("call:frame", ({ room, data }) => {
    if (!room || !data) return;
    socket.to(room).emit("call:frame", { data });
  });

  // ---- Audio streaming handlers
  socket.on("audio:chunk", ({ room, data }) => {
    if (!room) return;
    socket.to(room).emit("audio:chunk", { data, timestamp: Date.now() });
  });
  
  socket.on("audio:start", ({ room }) => {
    if (!room) return;
    socket.to(room).emit("audio:started", { fromUserId: socket.data.userId });
  });
  
  socket.on("audio:stop", ({ room }) => {
    if (!room) return;
    socket.to(room).emit("audio:stopped", { fromUserId: socket.data.userId });
  });

  // ---- Join/leave generic (kalau dipakai)
  socket.on("join", ({ room, userId }) => {
    if (!room) return;
    socket.join(room);
    if (userId) socket.data.userId = userId;
    emitPresence(room);
  });

  socket.on("leave", ({ room }) => {
    if (!room) return;
    socket.leave(room);
    emitPresence(room);
  });

  socket.on("disconnect", (reason) => {
    const uid = socket.data.userId;
    if (uid) removeUserSocket(uid, socket.id);
    console.log("🔌 Socket disconnected:", socket.id, "reason:", reason);
  });
});

// Add Socket.IO status endpoint
app.get('/socket-status', (req, res) => {
  res.json({
    app: "bni-customer-care-integrated",
    socketio: "enabled", 
    connected_sockets: io.engine.clientsCount,
    time: new Date().toISOString()
  });
});

// Add database status endpoint
app.get('/db-status', async (req, res) => {
  try {
    const isConnected = await ChatService.testConnection();
    const count = await ChatService.getChatHistory(1);
    
    res.json({
      database: isConnected ? 'connected' : 'disconnected',
      table_exists: true,
      sample_query: 'success',
      time: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      database: 'error',
      error: error.message,
      time: new Date().toISOString()
    });
  }
});

app.get('/db-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chatbot-db-test.html'));
});

app.get('/debug-chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'debug-chat.html'));
});

// -----------------------------
// Start Server
// -----------------------------
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Integrated Chatbot + Socket.IO Server running on http://0.0.0.0:${PORT}`);
  console.log(`📋 API Tester: http://localhost:${PORT}/`);
  console.log(`💬 Chatbot Interface: http://localhost:${PORT}/chatbot`);
  console.log(`🔌 Socket.IO Test: http://localhost:${PORT}/socket-test`);
  console.log(`📊 Socket Status: http://localhost:${PORT}/socket-status`);
  console.log(`\n📊 Service Info:`);
  console.log(`   Environment: ${NODE_ENV}`);
  console.log(`   Features: REST API + Socket.IO + Real-time Chat`);
  console.log(`   Access: All interfaces (nginx reverse proxy)`);
  
  if (NODE_ENV === 'production') {
    console.log(`🔴 Production mode - service running`);
  } else {
    console.log(`🟡 Development mode`);
  }
  
  const { LM_BASE_URL, LM_MODEL, LM_TEMPERATURE } = require('./src/config/config');
  console.log(`\n🔧 Configuration:`);
  console.log(`🤖 AI Service: ${LM_BASE_URL}`);
  console.log(`🌡️ Temperature: ${LM_TEMPERATURE}`);
  console.log(`🔌 Socket.IO: Enabled with real-time features`);
  console.log(`   Current AI URL: ${LM_BASE_URL}`);
});
