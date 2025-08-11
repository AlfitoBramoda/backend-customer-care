const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({ logger: true });

server.use(middlewares);
server.use(jsonServer.bodyParser);

// ✅ LOGIN STUB + VALIDASI (satu-satunya)
server.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !password) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'email dan password wajib diisi' });
  }
  if (!EMAIL_RX.test(String(email))) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'format email tidak valid' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'password minimal 6 karakter' });
  }

  const role = /agent/i.test(email) ? 'agent' : 'customer';
  return res.json({
    access_token: 'dummy.jwt',
    refresh_token: 'dummy.refresh',
    user: { id: 1, role }
  });
});

// GET /customers/:id
server.get('/api/v1/customers/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = router.db.get('customers').find({ customer_id: id }).value();
  if (!row) return res.status(404).json({ code: 'NOT_FOUND', message: 'Customer not found' });
  res.json(row);
});

// GET /agents/:id
server.get('/api/v1/agents/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = router.db.get('agents').find({ agent_id: id }).value();
  if (!row) return res.status(404).json({ code: 'NOT_FOUND', message: 'Agent not found' });
  res.json(row);
});

// GET /teams/:id
server.get('/api/v1/teams/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = router.db.get('teams').find({ team_id: id }).value();
  if (!row) return res.status(404).json({ code: 'NOT_FOUND', message: 'Team not found' });
  res.json(row);
});

server.get('/api/v1/accounts', (req, res, next) => {
  if (!('customer_id' in req.query)) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'customer_id is required' });
  }
  next(); // teruskan ke router json-server untuk filter ?customer_id=
});

// Router generik
server.use('/api/v1', router);

const PORT = process.env.MOCK_PORT || 4010;
server.listen(PORT, () => console.log(`Mock API on http://localhost:${PORT}/api/v1`));
