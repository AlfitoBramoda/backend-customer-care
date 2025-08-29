const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { PORT, NODE_ENV } = require('./src/config/config');
const { loadSLAData } = require('./src/services/sla-service');
const { setupRoutes } = require('./src/routes/routes');

// Database models
const db = require('../../models');
const { Op } = require('sequelize');
const { ticket: Ticket, chat_message: ChatMessage } = db;

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

app.get('/chat-db-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat-db-test.html'));
});

app.get('/chat-history-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat-history-test.html'));
});

app.get('/chat-ui-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat-ui-test.html'));
});

// -----------------------------
// Socket.IO Real-time Features
// -----------------------------
// userId -> Set<socketId>
const userSockets = new Map();
// Cache room -> ticket_id mapping
const roomTicketCache = new Map();
// Time-based session cache untuk multiple tickets
const roomTicketSessions = new Map(); // room -> {ticketId, lastActivity, ticketNumber}
// Cache untuk mencegah duplicate history loading
const historyLoadedRooms = new Set();

// Helper functions
function extractSenderInfo(userId) {
  const [prefix, idStr] = userId.split('-');
  return {
    sender_id: parseInt(idStr),
    sender_type_id: prefix === 'CUS' ? 1 : 2
  };
}

async function findActiveTicket(room) {
  try {
    const [, userA, userB] = room.split(':');
    const customer = userA.startsWith('CUS') ? userA : userB;
    const employee = userA.startsWith('EMP') ? userA : userB;
    
    const customerId = parseInt(customer.split('-')[1]);
    const employeeId = parseInt(employee.split('-')[1]);
    
    // Cek berapa banyak ticket aktif
    const activeTickets = await Ticket.findAll({
      where: {
        customer_id: customerId,
        responsible_employee_id: employeeId,
        customer_status_id: { [Op.in]: [1, 2, 3] }
      },
      order: [['created_time', 'DESC']]
    });
    
    if (activeTickets.length === 0) {
      console.log(`[TICKET] No active tickets found for ${customer} <-> ${employee}`);
      return null;
    }
    
    if (activeTickets.length > 1) {
      console.warn(`[TICKET] WARNING: Found ${activeTickets.length} active tickets for ${customer} <-> ${employee}`);
      const statusNames = {1: 'Status1', 2: 'Status2', 3: 'Status3'};
      console.warn(`[TICKET] Tickets: ${activeTickets.map(t => `${t.ticket_number}(${statusNames[t.customer_status_id] || 'Unknown'})`).join(', ')}`);
      console.warn(`[TICKET] Using latest: ${activeTickets[0].ticket_number}`);
    }
    
    const selectedTicket = activeTickets[0];
    const statusNames = {1: 'Status1', 2: 'Status2', 3: 'Status3'};
    const statusName = statusNames[selectedTicket.customer_status_id] || 'Unknown';
    console.log(`[TICKET] Selected ticket: ${selectedTicket.ticket_number} (ID: ${selectedTicket.ticket_id}, Customer Status: ${statusName})`);
    
    return selectedTicket.ticket_id;
    
  } catch (error) {
    console.error('[TICKET] Error finding ticket:', error);
    return null;
  }
}

async function getActiveTicketFromRoom(room) {
  const now = Date.now();
  const session = roomTicketSessions.get(room);
  const SESSION_TIMEOUT = 30000; // 30 detik untuk testing
  
  // Jika ada session aktif (< 30 menit), gunakan ticket yang sama
  if (session && (now - session.lastActivity) < SESSION_TIMEOUT) {
    session.lastActivity = now;
    console.log(`[SESSION] Using existing ticket ${session.ticketId} (${session.ticketNumber}) for room ${room}`);
    return session.ticketId;
  }
  
  // Session expired atau tidak ada, cari ticket terbaru
  const ticketId = await findActiveTicket(room);
  
  if (ticketId) {
    // Get ticket number untuk logging
    const ticket = await Ticket.findByPk(ticketId);
    const ticketNumber = ticket?.ticket_number || 'Unknown';
    
    // Buat session baru
    roomTicketSessions.set(room, {
      ticketId,
      ticketNumber,
      lastActivity: now
    });
    
    if (session && session.ticketId !== ticketId) {
      console.log(`[SESSION] Switched from ticket ${session.ticketId} (${session.ticketNumber}) to ${ticketId} (${ticketNumber}) for room ${room}`);
    } else {
      console.log(`[SESSION] Started new session with ticket ${ticketId} (${ticketNumber}) for room ${room}`);
    }
    
    // Auto-cleanup session setelah 2 jam tidak aktif
    setTimeout(() => {
      const currentSession = roomTicketSessions.get(room);
      if (currentSession && currentSession.ticketId === ticketId && (Date.now() - currentSession.lastActivity) >= SESSION_TIMEOUT) {
        roomTicketSessions.delete(room);
        console.log(`[SESSION] Cleaned up expired session for room: ${room}`);
      }
    }, SESSION_TIMEOUT * 2);
  }
  
  return ticketId;
}

async function loadChatHistory(room, targetSocket = null, limit = 50) {
  try {
    const ticketId = await getActiveTicketFromRoom(room);
    if (!ticketId) return;
    
    const messages = await ChatMessage.findAll({
      where: { ticket_id: ticketId },
      order: [['sent_at', 'ASC']],
      limit: limit
    });
    
    console.log(`[HISTORY] Loading ${messages.length} messages for room ${room}`);
    
    // Kirim history ke semua socket di room atau socket tertentu
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const senderUserId = msg.sender_type_id === 1 ? `CUS-${msg.sender_id}` : `EMP-${msg.sender_id}`;
      
      setTimeout(() => {
        const historyMsg = {
          room: room,
          message: msg.message,
          fromUserId: senderUserId,
          timestamp: msg.sent_at,
          isHistory: true
        };
        
        if (targetSocket) {
          // Kirim ke socket tertentu
          targetSocket.emit("chat:new", historyMsg);
        } else {
          // Kirim ke semua socket di room
          io.to(room).emit("chat:new", historyMsg);
        }
      }, i * 10); // 10ms delay per message
    }
    
    const target = targetSocket ? targetSocket.data.userId : 'all users in room';
    console.log(`[HISTORY] Sent ${messages.length} history messages to ${target}`);
  } catch (error) {
    console.error('[HISTORY] Error loading:', error);
  }
}
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
  
  // ---- IDENTITAS
  socket.on("auth:register", ({ userId }) => {
    if (!userId) return;
    socket.data.userId = userId;
    addUserSocket(userId, socket.id);
    socket.emit("auth:ok", { userId });
    console.log(`[auth] ${socket.id} -> ${userId}`);
  });

  // ---- BUKA DM BERDASAR ID
  socket.on("dm:open", async ({ toUserId }) => {
    const from = socket.data.userId;
    if (!from || !toUserId) return;
    const room = dmRoomOf(from, toUserId);
    console.log(`[dm:open] ${from} -> ${toUserId} = ${room}`);

    socket.join(room);
    emitPresence(room);
    
    // Load history untuk user yang membuka chat
    const socketHistoryKey = `${room}-${socket.id}`;
    if (!historyLoadedRooms.has(socketHistoryKey)) {
      await loadChatHistory(room, socket);
      historyLoadedRooms.add(socketHistoryKey);
    }
    
    socket.emit("dm:pending", { room, toUserId });

    const targets = userSockets.get(toUserId);
    if (targets && targets.size > 0) {
      for (const sid of targets) {
        io.to(sid).emit("dm:request", { room, fromUserId: from });
      }
    }
  });

  socket.on("dm:join", async ({ room }) => {
    if (!room) return;
    socket.join(room);
    emitPresence(room);
    
    // Load history untuk socket yang join (jika belum pernah dapat history)
    const socketHistoryKey = `${room}-${socket.id}`;
    if (!historyLoadedRooms.has(socketHistoryKey)) {
      await loadChatHistory(room, socket);
      historyLoadedRooms.add(socketHistoryKey);
    }
    
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

  // ---- Chat (TIDAK echo ke pengirim)
  socket.on("chat:send", async (msg) => {
    if (!msg?.room) return;
    
    try {
      // Cari ticket aktif
      const ticketId = await getActiveTicketFromRoom(msg.room);
      
      if (ticketId) {
        const senderInfo = extractSenderInfo(socket.data.userId);

        const inputMsg = {
          ticket_id: ticketId,
          sender_id: senderInfo.sender_id,
          sender_type_id: senderInfo.sender_type_id,
          message: msg.message,
          sent_at: new Date()
        }

        console.log("input message:", inputMsg);
        console.log("Isi Message:", msg)
        
        // Simpan ke database
        await ChatMessage.create({
          ticket_id: ticketId,
          sender_id: senderInfo.sender_id,
          sender_type_id: senderInfo.sender_type_id,
          message: msg.message,
          sent_at: new Date()
        });
        
        console.log(`[DB] Message saved to ticket ${ticketId} from ${socket.data.userId}`);
      } else {
        console.log(`[DB] No active ticket found for room ${msg.room}, message not saved`);
      }
    } catch (error) {
      console.error('[DB] Error saving message:', error);
    }
    
    // Teruskan ke frontend (tidak berubah)
    socket.to(msg.room).emit("chat:new", msg);
  });

  // ---- Typing indicator
  socket.on("typing", ({ room }) => {
    if (!room) return;
    socket.to(room).emit("typing");
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
    
    // Cleanup history cache untuk socket ini
    for (const key of [...historyLoadedRooms]) {
      if (key.endsWith(`-${socket.id}`)) {
        historyLoadedRooms.delete(key);
      }
    }
    
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

// -----------------------------
// Start Server
// -----------------------------
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Integrated Chatbot + Socket.IO Server running on http://0.0.0.0:${PORT}`);
  console.log(`📋 API Tester: http://localhost:${PORT}/`);
  console.log(`💬 Chatbot Interface: http://localhost:${PORT}/chatbot`);
  console.log(`🔌 Socket.IO Test: http://localhost:${PORT}/socket-test`);
  console.log(`🧪 Chat DB Test: http://localhost:${PORT}/chat-db-test`);
  console.log(`📁 Chat History Test: http://localhost:${PORT}/chat-history-test`);
  console.log(`🎨 Chat UI Test: http://localhost:${PORT}/chat-ui-test`);
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
