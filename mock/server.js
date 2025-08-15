// mock/server.js — B‑Care json-server (v1 namespace)
const jsonServer = require('json-server');
const express = require('express');
const path = require('path');
const fs = require('fs');

const server = express();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

const createAuthRoutes = require('./routes/auth');
const db = router.db;

// Body parser
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(middlewares);

// Auto timestamps and id sync
server.use((req, res, next) => {
  if (req.method === 'POST') {
    const now = new Date().toISOString();
    if (!req.body.created_at) req.body.created_at = now;
    if (!req.body.created_time) req.body.created_time = now;
    // auto id sync if *_id exists
    const idField = Object.keys(req.body).find(k => /_id$/.test(k));
    if (idField && !req.body[idField] && req.body.id) {
      req.body[idField] = req.body.id;
    }
  }
  if (req.method === 'PUT' || req.method === 'PATCH') {
    if ('updated_at' in req.body) req.body.updated_at = new Date().toISOString();
  }
  next();
});
// Auth
server.use('/v1/auth', createAuthRoutes(db));

// Rewrites
const rewriter = jsonServer.rewriter(require(path.join(__dirname, 'routes.json')));
server.use(rewriter);

// Namespace /v1
server.use('/v1', (req, res, next) => next());
// Mount router
server.use(router);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`B‑Care mock API running at http://localhost:${PORT}/v1`);
  console.log(`Resources:`, Object.keys(router.db.__wrapped__));
});
