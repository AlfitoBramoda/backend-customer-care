const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { PORT, NODE_ENV } = require('./src/config/config');
const { loadSLAData } = require('./src/services/sla-service');
const { setupRoutes } = require('./src/routes/routes');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Database models
const db = require('../../models');
const { Op } = require('sequelize');
const { ticket: Ticket, chat_message: ChatMessage, call_log: CallLog } = db;

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
  console.log(`[DEBUG] Extracting sender info from userId: ${userId}`);
  
  if (!userId) {
    console.log(`[DEBUG] userId is null/undefined`);
    return { sender_id: null, sender_type_id: null };
  }
  
  // Handle different formats
  let prefix, idStr;
  
  if (userId.includes('-')) {
    // Format: CUS-1, EMP-1
    [prefix, idStr] = userId.split('-');
  } else if (userId.startsWith('CUS') || userId.startsWith('EMP')) {
    // Format: CUS00001, EMP00001
    prefix = userId.substring(0, 3);
    idStr = userId.substring(3).replace(/^0+/, '') || '0'; // Remove leading zeros
  } else {
    console.log(`[DEBUG] Unknown userId format: ${userId}`);
    return { sender_id: null, sender_type_id: null };
  }
  
  const senderId = parseInt(idStr);
  const senderTypeId = prefix === 'CUS' ? 1 : 2;
  
  console.log(`[DEBUG] Parsed - prefix: ${prefix}, idStr: ${idStr}, sender_id: ${senderId}, sender_type_id: ${senderTypeId}`);
  
  return {
    sender_id: isNaN(senderId) ? null : senderId,
    sender_type_id: senderTypeId
  };
}

async function findActiveTicket(room) {
  try {
    console.log(`[DEBUG] Processing room: ${room}`);
    
    // Handle different room formats
    if (room.startsWith('call:ticket-')) {
      // Format: call:ticket-84
      const ticketId = parseInt(room.split('-')[1]);
      console.log(`[DEBUG] Call room detected, ticket ID: ${ticketId}`);
      return ticketId;
    }
    
    // Handle dm format: dm:CUS-1:EMP-1
    const parts = room.split(':');
    if (parts.length !== 3 || parts[0] !== 'dm') {
      console.log(`[DEBUG] Invalid room format: ${room}`);
      return null;
    }
    
    const [, userA, userB] = parts;
    const customer = userA.startsWith('CUS') ? userA : userB;
    const employee = userA.startsWith('EMP') ? userA : userB;
    
    if (!customer || !employee) {
      console.log(`[DEBUG] Could not identify customer/employee from room: ${room}`);
      return null;
    }
    
    const customerId = parseInt(customer.split('-')[1]);
    const employeeId = parseInt(employee.split('-')[1]);
    
    console.log(`[DEBUG] Room: ${room}`);
    console.log(`[DEBUG] Parsed - Customer: ${customer} (ID: ${customerId}), Employee: ${employee} (ID: ${employeeId})`);
    
    // Debug: Cek semua ticket untuk customer ini
    const allCustomerTickets = await Ticket.findAll({
      where: { customer_id: customerId },
      order: [['created_time', 'DESC']]
    });
    
    console.log(`[DEBUG] Total tickets for customer ${customerId}: ${allCustomerTickets.length}`);
    allCustomerTickets.forEach(ticket => {
      console.log(`[DEBUG] Ticket ${ticket.ticket_number}: customer_id=${ticket.customer_id}, responsible_employee_id=${ticket.responsible_employee_id}, customer_status_id=${ticket.customer_status_id}`);
    });
    
    // Cek berapa banyak ticket aktif
    const activeTickets = await Ticket.findAll({
      where: {
        customer_id: customerId,
        responsible_employee_id: employeeId,
        customer_status_id: { [Op.in]: [1, 2, 3] }
      },
      order: [['created_time', 'DESC']]
    });

    console.log(`[TICKET] Customer: ${customer} (${customerId}), Employee: ${employee} (${employeeId})`);
    console.log(`[TICKET] Found ${activeTickets.length} active tickets for ${customer} <-> ${employee}`);
    
    if (activeTickets.length === 0) {
      console.log(`[TICKET] No active tickets found for ${customer} <-> ${employee}`);
      console.log(`[DEBUG] Query criteria: customer_id=${customerId}, responsible_employee_id=${employeeId}, customer_status_id IN [1,2,3]`);
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

function splitRoom(room) {
  // Handle call:ticket-X format
  if (room.startsWith('call:ticket-')) {
    return { isTicketRoom: true, ticketId: room.split('-')[1] };
  }
  
  const parts = room.split(':');
  
  if (parts.length !== 3 || parts[0] !== 'dm') {
    return null;
  }
  
  const [, participant1, participant2] = parts;
  
  return {
    participant1,
    participant2,
    customer: participant1.startsWith('CUS-') ? participant1 : participant2,
    employee: participant1.startsWith('EMP-') ? participant1 : participant2
  };
}

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
    
    console.log(`\n=== DM OPEN DEBUG ===`);
    console.log(`[DM] From: ${from}`);
    console.log(`[DM] To: ${toUserId}`);
    console.log(`[DM] Generated room: "${room}"`);
    console.log(`[DM] Room format: ${room.startsWith('dm:') ? 'DM' : 'OTHER'}`);
    console.log(`=== DM OPEN END ===\n`);

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
    
    console.log(`\n=== DM JOIN DEBUG ===`);
    console.log(`[DM] Join room: "${room}"`);
    console.log(`[DM] User: ${socket.data.userId}`);
    console.log(`[DM] Room format: ${room.startsWith('dm:') ? 'DM' : room.startsWith('call:ticket-') ? 'TICKET' : 'OTHER'}`);
    
    socket.join(room);
    emitPresence(room);
    
    const roomMembers = io.sockets.adapter.rooms.get(room);
    console.log(`[DM] Room "${room}" now has ${roomMembers ? roomMembers.size : 0} members`);
    console.log(`=== DM JOIN END ===\n`);
    
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
    
    console.log(`\n=== CHAT SEND DEBUG ===`);
    console.log(`[CHAT] Room: "${msg.room}"`);
    console.log(`[CHAT] Message: "${msg.text}"`);
    console.log(`[CHAT] From: ${socket.data.userId}`);
    console.log(`[CHAT] Room format: ${msg.room.startsWith('dm:') ? 'DM' : msg.room.startsWith('call:ticket-') ? 'TICKET' : 'OTHER'}`);
    
    const roomMembers = io.sockets.adapter.rooms.get(msg.room);
    console.log(`[CHAT] Room "${msg.room}" has ${roomMembers ? roomMembers.size : 0} members`);
    
    try {
      // Cari ticket aktif
      const ticketId = await getActiveTicketFromRoom(msg.room);
      
      if (ticketId) {
        const senderInfo = extractSenderInfo(socket.data.userId);

        console.log("Sender info:", senderInfo);

        const inputMsg = {
          ticket_id: +ticketId,
          sender_id: senderInfo.sender_id,
          sender_type_id: senderInfo.sender_type_id,
          message: msg.text,
          sent_at: new Date()
        }

        console.log("input message:", inputMsg);
        
        // Simpan ke database
        await ChatMessage.create(inputMsg);
        
        console.log(`[DB] Message saved to ticket ${ticketId} from ${socket.data.userId}`);
      } else {
        console.log(`[DB] No active ticket found for room ${msg.room}, message not saved`);
      }
    } catch (error) {
      console.error('[DB] Error saving message:', error);
    }
    
    // Teruskan ke frontend (tidak berubah)
    console.log(`[CHAT] Emitting chat:new to room "${msg.room}"`);
    socket.to(msg.room).emit("chat:new", msg);
    console.log(`=== CHAT SEND END ===\n`);
  });

  // ---- Typing indicator
  socket.on("typing", ({ room }) => {
    if (!room) return;
    socket.to(room).emit("typing");
  });

  // ---- Call features with logging
  socket.on("call:invite", async ({ room }) => {
    if (!room) return;
    
    console.log(`\n=== CALL INVITE DEBUG ===`);
    console.log(`[CALL:UHU] Room received: "${room}"`);
    console.log(`[CALL:UHU] Room type: ${typeof room}`);
    console.log(`[CALL:UHU] Room length: ${room.length}`);
    console.log(`[CALL:UHU] Sender: ${socket.data.userId}`);
    
    // Detect room format
    if (room.startsWith('call:ticket-')) {
      console.log(`[CALL1] ✅ Detected TICKET format: ${room}`);
    } else if (room.startsWith('dm:')) {
      console.log(`[CALL2] ✅ Detected DM format: ${room}`);
    } else {
      console.log(`[CALL3] ❌ Unknown room format: ${room}`);
    }
    
    // Join room if not already joined
    socket.join(room);
    console.log(`[CALL] Socket joined room: ${room}`);
    
    const Room = splitRoom(room);
    console.log(`[CALL] splitRoom result:`, Room);

    try {
      const ticketId = await getActiveTicketFromRoom(room);
      if (ticketId) {
        const senderInfo = extractSenderInfo(socket.data.userId);
        console.log("[DEBUG] Sender info:", senderInfo);

        // Get ticket data to extract customer_id
        const ticket = await Ticket.findByPk(ticketId);
        if (!ticket) {
          console.log(`[DEBUG] Ticket ${ticketId} not found`);
          return;
        }

        const inputCallLog = {
          ticket_id: +ticketId,
          employee_id: senderInfo.sender_type_id === 2 ? senderInfo.sender_id : ticket.responsible_employee_id,
          customer_id: ticket.customer_id,
          call_start: new Date(),
          call_status_type_id: 1
        }

        console.log("[DEBUG] input call log:", inputCallLog);
        
        await CallLog.create(inputCallLog);
        
        console.log(`[CALL] Call started for ticket ${ticketId}`);
      }
    } catch (error) {
      console.error('[CALL] Error logging call start:', error);
    }

    // Check room members before emitting
    const roomMembers = io.sockets.adapter.rooms.get(room);
    console.log(`[CALL] Room "${room}" has ${roomMembers ? roomMembers.size : 0} members`);
    if (roomMembers) {
      console.log(`[CALL] Room members:`, Array.from(roomMembers));
    }
    
    // Emit to all other users in the room
    console.log(`[CALL] Emitting call:ringing to room "${room}"`);
    socket.to(room).emit("call:ringing", { fromUserId: socket.data.userId });
    
    // Also emit call:incoming for better frontend compatibility
    console.log(`[CALL] Emitting call:incoming to room "${room}"`);
    socket.to(room).emit("call:incoming", { fromUserId: socket.data.userId, room });
    
    console.log(`=== CALL INVITE END ===\n`);
  });
  
  socket.on("call:accept", ({ room }) => {
    if (!room) return;

    console.log(`[CALL] Call accepted in room "${room}" by ${socket.data.userId}`);
    console.log(`[CALL] Room format: ${room.startsWith('call:ticket-') ? 'TICKET' : room.startsWith('dm:') ? 'DM' : 'UNKNOWN'}`);
    
    socket.to(room).emit("call:accepted", {});
  });
  
  socket.on("call:decline", ({ room }) => {
    if (!room) return;
    console.log(`[DEBUG] Call declined in room ${room} by ${socket.data.userId}`);
    socket.to(room).emit("call:declined", {});
  });

  socket.on("call:hangup", async ({ room }) => {
    if (!room) return;

    console.log(`[DEBUG] Call hangup in room ${room} by ${socket.data.userId}`);
    
    try {
      const ticketId = await getActiveTicketFromRoom(room);
      if (ticketId) {
        await CallLog.update(
          { 
            call_end: new Date(),
            call_status_type_id: 2
          },
          { 
            where: { 
              ticket_id: +ticketId,
              call_end: null
            },
            order: [['call_start', 'DESC']]
          }
        );
        
        console.log(`[CALL] Call ended for ticket ${ticketId}`);
      }
    } catch (error) {
      console.error('[CALL] Error logging call end:', error);
    }
    
    socket.to(room).emit("call:ended", {});
  });

  socket.on("call:frame", ({ room, data }) => {
    if (!room || !data) return;
    console.log(`[DEBUG] Call frame in room ${room} by ${socket.data.userId}, data size: ${data.length}`);
    socket.to(room).emit("call:frame", { data });
  });

    // ---- WebRTC Signaling Events
  socket.on("webrtc:offer", ({ room, offer, audioOnly }) => {
    if (!room || !offer) {
      console.log(`[webrtc] offer rejected - missing data from ${socket.data.userId}`);
      return;
    }
    console.log(`[webrtc] offer from ${socket.data.userId} in ${room} (audio-only: ${!!audioOnly})`);
    socket.to(room).emit("webrtc:offer", {
      offer,
      room,
      audioOnly,
      fromUserId: socket.data.userId,
    });
  });

  socket.on("webrtc:answer", ({ room, answer }) => {
    if (!room || !answer) {
      console.log(`[webrtc] answer rejected - missing data from ${socket.data.userId}`);
      return;
    }
    console.log(`[webrtc] answer from ${socket.data.userId} in ${room}`);
    socket.to(room).emit("webrtc:answer", {
      answer,
      fromUserId: socket.data.userId,
      room
    });
  });

  socket.on("webrtc:ice-candidate", ({ room, candidate }) => {
    if (!room || !candidate) {
      console.log(`[webrtc] ice-candidate rejected - missing data from ${socket.data.userId}`);
      return;
    }
    console.log(`[webrtc] ice-candidate from ${socket.data.userId} in ${room}`);
    socket.to(room).emit("webrtc:ice-candidate", {
      candidate,
      fromUserId: socket.data.userId,
      room
    });
  });

  socket.on("webrtc:end-call", ({ room }) => {
    if (!room) {
      console.log(`[webrtc] end-call rejected - no room from ${socket.data.userId}`);
      return;
    }
    console.log(`[webrtc] end-call from ${socket.data.userId} in ${room}`);
    socket.to(room).emit("webrtc:end-call", {
      fromUserId: socket.data.userId,
      room
    });
  });

  // ---- WebRTC Media Controls
  socket.on("webrtc:audio-toggle", ({ room, enabled }) => {
    if (!room) return;
    console.log(`[webrtc] audio ${enabled ? "enabled" : "disabled"} from ${socket.data.userId}`);
    socket.to(room).emit("webrtc:audio-toggle", {
      fromUserId: socket.data.userId,
      enabled,
      room
    });
  });

  socket.on("webrtc:video-toggle", ({ room, enabled }) => {
    if (!room) return;
    console.log(`[webrtc] video ${enabled ? "enabled" : "disabled"} from ${socket.data.userId}`);
    socket.to(room).emit("webrtc:video-toggle", {
      fromUserId: socket.data.userId,
      enabled,
      room
    });
  });

  socket.on("webrtc:speaker-toggle", ({ room, enabled }) => {
    if (!room) return;
    console.log(`[webrtc] speaker ${enabled ? "enabled" : "disabled"} from ${socket.data.userId}`);
    socket.to(room).emit("webrtc:speaker-toggle", {
      fromUserId: socket.data.userId,
      enabled,
      room
    });
  });

  socket.on("webrtc:test", ({ room }) => {
    if (!room) return;
    const total = peersIn(room).length;
    console.log(`[webrtc] test from ${socket.data.userId} in ${room} - ${total} total peers`);
    socket.emit("webrtc:test:response", {
      success: true,
      peersInRoom: total,
      room,
      webrtcSupported: true,
    });
  });

  // ---- Audio streaming handlers
  socket.on("audio:chunk", ({ room, data }) => {
    if (!room) return;
    console.log(`[DEBUG] Audio chunk in room ${room} by ${socket.data.userId}, data size: ${data.length}`);
    socket.to(room).emit("audio:chunk", { data, timestamp: Date.now() });
  });
  
  socket.on("audio:start", ({ room }) => {
    if (!room) return;
    console.log(`[DEBUG] Audio started in room ${room} by ${socket.data.userId}`);
    socket.to(room).emit("audio:started", { fromUserId: socket.data.userId });
  });
  
  socket.on("audio:stop", ({ room }) => {
    if (!room) return;
    console.log(`[DEBUG] Audio stopped in room ${room} by ${socket.data.userId}`);
    socket.to(room).emit("audio:stopped", { fromUserId: socket.data.userId });
  });

  // ---- Join/leave generic (kalau dipakai)
  socket.on("join", ({ room, userId }) => {
    if (!room) return;
    
    console.log(`\n=== GENERIC JOIN DEBUG ===`);
    console.log(`[JOIN] Room: "${room}"`);
    console.log(`[JOIN] UserId: ${userId}`);
    console.log(`[JOIN] Socket: ${socket.id}`);
    console.log(`[JOIN] Room format: ${room.startsWith('dm:') ? 'DM' : room.startsWith('call:ticket-') ? 'TICKET' : 'OTHER'}`);
    
    socket.join(room);
    if (userId) socket.data.userId = userId;
    emitPresence(room);
    
    const roomMembers = io.sockets.adapter.rooms.get(room);
    console.log(`[JOIN] Room "${room}" now has ${roomMembers ? roomMembers.size : 0} members`);
    console.log(`=== GENERIC JOIN END ===\n`);
  });

  socket.on("leave", ({ room }) => {
    if (!room) return;
    console.log(`[DEBUG] Socket ${socket.id} leaving room ${room}`);
    socket.leave(room);
    emitPresence(room);
  });

  socket.on("disconnect", (reason) => {
    const uid = socket.data.userId;
    console.log(`[DEBUG] Socket disconnected: ${socket.id}, reason: ${reason}, userId: ${uid}`);
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
