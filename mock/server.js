// ===== bootstrap env =====
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { HTTP_STATUS } = require('./constants/statusCodes');

// const EnvValidator = require('./config/env_validator');
// EnvValidator.validateAndSetDefaults();
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📁 Config file: .env`);

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

// Security headers (original)
const isProd = process.env.NODE_ENV === 'production';
server.use(helmet({
  contentSecurityPolicy: isProd ? { useDefaults: true } : false,
  crossOriginEmbedderPolicy: false,
}));

// Ngrok bypass middleware
server.use((req, res, next) => {
  res.header('ngrok-skip-browser-warning', 'true');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, ngrok-skip-browser-warning');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(HTTP_STATUS.OK);
  } else {
    next();
  }
});

// CORS (original)
const allowlist = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
server.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    cb(null, allowlist.includes(origin));
  },
  credentials: process.env.CORS_CREDENTIALS === 'true'
}));

// Rate limit (original)
server.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
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

// API Logger middleware (BEFORE all routes)
const apiLogger = require('./middlewares/api_logger');
server.use(apiLogger);

// Swagger - NO AUTH REQUIRED
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./docs/swagger');
server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Health check - NO AUTH REQUIRED
server.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T') + '.000Z'
  });
});

// Setup Socket.IO FIRST
const io = setupSocketIO(httpServer, '*');

// Custom routes FIRST (higher priority)
const createAuthRoutes      = require('./routes/auth');
const { createTicketRoutes, createActivityRoutes, createFeedbackRoutes } = require('./routes/ticket');
const createCustomerRoutes  = require('./routes/customer');
const createReferenceRoutes = require('./routes/reference');
const createSocketRoutes    = require('./routes/socket');
const createAttachmentRoutes = require('./routes/attachment');
const createFAQRoutes       = require('./routes/faq');
server.use('/v1/auth', createAuthRoutes(db));
server.use('/v1/tickets', createTicketRoutes(db));
server.use('/v1/activities', createActivityRoutes(db));
server.use('/v1/feedback', createFeedbackRoutes(db));
server.use('/v1/customers', createCustomerRoutes(db));
server.use('/v1', createReferenceRoutes(db));
server.use('/v1/socket', createSocketRoutes(db, io));
server.use('/v1', createAttachmentRoutes(db));
server.use('/v1/faqs', createFAQRoutes(db));

// Static files middleware
server.use(express.static('public'));

// JSON Server router for OTHER routes only (exclude custom routes)
server.use('/v1', (req, res, next) => {
  const pathname = req.path || req.url || '';
  const customRoutes = ['/auth', '/tickets', '/activities', '/feedback', '/customers', '/socket', '/channels', '/complaint-categories', '/slas', '/uics', '/policies', '/faqs'];
  const isCustomRoute = customRoutes.some(route => pathname.startsWith(route));
  
  if (isCustomRoute) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Route handled by custom controller' });
  }
  
  // Timestamp middleware for json-server routes
  const isWrite = ['POST','PUT','PATCH'].includes(req.method);
  if (isWrite) {
    const b = req.body;
    if (b && typeof b === 'object' && !Array.isArray(b)) {
      const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T') + '.000Z';
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
    timestamp: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T') + '.000Z'
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
