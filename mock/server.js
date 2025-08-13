// mock/server.js — v3.3.6
// All-in: full routes restored, Stable IDs (id === <pk>), idempotent DELETE (204), GET-fallback ([]),
// and startup bootstrap (agents/customers/masters + sample policy) so Postman runs clean OOTB.

const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({ logger: true, static: path.join(__dirname, 'public') });
const rewriter = jsonServer.rewriter(require(path.join(__dirname, 'routes.json')));

// ========= Utilities =========
function nowIso() { return new Date().toISOString(); }
function nextId(list, key) { return (list.reduce((m,x)=>Math.max(m, x[key]||x.id||0), 0) || 0) + 1; }
function byCode(list, key, code) { return (list||[]).find(x => String(x[key]).toUpperCase() === String(code||'').toUpperCase()); }
function toNum(v){ const n=Number(v); return Number.isFinite(n)?n:undefined; }

// Slug mapping & primary keys
const slugToCol = {
  'complaint-categories':'complaint_categories',
  'faqs':'faqs', 'faq-logs':'faq_logs', 'chatbot':'chatbot', 'chat-messages':'chat_messages',
  'call-logs':'call_logs', 'ticket-transactions':'ticket_transactions',
  'ticket-activities':'ticket_activities', 'ticket-uic-escalations':'ticket_uic_escalations',
  'uic':'uic'
};
const pkMap = {
  customers:'customer_id', accounts:'account_id', cards:'card_id', agents:'agent_id',
  channels:'channel_id', sources:'source_id', services:'service_id', priorities:'priority_id',
  uic:'uic_id', complaint_categories:'complaint_id', slas:'sla_id', complaint_policies:'policy_id',
  faqs:'faq_id', chatbot_sessions:'session_id', faq_logs:'log_id', chatbot_messages:'message_id',
  terminals:'terminal_id', ticket_transactions:'ticket_txn_id', tickets:'ticket_id',
  ticket_activities:'activity_id', attachments:'attachment_id', ticket_uic_escalations:'escalation_id',
  feedback:'feedback_id', notifications:'notification_id', chat_messages:'chat_id', call_logs:'call_id'
};

// ========= 0) Normalize DB at startup (id === <pk>) =========
(function normalizeDb(){
  const state = router.db.getState();
  let changed = false;
  Object.entries(pkMap).forEach(([col, pk]) => {
    if (!Array.isArray(state[col])) return;
    state[col].forEach((row, idx) => {
      if (row.id == null) { row.id = (typeof row[pk] === 'number') ? row[pk] : (idx + 1); changed = true; }
      if (row[pk] == null) { row[pk] = row.id; changed = true; }
      if (row.id !== row[pk]) { row.id = row[pk] = Number(row[pk] || row.id); changed = true; }
    });
  });
  if (changed) { router.db.setState(state); if (router.db.write) router.db.write(); }
})();

// ========= 0.1) Bootstrap minimal defaults (so login & resolver work OOTB) =========
(function bootstrapDefaults(){
  const db = router.db; const state = db.getState();
  const ensureCol = (name)=>{ if(!Array.isArray(state[name])) state[name]=[]; };
  const upsertBy = (col, key, sample)=>{
    ensureCol(col);
    const list = state[col];
    const hit = list.find(x => String(x[key]).toUpperCase() === String(sample[key]).toUpperCase());
    if (hit) return hit;
    const pk = pkMap[col] || 'id'; const id = nextId(list, pk);
    const row = { ...sample, [pk]: sample[pk] ?? id, id: sample.id ?? (sample[pk] ?? id) };
    list.push(row); return row;
  };

  upsertBy('agents', 'npp', { agent_id:1, id:1, npp:'12345678', full_name:'Agent One', email:'agent1@bank.test', password_hash:'Agent@123', role:'Frontline', is_active:true, created_at:nowIso() });
  upsertBy('agents', 'npp', { agent_id:2, id:2, npp:'87654321', full_name:'Agent Two', email:'agent2@bank.test', password_hash:'Agent@456', role:'Back Office', is_active:true, created_at:nowIso() });

  upsertBy('customers','email', { customer_id:1, id:1, full_name:'Jane Doe', email:'jane.doe@customer.test', password_hash:'Customer@123',
    address:'Jl. Sudirman 1', billing_address:'Jl. Sudirman 1', postal_code:'10220', phone_number:'081234567890', home_phone:'021123456',
    office_phone:null, fax_phone:null, cif:'CIF0001', nik:'3173xxxxxxxxxxxx', gender:'Female', place_of_birth:'Jakarta', created_at:nowIso() });

  upsertBy('priorities','priority_code', {priority_id:1, id:1, priority_code:'CRITICAL', priority_name:'Critical', sort_order:1});
  upsertBy('priorities','priority_code', {priority_id:2, id:2, priority_code:'HIGH',     priority_name:'High',     sort_order:2});
  upsertBy('priorities','priority_code', {priority_id:3, id:3, priority_code:'REGULAR',  priority_name:'Regular',  sort_order:3});
  upsertBy('priorities','priority_code', {priority_id:4, id:4, priority_code:'LOW',      priority_name:'Low',      sort_order:4});

  upsertBy('channels','channel_code', {channel_id:1, id:1, channel_code:'ATM',   channel_name:'ATM',             supports_terminal:true});
  upsertBy('channels','channel_code', {channel_id:2, id:2, channel_code:'MBANK', channel_name:'Mobile Banking',  supports_terminal:false});

  upsertBy('sources','source_code', {source_id:1, id:1, source_code:'CONTACT_CENTER', source_name:'Contact Center'});

  upsertBy('services','service_code', {service_id:1, id:1, service_code:'ATM', service_name:'ATM'});
  upsertBy('services','service_code', {service_id:2, id:2, service_code:'MBANK', service_name:'Mobile Banking'});

  const uic1 = upsertBy('uic','uic_code', {uic_id:1, id:1, uic_code:'UIC1', uic_name:'BCC - Customer Care', email:'uic1@bank.test'});
  const cc1  = upsertBy('complaint_categories','complaint_code', {complaint_id:1, id:1, complaint_code:'GAGAL_TUNAI',   complaint_name:'Gagal Tarik Tunai'});
  upsertBy('complaint_categories','complaint_code', {complaint_id:2, id:2, complaint_code:'KARTU_TERTELAN', complaint_name:'Kartu Tertelan'});
  const sla1 = upsertBy('slas','sla_name', {sla_id:1, id:1, sla_name:'Default 3d', resolution_days:3});

  const key = (p)=> `${p.service_id}-${p.channel_id}-${p.complaint_id}`;
  const pols = state['complaint_policies'] || [];
  if (!pols.some(p => key(p) === key({service_id:1,channel_id:1,complaint_id:1}))) {
    const id = nextId(pols, 'policy_id');
    pols.push({ policy_id:id, id, service_id:1, channel_id:1, complaint_id:1, sla_id:sla1.sla_id, uic_id:uic1.uic_id, valid_from:nowIso(), valid_to:null, description:'Bootstrap policy ATM×ATM×GAGAL_TUNAI' });
    state['complaint_policies'] = pols;
  }

  db.setState(state); if (db.write) db.write();
})();

server.use(middlewares);
server.use(jsonServer.bodyParser);

// ========= 0.5) GET collection fallback (missing collection => []) =========
server.get('/v1/:slug', (req, res, next) => {
  if ((req.params.slug || '').includes('/')) return next();
  const slug = req.params.slug; const col = slugToCol[slug] || slug;
  const arr = router.db.getState()[col];
  if (Array.isArray(arr)) return next();
  return res.json([]);
});

// ========= 1) Global middleware: timestamps + POST ID reconciliation =========
server.use((req, res, next) => {
  const now = nowIso();

  if (['POST','PUT','PATCH'].includes(req.method) && req.body) {
    if ('updated_at' in req.body) req.body.updated_at = now;
    if ('updated_time' in req.body) req.body.updated_time = now;
    if (req.method === 'POST') {
      if ('created_at' in req.body) req.body.created_at = req.body.created_at || now;
      if ('created_time' in req.body) req.body.created_time = req.body.created_time || now;
      if ('activity_time' in req.body) req.body.activity_time = req.body.activity_time || now;
      if ('sent_at' in req.body) req.body.sent_at = req.body.sent_at || now;
      if ('upload_time' in req.body) req.body.upload_time = req.body.upload_time || now;
    }
  }

  // Harmonize `id` <-> <pk> for non-nested resources on POST
  if (req.method === 'POST' && req.path.startsWith('/v1/')) {
    const seg = req.path.replace(/^\/v1\//,'').split('/')[0];
    const col = slugToCol[seg] || seg;
    const nestedPrefixes = ['tickets','uic','chatbot','customers','agents','notifications','routing','policies','auth','health'];
    if (!nestedPrefixes.includes(seg) && pkMap[col]) {
      const pk = pkMap[col];
      const list = router.db.get(col).value() || [];
      const givenPk = toNum(req.body[pk]);
      const givenId = toNum(req.body.id);
      if (givenPk != null && givenId == null) req.body.id = givenPk;
      else if (givenId != null && givenPk == null) req.body[pk] = givenId;
      else if (givenPk != null && givenId != null && givenPk !== givenId) req.body.id = givenPk; // prefer ERD PK
      if (req.body.id == null) {
        const n = nextId(list, pk); req.body.id = n; req.body[pk] = n;
      } else { req.body.id = Number(req.body.id); req.body[pk] = Number(req.body.id); }
    }
  }
  next();
});

// ========= 1.5) Idempotent DELETE by id or pk =========
server.delete('/v1/:slug/:id', (req, res, next) => {
  const slug = req.params.slug; const col = slugToCol[slug] || slug; const pk = pkMap[col];
  const state = router.db.getState(); const arr = state[col];
  if (!Array.isArray(arr)) return res.status(204).end();
  const id = Number(req.params.id);
  const before = arr.length;
  const remain = arr.filter(r => !((r.id === id) || (pk && r[pk] === id)));
  if (remain.length === before) return res.status(204).end();
  state[col] = remain; router.db.setState(state); if (router.db.write) router.db.write();
  return res.status(204).end();
});

// ========= 2) Auth & Health =========
server.post('/v1/auth/login', (req, res) => {
  const db = router.db; const { role, npp, email, password } = req.body || {};
  if (role === 'agent') {
    const user = db.get('agents').find({ npp, password_hash: password, is_active: true }).value();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    return res.json({ token:'mock-jwt-token', role:'agent', user:{ id:user.agent_id, npp:user.npp, full_name:user.full_name, email:user.email } });
  }
  if (role === 'customer') {
    const user = db.get('customers').find({ email, password_hash: password }).value();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    return res.json({ token:'mock-jwt-token', role:'customer', user:{ id:user.customer_id, nik:user.nik, full_name:user.full_name, email:user.email } });
  }
  return res.status(400).json({ error: 'Invalid role' });
});
server.get('/v1/health', (req,res)=> res.json({ status:'ok', time: nowIso() }));

// ========= 3) Resolver & Policies =========
server.get('/v1/routing/resolve', (req, res) => {
  const db = router.db; const q = req.query;
  const services = db.get('services').value(); const channels = db.get('channels').value();
  const complaints = db.get('complaint_categories').value(); const slas = db.get('slas').value(); const uics = db.get('uic').value();

  const service_id   = q.service_id   ? Number(q.service_id)   : (q.service_code   ? byCode(services,'service_code',q.service_code)?.service_id     : undefined);
  const channel_id   = q.channel_id   ? Number(q.channel_id)   : (q.channel_code   ? byCode(channels,'channel_code',q.channel_code)?.channel_id     : undefined);
  const complaint_id = q.complaint_id ? Number(q.complaint_id) : (q.complaint_code ? byCode(complaints,'complaint_code',q.complaint_code)?.complaint_id : undefined);
  if (!service_id || !channel_id || !complaint_id) return res.status(400).json({ error:'Provide service/channel/complaint (IDs or codes).' });

  const now = new Date();
  const policies = db.get('complaint_policies').filter({ service_id, channel_id, complaint_id }).value();
  const active = (policies||[]).filter(p => (!p.valid_from || new Date(p.valid_from)<=now) && (!p.valid_to || new Date(p.valid_to)>=now))
    .sort((a,b)=> new Date(b.valid_from||'1970-01-01') - new Date(a.valid_from||'1970-01-01'))[0];
  if (!active) return res.status(404).json({ error:'No active policy found' });

  const sla = slas.find(s => s.sla_id === active.sla_id);
  const uic = active.uic_id ? uics.find(u => u.uic_id === active.uic_id) : null;
  res.json({ service_id, channel_id, complaint_id, policy_id: active.policy_id,
    sla: sla ? { sla_id:sla.sla_id, name:sla.sla_name, resolution_days:sla.resolution_days } : null,
    uic, description: active.description });
});

server.get('/v1/policies/active', (req, res) => {
  const db = router.db; const { service_id, channel_id, complaint_id } = req.query; const now = new Date();
  let list = db.get('complaint_policies').value().filter(p => (!p.valid_from || new Date(p.valid_from)<=now) && (!p.valid_to || new Date(p.valid_to)>=now));
  if (service_id) list = list.filter(p => p.service_id === Number(service_id));
  if (channel_id) list = list.filter(p => p.channel_id === Number(channel_id));
  if (complaint_id) list = list.filter(p => p.complaint_id === Number(complaint_id));
  res.json(list);
});

// ========= 4) Ticket helpers =========
function snapshotPolicy(db, body){
  if (body.service_id && body.issue_channel_id && body.complaint_id) {
    const now = new Date();
    const picked = db.get('complaint_policies').value()
      .filter(p => p.service_id===body.service_id && p.channel_id===body.issue_channel_id && p.complaint_id===body.complaint_id)
      .filter(p => (!p.valid_from || new Date(p.valid_from)<=now) && (!p.valid_to || new Date(p.valid_to)>=now))
      .sort((a,b)=> new Date(b.valid_from||'1970-01-01') - new Date(a.valid_from||'1970-01-01'))[0];
    if (picked){ body.policy_id = picked.policy_id; body.sla_id = picked.sla_id; if (picked.uic_id) body.uic_id = picked.uic_id; }
  }
}
function issueTicketNumber(db, body){
  const today = new Date(); const ymd = today.toISOString().slice(0,10).replace(/-/g,'');
  const countToday = db.get('tickets').filter(t => (t.created_time||'').slice(0,10) === today.toISOString().slice(0,10)).value().length + 1;
  body.ticket_number = `TCK-${ymd}-${String(countToday).padStart(4,'0')}`;
}

// ========= 5) Ticket create guardrails (before json-server router) =========
server.post('/v1/tickets', (req, res, next) => {
  const db = router.db; const b = req.body || {};
  const svc = db.get('services').value(); const chl = db.get('channels').value(); const ccat = db.get('complaint_categories').value();

  if (b.service_code && !b.service_id) b.service_id = byCode(svc,'service_code',b.service_code)?.service_id;
  if (b.issue_channel_code && !b.issue_channel_id) b.issue_channel_id = byCode(chl,'channel_code',b.issue_channel_code)?.channel_id;
  if (b.complaint_code && !b.complaint_id) b.complaint_id = byCode(ccat,'complaint_code',b.complaint_code)?.complaint_id;

  b.customer_status = b.customer_status || 'Diterima';
  b.agent_status    = b.agent_status    || 'Diterima';
  if (!b.priority_id) {
    const prio = db.get('priorities').find({ priority_code:'REGULAR' }).value();
    b.priority_id = prio ? prio.priority_id : 3;
  }
  if (!b.responsible_agent_id) b.responsible_agent_id = 1;

  issueTicketNumber(db, b);
  b.row_version = 0;
  b.created_time = b.created_time || nowIso();
  snapshotPolicy(db, b);

  req.body = b; // hand over to router to persist
  next();
});

// ========= 6) Tickets search / stats / SLA at-risk =========
server.get('/v1/tickets/search', (req,res)=>{
  const db=router.db; const q=req.query||{}; let list=db.get('tickets').value()||[]; const L=s=>(s||'').toString().toLowerCase();
  if (q.q) list = list.filter(t => L(t.description).includes(L(q.q)) || L(t.ticket_number).includes(L(q.q)));
  ['customer_status','agent_status'].forEach(k => { if (q[k]) list = list.filter(t => t[k]===q[k]); });
  ['priority_id','service_id','issue_channel_id','intake_source_id','complaint_id','customer_id','responsible_agent_id']
    .forEach(k => { if (q[k]) list = list.filter(t => Number(t[k])===Number(q[k])); });
  const from=q.from?new Date(q.from):null, to=q.to?new Date(q.to):null;
  if (from) list = list.filter(t => new Date(t.created_time) >= from);
  if (to) list = list.filter(t => new Date(t.created_time) <= to);
  const sort = q.sort||'created_time', order=(q.order||'desc').toLowerCase();
  list = list.sort((a,b)=>{const av=a[sort],bv=b[sort]; if(av===bv) return 0; if(av==null) return 1; if(bv==null) return -1; return (av>bv?1:-1)*(order==='asc'?1:-1);});
  const page=Number(q.page)||1, limit=Number(q.limit)||20, start=(page-1)*limit, end=start+limit;
  res.json({ data:list.slice(start,end), page, limit, total:list.length });
});
server.get('/v1/tickets/stats/summary', (req,res)=>{
  const db=router.db; const days = Number((req.query.window||'').replace('d',''))||30;
  const cutoff = new Date(Date.now()-days*24*3600*1000);
  const arr=(db.get('tickets').value()||[]).filter(t => new Date(t.created_time) >= cutoff);
  const agg=(xs,k)=> xs.reduce((m,x)=>(m[x[k]]=(m[x[k]]||0)+1,m),{});
  res.json({ window_days:days, total:arr.length, by_customer_status:agg(arr,'customer_status'),
    by_agent_status:agg(arr,'agent_status'), by_priority_id:agg(arr,'priority_id'), by_service_id:agg(arr,'service_id') });
});
server.get('/v1/tickets/sla/at-risk', (req,res)=>{
  const db=router.db; const within=Number(req.query.days)||1; const now=new Date();
  const slas=db.get('slas').value()||[]; const tickets=(db.get('tickets').value()||[]).filter(t=>!t.closed_time);
  const results=tickets.filter(t=>{ let due=t.target_sla?new Date(t.target_sla):null;
    if(!due && t.sla_id){ const sla=slas.find(s=>s.sla_id===t.sla_id); if(sla) due=new Date(new Date(t.created_time).getTime()+sla.resolution_days*24*3600*1000); }
    if(!due) return false; const diff=(due-now)/(24*3600*1000); return diff>=0 && diff<=within; });
  res.json(results);
});

// ========= 7) Ticket ops =========
server.patch('/v1/tickets/:id/status', (req,res)=>{
  const db=router.db, id=Number(req.params.id);
  const t=db.get('tickets').find({ ticket_id:id }).value() || db.get('tickets').find({ id }).value();
  if(!t) return res.status(404).json({ error:'Not found' });
  const up={}; if(req.body.customer_status) up.customer_status=req.body.customer_status; if(req.body.agent_status) up.agent_status=req.body.agent_status;
  if(!t.first_response_time && (up.agent_status || up.customer_status)) up.first_response_time=nowIso();
  up.row_version=(t.row_version||0)+1; db.get('tickets').find({ ticket_id:t.ticket_id||t.id }).assign({ ...up }).write();
  res.json({ ...t, ...up });
});
server.post('/v1/tickets/:id/assign', (req,res)=>{
  const db=router.db, id=Number(req.params.id), agentId=Number(req.body.responsible_agent_id);
  const t=db.get('tickets').find({ ticket_id:id }).value() || db.get('tickets').find({ id }).value();
  const a=db.get('agents').find({ agent_id:agentId }).value();
  if(!t) return res.status(404).json({ error:'Ticket not found' });
  if(!a) return res.status(400).json({ error:'Agent not found' });
  const up={ responsible_agent_id:agentId, row_version:(t.row_version||0)+1 }; db.get('tickets').find({ ticket_id:t.ticket_id||t.id }).assign(up).write();
  const acts=db.get('ticket_activities'); const next=nextId(acts.value()||[],'activity_id');
  acts.push({ activity_id:next, ticket_id:t.ticket_id||t.id, sender_id:agentId, sender_type:'agent', activity_type:'Penugasan', content:`Assigned to agent ${agentId}`, activity_time:nowIso() }).write();
  res.json({ ...t, ...up });
});
server.post('/v1/tickets/:id/close', (req,res)=>{
  const db=router.db, id=Number(req.params.id);
  const t=db.get('tickets').find({ ticket_id:id }).value() || db.get('tickets').find({ id }).value();
  if(!t) return res.status(404).json({ error:'Not found' });
  const now=nowIso(); const up={ agent_status:'Closed', customer_status:'Selesai', closed_time:now, end_time:now, row_version:(t.row_version||0)+1 };
  db.get('tickets').find({ ticket_id:t.ticket_id||t.id }).assign(up).write(); res.json({ ...t, ...up });
});
server.post('/v1/tickets/:id/reopen', (req,res)=>{
  const db=router.db, id=Number(req.params.id);
  const t=db.get('tickets').find({ ticket_id:id }).value() || db.get('tickets').find({ id }).value();
  if(!t) return res.status(404).json({ error:'Not found' });
  const up={ agent_status:'Diterima', customer_status:'Diterima', closed_time:null, end_time:null, row_version:(t.row_version||0)+1 };
  db.get('tickets').find({ ticket_id:t.ticket_id||t.id }).assign(up).write(); res.json({ ...t, ...up });
});
server.post('/v1/tickets/:id/cancel', (req,res)=>{
  const db=router.db, id=Number(req.params.id);
  const t=db.get('tickets').find({ ticket_id:id }).value() || db.get('tickets').find({ id }).value();
  if(!t) return res.status(404).json({ error:'Not found' });
  const up={ agent_status:'Declined', customer_status:'Ditolak', end_time:nowIso(), row_version:(t.row_version||0)+1 };
  db.get('tickets').find({ ticket_id:t.ticket_id||t.id }).assign(up).write(); res.json({ ...t, ...up });
});
server.patch('/v1/tickets/:id/target-sla', (req,res)=>{
  const db=router.db, id=Number(req.params.id);
  const t=db.get('tickets').find({ ticket_id:id }).value() || db.get('tickets').find({ id }).value();
  if(!t) return res.status(404).json({ error:'Not found' });
  const up={ target_sla:req.body.target_sla, row_version:(t.row_version||0)+1 };
  db.get('tickets').find({ ticket_id:t.ticket_id||t.id }).assign(up).write(); res.json({ ...t, ...up });
});
server.patch('/v1/tickets/:id/uic', (req,res)=>{
  const db=router.db, id=Number(req.params.id);
  const t=db.get('tickets').find({ ticket_id:id }).value() || db.get('tickets').find({ id }).value();
  if(!t) return res.status(404).json({ error:'Not found' });
  const up={ uic_id:toNum(req.body.uic_id)||null, row_version:(t.row_version||0)+1 };
  db.get('tickets').find({ ticket_id:t.ticket_id||t.id }).assign(up).write(); res.json({ ...t, ...up });
});
server.patch('/v1/tickets/:id/priority', (req,res)=>{
  const db=router.db, id=Number(req.params.id);
  const t=db.get('tickets').find({ ticket_id:id }).value() || db.get('tickets').find({ id }).value();
  if(!t) return res.status(404).json({ error:'Not found' });
  const up={ priority_id:toNum(req.body.priority_id)||t.priority_id, row_version:(t.row_version||0)+1 };
  db.get('tickets').find({ ticket_id:t.ticket_id||t.id }).assign(up).write(); res.json({ ...t, ...up });
});

// ========= 8) Nested under tickets =========
server.get('/v1/tickets/:id/activities', (req,res)=>{
  const id=Number(req.params.id); res.json((router.db.get('ticket_activities').value()||[]).filter(a=>a.ticket_id===id));
});
server.post('/v1/tickets/:id/activities', (req,res)=>{
  const db=router.db, id=Number(req.params.id);
  const acts=db.get('ticket_activities'); const next=nextId(acts.value()||[],'activity_id'); const b=req.body||{};
  const row={ activity_id:next, ticket_id:id, sender_id:b.sender_id||1, sender_type:b.sender_type||'agent', activity_type:b.activity_type||'Komentar', content:b.content||'', activity_time:nowIso() };
  acts.push(row).write(); res.status(201).json(row);
});
server.get('/v1/tickets/:id/attachments', (req,res)=>{
  const db=router.db, id=Number(req.params.id); const acts=(db.get('ticket_activities').value()||[]).filter(a=>a.ticket_id===id).map(a=>a.activity_id);
  res.json((db.get('attachments').value()||[]).filter(a=>acts.includes(a.activity_id)));
});
server.post('/v1/tickets/:id/attachments', (req,res)=>{
  const db=router.db, id=Number(req.params.id); const b=req.body||{};
  let activityId = toNum(b.activity_id);
  if (!activityId) {
    const acts=db.get('ticket_activities'); const nextA=nextId(acts.value()||[],'activity_id');
    acts.push({ activity_id:nextA, ticket_id:id, sender_id:1, sender_type:'sistem', activity_type:'Attachment', content:'Auto activity for attachment', activity_time:nowIso() }).write();
    activityId = nextA;
  } else {
    const act=db.get('ticket_activities').find({ activity_id:activityId }).value();
    if(!act || act.ticket_id!==id) return res.status(400).json({ error:'Invalid activity_id for this ticket' });
  }
  const atts=db.get('attachments'); const next=nextId(atts.value()||[],'attachment_id');
  const row={ attachment_id:next, activity_id:activityId, file_name:b.file_name||'file.bin', file_path:b.file_path||'/files/file.bin', file_type:b.file_type||'application/octet-stream', file_size:b.file_size||0, upload_time:nowIso() };
  atts.push(row).write(); res.status(201).json(row);
});
server.get('/v1/tickets/:id/transactions', (req,res)=>{
  const id=Number(req.params.id); res.json((router.db.get('ticket_transactions').value()||[]).filter(t=>t.ticket_id===id));
});
server.post('/v1/tickets/:id/transactions', (req,res)=>{
  const db=router.db, id=Number(req.params.id); const txs=db.get('ticket_transactions'); const next=nextId(txs.value()||[],'ticket_txn_id'); const b=req.body||{};
  const row={ ticket_txn_id:next, ticket_id:id, transaction_datetime:b.transaction_datetime||nowIso(), amount:b.amount||0, currency:b.currency||'IDR', terminal_id:b.terminal_id||null, rrn:b.rrn||null, stan:b.stan||null };
  txs.push(row).write(); res.status(201).json(row);
});
server.get('/v1/tickets/:id/escalations', (req,res)=>{
  const id=Number(req.params.id); res.json((router.db.get('ticket_uic_escalations').value()||[]).filter(e=>e.ticket_id===id));
});
server.post('/v1/tickets/:id/escalations', (req,res)=>{
  const db=router.db, id=Number(req.params.id); const escs=db.get('ticket_uic_escalations'); const next=nextId(escs.value()||[],'escalation_id'); const b=req.body||{};
  const row={ escalation_id:next, ticket_id:id, uic_id:toNum(b.uic_id)||null, escalated_by_agent_id:toNum(b.escalated_by_agent_id)||1,
    escalated_at:nowIso(), external_case_ref:b.external_case_ref||null, status:b.status||'sent', responded_at:null, closed_at:null,
    escalation_kind:b.escalation_kind||'initial', reminder_seq:null, notes:b.notes||null, email_message_id:`msg-${next}`, email_status:'sent', email_sent_at:nowIso() };
  escs.push(row).write(); res.status(201).json(row);
});
server.get('/v1/tickets/:id/chat-messages', (req,res)=>{
  const id=Number(req.params.id); res.json((router.db.get('chat_messages').value()||[]).filter(c=>c.ticket_id===id));
});
server.post('/v1/tickets/:id/chat-messages', (req,res)=>{
  const db=router.db, id=Number(req.params.id); const chats=db.get('chat_messages'); const next=nextId(chats.value()||[],'chat_id'); const b=req.body||{};
  const row={ chat_id:next, ticket_id:id, sender_id:toNum(b.sender_id)||1, sender_type:b.sender_type||'agent', message:b.message||'', sent_at:nowIso() };
  chats.push(row).write(); res.status(201).json(row);
});
server.get('/v1/tickets/:id/call-logs', (req,res)=>{
  const id=Number(req.params.id); res.json((router.db.get('call_logs').value()||[]).filter(c=>c.ticket_id===id));
});
server.post('/v1/tickets/:id/call-logs', (req,res)=>{
  const db=router.db, id=Number(req.params.id); const calls=db.get('call_logs'); const next=nextId(calls.value()||[],'call_id'); const b=req.body||{};
  const row={ call_id:next, ticket_id:id, agent_id:toNum(b.agent_id)||1, customer_id:toNum(b.customer_id)||null, call_start:b.call_start||nowIso(), call_end:b.call_end||null, status:b.status||'connected' };
  calls.push(row).write(); res.status(201).json(row);
});
server.get('/v1/tickets/:id/feedback', (req,res)=>{
  const id=Number(req.params.id); const row=(router.db.get('feedback').find({ ticket_id:id }).value());
  if(!row) return res.status(404).json({ error:'Not found' }); res.json(row);
});
server.post('/v1/tickets/:id/feedback', (req,res)=>{
  const db=router.db, id=Number(req.params.id); const exists=db.get('feedback').find({ ticket_id:id }).value();
  if (exists) return res.status(409).json({ error:'Feedback already exists for this ticket' });
  const rows=db.get('feedback'); const next=nextId(rows.value()||[],'feedback_id'); const b=req.body||{};
  const row={ feedback_id:next, ticket_id:id, score:toNum(b.score)||0, comment:b.comment||'', submit_time:nowIso() };
  rows.push(row).write(); res.status(201).json(row);
});

// ========= 9) UIC, Notifications, Chatbot, Aggregators =========
server.get('/v1/uic/:id/escalations', (req,res)=>{
  const id=Number(req.params.id); let list=(router.db.get('ticket_uic_escalations').value()||[]).filter(e=>e.uic_id===id);
  if (req.query.status) list=list.filter(e=>e.status===req.query.status); res.json(list);
});
server.patch('/v1/notifications/:id/read', (req,res)=>{
  const db=router.db, id=Number(req.params.id); const n=db.get('notifications').find({ notification_id:id }).value();
  if(!n) return res.status(404).json({ error:'Not found' }); db.get('notifications').find({ notification_id:id }).assign({ is_read:true }).write();
  res.json({ ...n, is_read:true });
});
server.post('/v1/notifications/bulk-read', (req,res)=>{
  const db=router.db, ids=(req.body&&req.body.ids)||[]; const updated=[];
  ids.forEach(x=>{ const id=Number(x); const n=db.get('notifications').find({ notification_id:id }).value(); if(n){ db.get('notifications').find({ notification_id:id }).assign({ is_read:true }).write(); updated.push(id); } });
  res.json({ updated });
});

// Chatbot sessions
server.post('/v1/chatbot/sessions/:id/close', (req,res)=>{
  const db=router.db, id=Number(req.params.id); const s=db.get('chatbot_sessions').find({ session_id:id }).value();
  if(!s) return res.status(404).json({ error:'Session not found' });
  const up={ status:'completed', ended_at:nowIso() }; db.get('chatbot_sessions').find({ session_id:id }).assign(up).write(); res.json({ ...s, ...up });
});
server.post('/v1/chatbot/sessions/:id/convert', (req,res)=>{
  const db=router.db, sid=Number(req.params.id); const sess=db.get('chatbot_sessions').find({ session_id:sid }).value();
  if(!sess) return res.status(404).json({ error:'Session not found' });
  const b=req.body||{}; const required=['service_id','issue_channel_id','complaint_id','intake_source_id','priority_id'];
  if (required.some(k=>!b[k])) return res.status(400).json({ error:'Missing required fields: service_id, issue_channel_id, complaint_id, intake_source_id, priority_id' });
  const tickets=db.get('tickets'); const next=nextId(tickets.value()||[],'ticket_id');
  const t={ ticket_id:next, id:next, description:b.description||'Ticket from chatbot conversion', customer_status:'Diterima', agent_status:'Diterima',
    priority_id:Number(b.priority_id), issue_channel_id:Number(b.issue_channel_id), intake_source_id:Number(b.intake_source_id), service_id:Number(b.service_id),
    customer_id:sess.customer_id, related_account_id:b.related_account_id||null, related_card_id:b.related_card_id||null, complaint_id:Number(b.complaint_id),
    uic_id:null, faq_id:null, source_session_id:sid, responsible_agent_id:b.responsible_agent_id||1, sla_id:null, policy_id:null, committed_due_at:null,
    created_time:nowIso(), first_response_time:null, end_time:null, closed_time:null, target_sla:null, row_version:0 };
  const today=new Date(); const ymd=today.toISOString().slice(0,10).replace(/-/g,''); const countToday=tickets.value().filter(x => (x.created_time||'').slice(0,10) === today.toISOString().slice(0,10)).length + 1;
  t.ticket_number = `TCK-${ymd}-${String(countToday).padStart(4,'0')}`;
  (function snapshot(){ const now=new Date(); const p=db.get('complaint_policies').value()
    .filter(p=>p.service_id===t.service_id && p.channel_id===t.issue_channel_id && p.complaint_id===t.complaint_id)
    .filter(p=>(!p.valid_from || new Date(p.valid_from)<=now) && (!p.valid_to || new Date(p.valid_to)>=now))
    .sort((a,b)=> new Date(b.valid_from||'1970-01-01')-new Date(a.valid_from||'1970-01-01'))[0];
    if(p){ t.policy_id=p.policy_id; t.sla_id=p.sla_id; if(p.uic_id) t.uic_id=p.uic_id; } })();
  tickets.push(t).write(); res.status(201).json(t);
});

// Aggregators
server.get('/v1/customers/:id/portfolio', (req,res)=>{
  const db=router.db, id=Number(req.params.id);
  const cust=db.get('customers').find({ customer_id:id }).value(); if(!cust) return res.status(404).json({ error:'Not found' });
  const accounts=db.get('accounts').filter({ customer_id:id }).value()||[];
  const accountIds=new Set(accounts.map(a=>a.account_id)); const cards=(db.get('cards').value()||[]).filter(c=>accountIds.has(c.account_id));
  const tickets=db.get('tickets').filter({ customer_id:id }).value()||[];
  res.json({ customer:cust, accounts, cards, tickets });
});
server.get('/v1/customers/:id/tickets', (req,res)=>{ const id=Number(req.params.id); res.json((router.db.get('tickets').value()||[]).filter(t=>t.customer_id===id)); });
server.get('/v1/agents/:id/tickets',    (req,res)=>{ const id=Number(req.params.id); res.json((router.db.get('tickets').value()||[]).filter(t=>t.responsible_agent_id===id)); });

// ========= 10) Full view aggregator =========
server.get('/v1/tickets/:id/full', (req,res)=>{
  const db=router.db, id=Number(req.params.id);
  const t=db.get('tickets').find({ ticket_id:id }).value() || db.get('tickets').find({ id }).value();
  if(!t) return res.status(404).json({ error:'Not found' });
  const join=(col,key,val)=> db.get(col).find({ [key]:val }).value();
  const jAll=(col,key,val)=> db.get(col).filter({ [key]:val }).value();
  const tid = t.ticket_id || t.id;
  const acts=jAll('ticket_activities','ticket_id',tid);
  const att=(db.get('attachments').value()||[]).filter(a=>acts.map(x=>x.activity_id).includes(a.activity_id));
  res.json({
    ...t,
    customer: join('customers','customer_id',t.customer_id),
    account: t.related_account_id ? join('accounts','account_id',t.related_account_id) : null,
    card: t.related_card_id ? join('cards','card_id',t.related_card_id) : null,
    priority: join('priorities','priority_id',t.priority_id),
    channel_issue: join('channels','channel_id',t.issue_channel_id),
    source_intake: join('sources','source_id',t.intake_source_id),
    service: join('services','service_id',t.service_id),
    complaint: join('complaint_categories','complaint_id',t.complaint_id),
    uic: t.uic_id ? join('uic','uic_id',t.uic_id) : null,
    sla: t.sla_id ? join('slas','sla_id',t.sla_id) : null,
    policy: t.policy_id ? join('complaint_policies','policy_id',t.policy_id) : null,
    responsible_agent: join('agents','agent_id',t.responsible_agent_id),
    activities: acts,
    attachments: att,
    transactions: jAll('ticket_transactions','ticket_id',tid),
    escalations: jAll('ticket_uic_escalations','ticket_id',tid),
    feedback: join('feedback','ticket_id',tid),
    notifications: jAll('notifications','ticket_id',tid),
    chat_messages: jAll('chat_messages','ticket_id',tid),
    call_logs: jAll('call_logs','ticket_id',tid)
  });
});

// ========= Error handler (JSON only) =========
server.use((err, req, res, next) => {
  console.error('MockAPI error:', err);
  res.status(500).json({ error:'Internal Server Error', detail: String(err && err.message || err) });
});

// ========= Mount router =========
server.use('/v1', rewriter);
server.use('/v1', router);

const PORT = process.env.MOCK_PORT || 3001;
server.listen(PORT, () => console.log(`B-Care MockAPI v3.3.6 up at http://localhost:${PORT}/v1`));
