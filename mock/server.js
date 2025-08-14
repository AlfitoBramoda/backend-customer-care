const jsonServer = require('json-server');
const path = require('path');
const cors = require('cors');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({ static: 'public' });

server.use(middlewares);
server.use(jsonServer.bodyParser);
server.use(cors());

// ---------- HARDENING for Postman contract (no more 404) ----------

// Agents: support both /agent and /agents + filter ?team_id=
server.get(['/agent', '/agents'], (req, res) => {
  const { team_id } = req.query || {};
  let rows = router.db.get('agent').value() || [];
  if (team_id != null && team_id !== '') {
    rows = rows.filter(a => String(a.team_id) === String(team_id));
  }
  return res.jsonp(rows); // always 200, array (possibly empty)
});

// Accounts: support both /account and /accounts + filter ?customer_id=
server.get(['/account', '/accounts'], (req, res) => {
  const { customer_id } = req.query || {};
  let rows = router.db.get('account').value() || [];
  if (customer_id != null && customer_id !== '') {
    rows = rows.filter(a => String(a.customer_id) === String(customer_id));
  }
  return res.jsonp(rows);
});

// Notifications: list with filters ?user_type=&user_id=&is_read=
server.get(['/notification', '/notifications'], (req, res) => {
  const { user_type, user_id, is_read } = req.query || {};
  let rows = router.db.get('notification').value() || [];

  if (user_type) rows = rows.filter(n => String(n.user_type) === String(user_type));
  if (user_id != null && user_id !== '') rows = rows.filter(n => String(n.user_id) === String(user_id));
  if (typeof is_read !== 'undefined' && is_read !== '') {
    const flag = String(is_read).toLowerCase();
    if (flag === 'true' || flag === 'false') {
      rows = rows.filter(n => String(Boolean(n.is_read)) === flag);
    }
  }
  return res.jsonp(rows);
});

// Notifications: robust bulk mark-read — 200 even if body empty/various formats
server.post('/notifications/mark-read', (req, res) => {
  const db = router.db;
  const coerce = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'number') return [v];
    if (typeof v === 'string') {
      try { return coerce(JSON.parse(v)); }
      catch { return v.split(',').map(s => s.trim()).filter(Boolean); }
    }
    if (typeof v === 'object') {
      if (Array.isArray(v.ids)) return v.ids;
      if (typeof v.id !== 'undefined') return [v.id];
    }
    return [];
  };

  let ids = coerce(req.body) || coerce(req.body?.ids);
  if (!ids.length && req.query?.ids) ids = coerce(req.query.ids);
  ids = ids.map(Number).filter(Number.isFinite);

  if (!ids.length) return res.jsonp({ updated: [], count: 0 });

  ids.forEach(id => db.get('notification').find({ notification_id: id }).assign({ is_read: true }).write());
  const updated = db.get('notification').filter(n => ids.includes(n.notification_id)).value();
  return res.jsonp({ updated, count: updated.length });
});

// Chatbot session by ID: support /chatbot/sessions/:id (PK = session_id)
server.get(['/chatbot/sessions/:id', '/chatbot_session/:id'], (req, res) => {
  const id = Number(req.params.id);
  const row = router.db.get('chatbot_session').find({ session_id: id }).value();
  if (!row) return res.status(404).jsonp({ error: 'Chatbot session not found' });
  return res.jsonp(row);
});

// Chatbot messages: support /chatbot/messages?session_id= and plain /chatbot_message
server.get(['/chatbot/messages', '/chatbot_message'], (req, res) => {
  const { session_id } = req.query || {};
  let rows = router.db.get('chatbot_message').value() || [];
  if (session_id != null && session_id !== '') {
    rows = rows.filter(m => String(m.session_id) === String(session_id));
  }
  rows.sort((a, b) => String(a.sent_at || '').localeCompare(String(b.sent_at || '')));
  return res.jsonp(rows);
});


// ===== Normalizer (defensive): plural → singular, chatbot paths, dll. =====
server.use((req, _res, next) => {
  // Skip special endpoints so we don't break them
  if (req.url.startsWith('/attachments/pre-sign')) return next();
  if (req.url.startsWith('/notifications/mark-read')) return next();

  const rules = [
    [/^\/customers(\/|$)/, '/customer$1'],
    [/^\/agents(\/|$)/, '/agent$1'],
    [/^\/teams(\/|$)/, '/team$1'],
    [/^\/accounts(\/|$)/, '/account$1'],
    [/^\/complaint-categories(\/|$)/, '/complaint_category$1'],
    [/^\/notifications(\/|$)/, '/notification$1'],
    [/^\/chat-messages(\/|$)/, '/chat_message$1'],
    [/^\/call-logs(\/|$)/, '/call_log$1'],
    [/^\/chatbot\/sessions(\/|$)/, '/chatbot_session$1'],
    [/^\/chatbot\/messages(\/|$)/, '/chatbot_message$1'],
    [/^\/faqs(\/|$)/, '/faq$1'],
    [/^\/faq-logs(\/|$)/, '/faq_log$1'],
  ];
  for (const [re, to] of rules) req.url = req.url.replace(re, (_m, g1) => to.replace('$1', g1 || ''));
  next();
});

// --- Rewrites (tetap aktif; normalizer di atas jadi safety net) ---
const rewriter = jsonServer.rewriter(require('./routes.json'));
server.use(rewriter);

// --- Helpers ---
const db = router.db;

const PK = {
  customer: 'customer_id',
  account: 'account_id',
  agent: 'agent_id',
  team: 'team_id',
  sla: 'sla_id',
  channel: 'channel_id',
  uic: 'uic_id',
  complaint_category: 'complaint_id',
  faq: 'faq_id',
  faq_log: 'log_id',
  ticket: 'ticket_id',
  ticket_activity: 'activity_id',
  attachment: 'attachment_id',
  feedback: 'feedback_id',
  notification: 'notification_id',
  chat_message: 'chat_id',
  call_log: 'call_id',
  chatbot_session: 'session_id',
  chatbot_message: 'message_id'
};

function nextPk(collection, field) {
  const arr = db.get(collection).value() || [];
  const max = arr.reduce((m, o) => Math.max(m, Number(o?.[field] || 0)), 0);
  return max + 1;
}
const pad = (n, w) => String(n).padStart(w, '0');

function makeTicketNumber(now = new Date()) {
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1, 2);
  const d = pad(now.getDate(), 2);
  const prefix = `TCK-${y}${m}${d}-`;
  const todays = db.get('ticket').filter(t => (t.ticket_number || '').startsWith(prefix)).value();
  const seq = todays.length + 1;
  return `${prefix}${pad(seq, 4)}`;
}

function addHoursISO(isoString, hours) {
  const base = isoString ? new Date(isoString) : new Date();
  return new Date(base.getTime() + hours * 3600 * 1000).toISOString();
}

function enrichTicket(t) {
  if (!t) return null;
  const customer = db.get('customer').find({ customer_id: t.customer_id }).value() || null;
  const related_account = db.get('account').find({ account_id: t.related_account_id }).value() || null;
  const complaint = db.get('complaint_category').find({ complaint_id: t.complaint_id }).value() || null;
  const faq = t.faq_id ? db.get('faq').find({ faq_id: t.faq_id }).value() : null;
  const agent = db.get('agent').find({ agent_id: t.responsible_agent_id }).value() || null;
  const team = db.get('team').find({ team_id: t.responsible_team_id }).value() || null;
  const sla = db.get('sla').find({ sla_id: t.sla_id }).value() || null;

  const activities = db.get('ticket_activity')
    .filter({ ticket_id: t.ticket_id }).sortBy('activity_time').value()
    .map(a => ({ ...a, attachments: db.get('attachment').filter({ activity_id: a.activity_id }).value() }));

  const chats = db.get('chat_message').filter({ ticket_id: t.ticket_id }).sortBy('sent_at').value();
  const calls = db.get('call_log').filter({ ticket_id: t.ticket_id }).sortBy('call_start').value();
  const feedback = db.get('feedback').find({ ticket_id: t.ticket_id }).value() || null;
  const notifications = db.get('notification').filter({ ticket_id: t.ticket_id }).sortBy('created_at').value();

  return { ...t, customer, related_account, complaint, faq, agent, team, sla, activities, chats, calls, feedback, notifications };
}

// =====================================================
// BE1 — Identity & Meta
// =====================================================

server.post('/auth/login', (req, res) => {
  try {
    const { email, user_type } = req.body || {};
    let principal = null;
    let type = user_type;

    if (!type && email) {
      const ag = db.get('agent').find({ email }).value();
      const cu = db.get('customer').find({ email }).value();
      if (ag) { principal = ag; type = 'agent'; }
      else if (cu) { principal = cu; type = 'customer'; }
    }
    if (!type) type = 'customer';

    const role = type === 'agent' ? (principal?.role || 'Frontline') : 'customer';
    const token = Buffer.from(`mock.${type}.${email || 'user'}`).toString('base64');

    res.jsonp({
      access_token: `dummy.${token}.token`,
      token_type: 'Bearer',
      expires_in: 3600,
      user: {
        type,
        role,
        email: email || null,
        id: type === 'agent' ? principal?.agent_id : principal?.customer_id
      }
    });
  } catch (e) {
    res.status(500).jsonp({ error: 'login_failed', detail: String(e) });
  }
});

server.get('/health', (_req, res) => res.jsonp({ ok: true }));

server.get('/meta/enums', (_req, res) => {
  res.jsonp({
    account_type: ['Tabungan', 'Giro', 'Kartu Kredit', 'Lainnya'],
    customer_status: ['Baru', 'Diproses', 'Selesai'],
    agent_status: ['Baru', 'Dikerjakan', 'Menunggu Respon Customer', 'Selesai', 'Ditutup', 'Reopen'],
    source_channel: ['ATM', 'Deposito', 'Kartu Debit', 'Form', 'Chat', 'Call', 'WhatsApp'],
    agent_roles: ['Frontline', 'Back Office', 'Manajer', 'QA'],
    ticket_activity_type: ['Komentar', 'Perubahan Status', 'Penugasan', 'Attachment', 'Call', 'Chat'],
    sender_type: ['agent', 'customer', 'sistem', 'chatbot'],
    notification_type: ['status_change', 'sla_warning', 'sla_breached'],
    user_type: ['agent', 'customer'],
    chatbot_session_status: ['ongoing', 'completed', 'converted_to_ticket', 'resolved_by_faq']
  });
});

// ===== GET by ID (PK custom) =====
const pickById = (collection, pk, raw) =>
  db.get(collection).find({ [pk]: Number(raw) }).value();

server.get('/customer/:id', (req, res) => {
  const row = pickById('customer', 'customer_id', req.params.id);
  if (!row) return res.status(404).jsonp({ error: 'Customer not found' });
  res.jsonp(row);
});
server.get('/agent/:id', (req, res) => {
  const row = pickById('agent', 'agent_id', req.params.id);
  if (!row) return res.status(404).jsonp({ error: 'Agent not found' });
  res.jsonp(row);
});
server.get('/team/:id', (req, res) => {
  const row = pickById('team', 'team_id', req.params.id);
  if (!row) return res.status(404).jsonp({ error: 'Team not found' });
  res.jsonp(row);
});
server.get('/complaint_category/:id', (req, res) => {
  const row = pickById('complaint_category', 'complaint_id', req.params.id);
  if (!row) return res.status(404).jsonp({ error: 'Complaint category not found' });
  res.jsonp(row);
});
server.get('/notification/:id', (req, res) => {
  const row = pickById('notification', 'notification_id', req.params.id);
  if (!row) return res.status(404).jsonp({ error: 'Notification not found' });
  res.jsonp(row);
});

// ===== List with filters (avoid 404, 200 even if empty) =====
server.get('/agent', (req, res) => {
  const { team_id } = req.query || {};
  let rows = db.get('agent').value();
  if (team_id) rows = rows.filter(a => String(a.team_id) === String(team_id));
  res.jsonp(rows);
});
server.get('/account', (req, res) => {
  const { customer_id } = req.query || {};
  let rows = db.get('account').value();
  if (customer_id) rows = rows.filter(a => String(a.customer_id) === String(customer_id));
  res.jsonp(rows);
});

// =====================================================
// BE2 — Ticketing & Workflow
// =====================================================
server.post(['/ticket', '/tickets'], (req, res) => {
  try {
    const body = req.body || {};
    const nowIso = new Date().toISOString();

    if (!body.ticket_id) body.ticket_id = nextPk('ticket', 'ticket_id');
    if (!body.created_time) body.created_time = nowIso;
    if (!body.ticket_number) body.ticket_number = makeTicketNumber(new Date(body.created_time));
    body.customer_status = body.customer_status || 'Baru';
    body.agent_status = body.agent_status || 'Baru';

    if (!body.sla_id && body.complaint_id) {
      const comp = db.get('complaint_category').find({ complaint_id: body.complaint_id }).value();
      if (comp?.sla_id) body.sla_id = comp.sla_id;
    }
    if (!body.target_sla && body.sla_id) {
      const sla = db.get('sla').find({ sla_id: body.sla_id }).value();
      if (sla?.time_resolution != null) body.target_sla = addHoursISO(body.created_time, Number(sla.time_resolution));
    }

    db.get('ticket').push(body).write();
    res.status(201).jsonp(body);
  } catch (e) {
    res.status(500).jsonp({ error: 'Failed to create ticket', detail: String(e) });
  }
});

server.get('/tickets', (req, res) => {
  const { customer_id, agent_id, status, complaint_id, date_from, date_to } = req.query || {};
  let data = db.get('ticket').value();

  if (customer_id) data = data.filter(t => String(t.customer_id) === String(customer_id));
  if (agent_id) data = data.filter(t => String(t.responsible_agent_id) === String(agent_id));
  if (status) data = data.filter(t => String(t.agent_status) === String(status));
  if (complaint_id) data = data.filter(t => String(t.complaint_id) === String(complaint_id));

  const from = date_from ? new Date(date_from) : null;
  const to = date_to ? new Date(date_to) : null;
  if (from) data = data.filter(t => new Date(t.created_time) >= from);
  if (to) data = data.filter(t => new Date(t.created_time) <= to);

  res.jsonp(data);
});

server.get(['/ticket/:id', '/tickets/:id'], (req, res, next) => {
  const id = Number(req.params.id);
  const t = db.get('ticket').find({ ticket_id: id }).value();
  if (!t) return next();
  res.jsonp(enrichTicket(t));
});

server.get(['/ticket/:id/activities', '/tickets/:id/activities'], (req, res) => {
  const id = Number(req.params.id);
  const data = db.get('ticket_activity').filter({ ticket_id: id }).sortBy('activity_time').value();
  res.jsonp(data);
});
server.post(['/ticket/:id/activities', '/tickets/:id/activities'], (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const activity = {
    activity_id: nextPk('ticket_activity', 'activity_id'),
    ticket_id: id,
    sender_id: body.sender_id || 0,
    sender_type: body.sender_type || 'agent',
    activity_type: body.activity_type || 'Komentar',
    content: body.content || '',
    attachment_id: body.attachment_id ?? null,
    activity_time: body.activity_time || new Date().toISOString()
  };
  db.get('ticket_activity').push(activity).write();
  res.status(201).jsonp(activity);
});

server.patch(['/ticket/:id/status', '/tickets/:id/status'], (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body || {};
  const ticket = db.get('ticket').find({ ticket_id: id }).value();
  if (!ticket) return res.status(404).jsonp({ error: 'Ticket not found' });

  const updates = {};
  if (payload.agent_status) updates.agent_status = payload.agent_status;
  if (payload.customer_status) updates.customer_status = payload.customer_status;
  if (!Object.keys(updates).length) return res.status(400).jsonp({ error: 'No status fields provided' });

  db.get('ticket').find({ ticket_id: id }).assign(updates).write();

  const activity = {
    activity_id: nextPk('ticket_activity', 'activity_id'),
    ticket_id: id,
    sender_id: payload.actor_id || 0,
    sender_type: payload.actor_type || 'agent',
    activity_type: 'Perubahan Status',
    content: `Status updated: ${payload.agent_status ? `agent_status -> ${payload.agent_status}` : ''}${payload.agent_status && payload.customer_status ? ' ; ' : ''}${payload.customer_status ? `customer_status -> ${payload.customer_status}` : ''}`,
    attachment_id: null,
    activity_time: new Date().toISOString()
  };
  db.get('ticket_activity').push(activity).write();

  const updated = db.get('ticket').find({ ticket_id: id }).value();
  res.jsonp({ ticket: updated, activity });
});

server.get(['/ticket/:id/full', '/tickets/:id/full'], (req, res) => {
  const id = Number(req.params.id);
  const ticket = db.get('ticket').find({ ticket_id: id }).value();
  if (!ticket) return res.status(404).jsonp({ error: 'Ticket not found' });
  res.jsonp(enrichTicket(ticket));
});
server.get(['/ticket/:id/timeline', '/tickets/:id/timeline'], (req, res) => {
  const id = Number(req.params.id);
  const ticket = db.get('ticket').find({ ticket_id: id }).value();
  if (!ticket) return res.status(404).jsonp({ error: 'Ticket not found' });

  const activities = db.get('ticket_activity').filter({ ticket_id: id }).value()
    .map(x => ({ type: 'activity', at: x.activity_time, payload: x }));
  const chats = db.get('chat_message').filter({ ticket_id: id }).value()
    .map(x => ({ type: 'chat', at: x.sent_at, payload: x }));
  const calls = db.get('call_log').filter({ ticket_id: id }).value()
    .map(x => ({ type: 'call', at: x.call_start, payload: x }));

  const events = activities.concat(chats, calls).sort((a, b) => String(a.at).localeCompare(String(b.at)));
  res.jsonp({ ticket_id: id, events });
});

server.get(['/tickets/open', '/ticket/open'], (_req, res) => {
  const data = db.get('ticket').filter(t => t.agent_status !== 'Ditutup' && t.agent_status !== 'Selesai').value();
  res.jsonp(data);
});
server.get(['/tickets/closed', '/ticket/closed'], (_req, res) => {
  const data = db.get('ticket').filter(t => t.agent_status === 'Ditutup' || t.agent_status === 'Selesai').value();
  res.jsonp(data);
});

// =====================================================
// BE2 — Attachments & Feedback
// =====================================================
server.post('/attachments/pre-sign', (_req, res) => {
  const id = Date.now();
  res.jsonp({ upload_url: `https://mock-storage.local/uploads/${id}`, expires_in: 300, fields: {} });
});
server.get('/feedback/:ticket_id', (req, res) => {
  const id = Number(req.params.ticket_id);
  const fb = db.get('feedback').find({ ticket_id: id }).value();
  if (!fb) return res.status(404).jsonp({ error: 'Feedback not found' });
  res.jsonp(fb);
});

// =====================================================
// BE3 — FAQ, Notifications, Interactions
// =====================================================
server.get('/faqs', (req, res) => {
  const { complaint_id, q, page = 1, page_size = 10 } = req.query || {};
  let data = db.get('faq').value();

  if (complaint_id) data = data.filter(f => String(f.complaint_id) === String(complaint_id));
  if (q) {
    const k = String(q).toLowerCase();
    data = data.filter(f =>
      (f.question || '').toLowerCase().includes(k) ||
      (f.answer || '').toLowerCase().includes(k) ||
      (f.keywords || '').toLowerCase().includes(k)
    );
  }

  const p = Math.max(1, Number(page));
  const ps = Math.max(1, Number(page_size));
  const start = (p - 1) * ps;
  res.jsonp({ total: data.length, page: p, page_size: ps, items: data.slice(start, start + ps) });
});

server.post('/tickets/:id/link-faq', (req, res) => {
  const id = Number(req.params.id);
  const { faq_id, actor_id = 0, actor_type = 'agent' } = req.body || {};
  const ticket = db.get('ticket').find({ ticket_id: id }).value();
  if (!ticket) return res.status(404).jsonp({ error: 'Ticket not found' });

  db.get('ticket').find({ ticket_id: id }).assign({ faq_id: Number(faq_id) || null }).write();

  const activity = {
    activity_id: nextPk('ticket_activity', 'activity_id'),
    ticket_id: id,
    sender_id: actor_id,
    sender_type: actor_type,
    activity_type: 'Penugasan',
    content: `FAQ linked: ${faq_id}`,
    attachment_id: null,
    activity_time: new Date().toISOString()
  };
  db.get('ticket_activity').push(activity).write();

  res.jsonp({ ok: true, ticket_id: id, faq_id: Number(faq_id) || null, activity });
});

// Notifications
server.patch('/notifications/:id', (req, res) => {
  const id = Number(req.params.id);
  const item = db.get('notification').find({ notification_id: id }).value();
  if (!item) return res.status(404).jsonp({ error: 'Notification not found' });
  const is_read = !!req.body?.is_read;
  db.get('notification').find({ notification_id: id }).assign({ is_read }).write();
  res.jsonp(db.get('notification').find({ notification_id: id }).value());
});

// Robust bulk mark-read — returns 200 even if no ids (count=0)
server.post('/notifications/mark-read', (req, res) => {
  function coerceIds(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'number') return [input];
    if (typeof input === 'string') {
      try { return coerceIds(JSON.parse(input)); }
      catch { return input.split(',').map(s => s.trim()).filter(Boolean); }
    }
    if (typeof input === 'object') {
      if (Array.isArray(input.ids)) return input.ids;
      if (typeof input.ids === 'string') return coerceIds(input.ids);
      if (typeof input.id !== 'undefined') return [input.id];
    }
    return [];
  }
  let ids = coerceIds(req.body) || coerceIds(req.body?.ids);
  if (!ids.length && req.query?.ids) ids = coerceIds(req.query.ids);
  ids = (ids || []).map(Number).filter(Number.isFinite);

  // If still empty, return idempotent success
  if (!ids.length) return res.jsonp({ updated: [], count: 0 });

  ids.forEach(id => db.get('notification').find({ notification_id: id }).assign({ is_read: true }).write());
  const updated = db.get('notification').filter(n => ids.includes(n.notification_id)).value();
  res.jsonp({ updated, count: updated.length });
});

// Chat
server.get('/chat-messages', (req, res) => {
  const { ticket_id, since } = req.query || {};
  let data = db.get('chat_message').value();
  if (ticket_id) data = data.filter(m => String(m.ticket_id) === String(ticket_id));
  if (since) {
    const t = new Date(since).getTime();
    if (!isNaN(t)) data = data.filter(m => new Date(m.sent_at).getTime() > t);
  }
  res.jsonp(data.sort((a, b) => String(a.sent_at).localeCompare(String(b.sent_at))));
});
server.post('/chat-messages', (req, res) => {
  const body = req.body || {};
  const payload = {
    chat_id: nextPk('chat_message', 'chat_id'),
    ticket_id: Number(body.ticket_id),
    sender_id: Number(body.sender_id) || 0,
    sender_type: body.sender_type || 'customer',
    message: String(body.message || ''),
    sent_at: body.sent_at || new Date().toISOString()
  };
  db.get('chat_message').push(payload).write();
  res.status(201).jsonp(payload);
});

// Call
server.get('/call-logs', (req, res) => {
  const { ticket_id } = req.query || {};
  let data = db.get('call_log').value();
  if (ticket_id) data = data.filter(c => String(c.ticket_id) === String(ticket_id));
  res.jsonp(data.sort((a, b) => String(a.call_start).localeCompare(String(b.call_start))));
});
server.post('/call-logs', (req, res) => {
  const body = req.body || {};
  const payload = {
    call_id: nextPk('call_log', 'call_id'),
    ticket_id: Number(body.ticket_id),
    agent_id: Number(body.agent_id) || null,
    customer_id: Number(body.customer_id) || null,
    call_start: body.call_start || new Date().toISOString(),
    call_end: body.call_end || null,
    status: body.status || 'connected'
  };
  db.get('call_log').push(payload).write();
  res.status(201).jsonp(payload);
});

// =====================================================
// Generic CREATE (kecuali ticket) — auto PK
// =====================================================
server.post('/:resource', (req, res, next) => {
  const resource = req.params.resource;
  if (resource === 'ticket') return next();
  if (!PK[resource]) return next();

  const pkField = PK[resource];
  const obj = (typeof req.body === 'object' && req.body) ? req.body : {};
  if (obj[pkField] == null) obj[pkField] = nextPk(resource, pkField);

  db.get(resource).push(obj).write();
  res.status(201).jsonp(obj);
});

// PATCH /notifications/:id  — mark a single notification as read (or partial update)
server.patch(['/notifications/:id', '/notification/:id'], (req, res) => {
  const id = Number(req.params.id);
  const db = router.db;

  const row = db.get('notification').find({ notification_id: id }).value();
  if (!row) return res.status(404).jsonp({ error: 'Notification not found' });

  const payload = req.body || {};
  // default behavior: mark as read if no body provided
  const patch = {
    ...(typeof payload.is_read !== 'undefined' ? { is_read: !!payload.is_read } : { is_read: true }),
    ...(payload.message !== undefined ? { message: payload.message } : {}),
    ...(payload.notification_type !== undefined ? { notification_type: payload.notification_type } : {})
  };

  db.get('notification').find({ notification_id: id }).assign(patch).write();
  const updated = db.get('notification').find({ notification_id: id }).value();
  return res.jsonp(updated);
});


// Default router (CRUD)
server.use(router);

// Boot
const PORT = process.env.PORT || 6969;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock API running at http://0.0.0.0:${PORT}`);
  console.log(`Access from network: http://[your-ip]:${PORT}`);
});