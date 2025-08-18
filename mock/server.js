// ===== bootstrap env =====
const path = require('path');
const envFile =
  process.env.NODE_ENV === 'production' ? '.env.production' :
  process.env.NODE_ENV === 'staging'    ? '.env.staging'    :
                                          '.env.development';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const EnvValidator = require('./config/env_validator');
EnvValidator.validateAndSetDefaults();
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📁 Config file: ${envFile}`);

// ===== core imports =====
const jsonServer   = require('json-server');
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');
const http         = require('http');
const { setupSocketIO } = require('./socket/realtime');

const server = express();
const httpServer = http.createServer(server);

// Trust proxy (HTTPS redirect & secure cookies)
server.set('trust proxy', 1);

// HTTPS redirect (prod) — PASANG DI AWAL
if (process.env.NODE_ENV === 'production') {
  server.use((req, res, next) => {
    if (req.secure || req.header('x-forwarded-proto') === 'https') return next();
    return res.redirect(301, `https://${req.header('host')}${req.originalUrl}`);
  });
}

// Security headers (satu kali, terpusat)
const isProd = process.env.NODE_ENV === 'production';
server.use(helmet({
  contentSecurityPolicy: isProd ? { useDefaults: true } : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS (allowlist)
const allowlist = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
server.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    cb(null, allowlist.includes(origin));
  },
  credentials: process.env.CORS_CREDENTIALS === 'true'
}));

// Rate limit (global)
server.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
}));

// ===== json-server router & DB =====
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const db = router.db;

// Global body parser
server.use(express.json({ limit: '10mb' }));
server.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger
const { swaggerSpec, swaggerUi } = require('./docs/swagger');
server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Setup Socket.IO FIRST
const io = setupSocketIO(httpServer, allowlist);

// Custom routes FIRST (higher priority)
const createAuthRoutes     = require('./routes/auth');
const createTicketRoutes   = require('./routes/ticket');
const createCustomerRoutes = require('./routes/customer');
const createSocketRoutes   = require('./routes/socket');
server.use('/v1/auth', createAuthRoutes(db));
server.use('/v1/tickets', createTicketRoutes(db));
server.use('/v1/customers', createCustomerRoutes(db));
server.use('/v1/socket', createSocketRoutes(db, io));

// Static files middleware
server.use(express.static('public'));

// JSON Server router for OTHER routes only (exclude auth, tickets, customers, socket)
server.use('/v1', (req, res, next) => {
  const pathname = req.path || req.url || '';
  const isCustomRoute = pathname.startsWith('/auth') || pathname.startsWith('/tickets') || pathname.startsWith('/customers') || pathname.startsWith('/socket');
  
  if (isCustomRoute) {
    return res.status(404).json({ success: false, message: 'Route handled by custom controller' });
  }
  
  // Timestamp middleware for json-server routes
  const isWrite = ['POST','PUT','PATCH'].includes(req.method);
  if (isWrite) {
    const b = req.body;
    if (b && typeof b === 'object' && !Array.isArray(b)) {
      const now = new Date().toISOString();
      if (req.method === 'POST' && b.created_at == null) b.created_at = now;
      b.updated_at = now;
    }
  }
  
  next();
});

// JSON Server router (LAST, for non-custom routes)
server.use('/v1', router);

// Socket.IO status endpoint
server.get('/socket/status', (req, res) => {
  res.json({
    success: true,
    socketIO: 'active',
    connectedClients: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

// Serve test client
server.get('/client-example.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'client-example.html'));
});

// Global error handler (LAST)
const { errorHandler } = require('./middlewares/error_handler');
server.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`B-Care mock API running at http://localhost:${PORT}/v1`);
  console.log(`Socket.IO ready at http://localhost:${PORT}/socket.io`);
  console.log('Resources:', Object.keys(router.db.__wrapped__));
});
