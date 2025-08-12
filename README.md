# B‑Care MockAPI — Frontend Integration Guide

Contract‑first mock backend so FE can ship fast, iterate safely, and demo end‑to‑end without waiting on real services.

---

## Quick Start

```bash
# 1) Install
npm i

# 2) Run mock API
npm run mock
# → Mock API running at http://localhost:3001
```

**Base URL**

```
{{baseUrl}} = http://localhost:3001
```

**Postman**

1. Import collection from `./postman/B-Care MockAPI.postman_collection.json`.
2. Set an Environment (or Collection) variable: `baseUrl = http://localhost:3001`.
3. Run the collection with **Runner**. The pre‑request script auto‑discovers IDs and sets: `teamId`, `agentId`, `customerId`, `accountId`, `notifId`, `sessionId`.

> Collection already includes examples and tests so FE can treat it as living API docs.

---

## What’s Included

* `json-server` + custom **handlers** in `mock/server.js` for business flows json‑server can’t natively model (ticket enrichment, status transitions, notification mark‑read, plural routes, chatbot session lookup).
* Friendly **routes** via `mock/routes.json` (e.g. `/tickets`, `/agents`, `/complaint-categories`).
* Realistic **seed** in `mock/db.json` using ERD field names with custom PKs (`*_id`).
* Ready‑to‑run **Postman** collection in `./postman`.

---

## Health & Auth (stub)

* `GET /meta/health` → `{ "ok": true }`
* `GET /meta/enums` → enums for dropdowns.
* `POST /auth/login` → returns dummy `access_token` + `role` (`agent`|`customer`).

Example

```http
POST /auth/login
{ "email":"rina.hartati@bank.local", "password":"any" }
→ 200 { "access_token":"dummy-token", "role":"agent", "user":{ "agent_id":1, "full_name":"Rina Hartati" } }
```

---

## Identity & Directory

* `GET /customers/{id}`
* `GET /teams`
* `GET /agents/{id}`
* `GET /agents?team_id={teamId}` → **200** with filtered array (empty if no match).
* `GET /accounts?customer_id={customerId}` → **200** with filtered array.

---

## Ticketing & Workflow

### Create

`POST /tickets`

Auto‑enrichment applied on create:

* `ticket_id` (auto)
* `ticket_number` (`TCK-YYYYMMDD-####`)
* `created_time` (ISO)
* `sla_id` (inherited from `complaint_id` if omitted)
* `target_sla` (computed from SLA `time_resolution` hours)

**Request (minimal)**

```json
{
  "title": "Transaksi ganda",
  "description": "Topup e-wallet",
  "customer_id": 1,
  "related_account_id": 1,
  "complaint_id": 2,
  "source_channel": "Chat",
  "responsible_agent_id": 1,
  "responsible_team_id": 1
}
```

**Response (201)**

```json
{ "ticket_id": 21, "ticket_number": "TCK-20250812-0011", "target_sla": "2025-08-13T...", "customer_status": "Baru", "agent_status": "Baru", "created_time": "...", "sla_id": 1, ... }
```

### Read

* `GET /tickets` — list & filter (supports `_page`, `_limit`, `_sort`, `_order`, and equality filters like `customer_id=` `responsible_agent_id=` `complaint_id=`).
* `GET /tickets/{id}` — core fields.
* `GET /tickets/{id}/activities` — activity slice for a ticket (sorted by `activity_time`).
* `GET /tickets/{id}/full` — enriched join: ticket + customer/account/complaint/SLA + activities, chats, calls, feedback, notifications.
* `GET /tickets/{id}/timeline` — merged timeline (activities + chats + calls).
* Convenience filters: `GET /tickets/open`, `GET /tickets/closed` (if present in collection).

### Update

* `POST /tickets/{id}/activities` — add comment/assignment/status note.
* `PATCH /tickets/{id}/status` — transition status with automatic audit trail.

**Example**

```http
PATCH /tickets/11/status
{ "agent_status": "Dikerjakan", "actor_id": 1, "actor_type": "agent" }
→ 200 { "ticket": { ... }, "activity": { ... } }
```

---

## Knowledge, Interactions & Notifications

### Taxonomy & FAQ

* `GET /complaint-categories`, `GET /complaint-categories/{id}`
* `GET /faqs?q=&complaint_id=&_page=&_limit=`
* `POST /faq-logs` — record FAQ exposure (telemetry)

### Chat & Call

* `GET /chat-messages?ticket_id=&since=`
* `POST /chat-messages`
* `GET /call-logs?ticket_id=`
* `POST /call-logs`

### Chatbot (optional)

* `GET /chatbot/sessions/{id}` — PK is `session_id` (mock handles this)
* `GET /chatbot/messages?session_id=`
* `POST /chatbot/sessions`, `POST /chatbot/messages`

### Notifications

* **List**: `GET /notifications?user_type=&user_id=&is_read=`
* **Get one**: `GET /notifications/{id}` (mapped to `notification_id`)
* **Mark one**: `PATCH /notifications/{id}` with `{ "is_read": true }` (empty body also marks read)
* **Bulk mark read**: `POST /notifications/mark-read`

Accepted bodies (idempotent):

```json
{ "ids": [1,2,3] }
[1,2,3]
"1,2,3"
{ "id": 1 }
```

Response:

```json
{ "updated": [ /* objects */ ], "count": 3 }
```

---

## Query Operators (json‑server)

* Pagination: `_page=1&_limit=10`
* Sorting: `_sort=created_time&_order=desc`
* Exact match: `customer_id=1`

Example

```
GET /tickets?customer_id=1&_sort=created_time&_order=desc&_page=1&_limit=10
```

---

## Data & Contract Notes

* Collections use **custom PKs** (`customer_id`, `agent_id`, `ticket_id`, `notification_id`, `session_id`, ...).
* List endpoints return **200 + \[]** when empty.
* `/{id}` returns **404** when not found.
* Ticket creation always returns enriched fields as listed above.

---

## Troubleshooting

* **404 on** `/agents?team_id=` or `/accounts?customer_id=` → ensure base URL is `:3001` and the query value exists in seed. Lists return **200 \[]** when no match.
* **404 on** `GET /notifications/{id}` → ensure `{{notifId}}` is set (1..3 in seed). The Postman pre‑script auto‑sets this; otherwise call `GET /notifications` first.
* **Bulk mark‑read 400** → use one of the accepted bodies above or `?ids=1,2,3`.
* **Missing `ticket_number`/`target_sla`** on create → you’re bypassing the public endpoint; always use `POST /tickets` (not direct DB writes).

---

## Repo Layout

```
mock/
  db.json           # seed data (normalized)
  routes.json       # public → internal mapping
  server.js         # mock server + custom handlers
postman/
  B-Care MockAPI.postman_collection.json
README.md
package.json
```

---

## Sample cURL

```bash
# Health
curl {{baseUrl}}/meta/health

# Login (stub)
curl -X POST {{baseUrl}}/auth/login -H "Content-Type: application/json" -d '{"email":"a@b.c","password":"x"}'

# Teams & Agents
curl {{baseUrl}}/teams
curl "{{baseUrl}}/agents?team_id=1"

# Create ticket
curl -X POST {{baseUrl}}/tickets -H "Content-Type: application/json" -d '{
  "title":"Transaksi ganda",
  "description":"Topup e-wallet",
  "customer_id":1,
  "related_account_id":1,
  "complaint_id":2,
  "source_channel":"Chat",
  "responsible_agent_id":1,
  "responsible_team_id":1
}'

# Notifications
curl "{{baseUrl}}/notifications?user_type=agent&user_id=1&is_read=false"
curl -X PATCH {{baseUrl}}/notifications/2 -H "Content-Type: application/json" -d '{"is_read":true}'
curl -X POST {{baseUrl}}/notifications/mark-read -H "Content-Type: application/json" -d '{"ids":[1,3]}'
```
