const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();
const rewriter = jsonServer.rewriter(require("./routes.json"));

const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const openapiSpec = YAML.load("./openapi.yaml");

server.use(middlewares);
server.use(jsonServer.bodyParser);

// ----- ENUM validation helper -----
const enums = {
  account_type: ["Tabungan", "Giro", "Kartu Kredit", "Lainnya"],
  agent_role: ["Frontline", "Back Office", "Manajer", "QA"],
  customer_status: ["Baru", "Diproses", "Selesai"],
  agent_status: ["Baru", "Dikerjakan", "Menunggu Respon Customer", "Selesai", "Ditutup", "Reopen"],
  source_channel: ["ATM", "Deposito", "Kartu Debit", "Form", "Chat", "Call", "WhatsApp"],
  sender_type_activity: ["agent", "customer", "sistem", "chatbot"],
  activity_type: ["Komentar", "Perubahan Status", "Penugasan", "Attachment", "Call", "Chat"],
  notification_user_type: ["agent", "customer"],
  notification_type: ["status_change", "sla_warning", "sla_breached"],
  chat_sender_type: ["agent", "customer"],
  call_status: ["connected", "missed", "failed"],
  chatbot_status: ["ongoing", "completed", "converted_to_ticket", "resolved_by_faq"],
  chatbot_sender_type: ["chatbot", "customer"]
};

function nowISO() { return new Date().toISOString(); }

// ----- Auto timestamp & basic enum validation -----
server.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method) && req.body && typeof req.body === "object") {
    // Auto timestamp fields commonly used
    const autoCreateFields = ["created_at", "created_time", "upload_time", "shown_at", "started_at", "sent_at"];
    const autoUpdateFields = ["updated_at", "activity_time", "first_response_time", "end_time", "closed_time"];
    autoCreateFields.forEach(f => { if (req.method === "POST" && req.body[f] == null) req.body[f] = nowISO(); });
    autoUpdateFields.forEach(f => { if (req.method !== "GET" && req.body[f] == null && f === "updated_at") req.body[f] = nowISO(); });

    // Enum validations (soft; return 400 if invalid)
    const checks = [
      ["account", "account_type", enums.account_type],
      ["agent", "role", enums.agent_role],
      ["ticket", "customer_status", enums.customer_status],
      ["ticket", "agent_status", enums.agent_status],
      ["ticket", "source_channel", enums.source_channel],
      ["ticket_activity", "sender_type", enums.sender_type_activity],
      ["ticket_activity", "activity_type", enums.activity_type],
      ["notification", "user_type", enums.notification_user_type],
      ["notification", "notification_type", enums.notification_type],
      ["chat_message", "sender_type", enums.chat_sender_type],
      ["call_log", "status", enums.call_status],
      ["chatbot_session", "status", enums.chatbot_status],
      ["chatbot_message", "sender_type", enums.chatbot_sender_type]
    ];

    for (const [resource, field, allowed] of checks) {
      if (req.path.startsWith(`/${resource}`) && req.body[field] != null) {
        if (!allowed.includes(req.body[field])) {
          return res.status(400).jsonp({ error: `Invalid ${field}. Allowed: ${allowed.join(", ")}` });
        }
      }
    }
  }
  next();
});

// Mount Swagger UI before json-server router
server.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  explorer: true
}));
server.get("/openapi.yaml", (_, res) => res.sendFile(require("path").join(__dirname, "openapi.yaml")));

// Apply custom routes (/api/* aliases & nested endpoints)
server.use(rewriter);

// Mount router
server.use(router);


// Boot
const PORT = 4000;
const HOST = "0.0.0.0";
server.listen(PORT, HOST, () => {
  console.log(`JSON Server running at http://${HOST}:${PORT}`);
  console.log(`Swagger docs available at http://${HOST}:${PORT}/docs`);
});
