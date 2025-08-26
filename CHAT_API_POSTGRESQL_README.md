# Chat API (PostgreSQL) Documentation

Chat API endpoints untuk B-Care Customer Care System menggunakan PostgreSQL database dengan Sequelize ORM.

## 🗄️ **Database**

Chat API menggunakan PostgreSQL dengan tables:
- `chat_message` - Menyimpan pesan chat
- `ticket` - Reference untuk chat sessions  
- `sender_type` - Tipe pengirim (Customer/Employee)
- `customer` - Data customer
- `employee` - Data employee

## 🔐 **Authentication**

Semua Chat endpoints **WAJIB** menggunakan JWT Bearer token:
```bash
Authorization: Bearer your_jwt_token_here
```

## 📍 **Endpoints**

### **Chat Sessions**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/chats/sessions` | Create chat session |
| GET | `/v1/chats/{session_id}/summary` | Get session summary |

### **Chat Messages**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/chats/{session_id}/messages` | Send message |
| GET | `/v1/chats/{session_id}/messages` | Get chat history |
| DELETE | `/v1/chats/{session_id}/messages/{message_id}` | Delete message |

## 🚀 **Usage Flow**

### 1. **Login untuk mendapatkan token**
```bash
POST /v1/auth/login/customer
{
  "email": "andi.saputra@example.com",
  "password": "andi"
}
```

### 2. **Create Chat Session**
```bash
POST /v1/chats/sessions
Authorization: Bearer {token}
{
  "ticket_id": 1
}
```

### 3. **Send Customer Message**
```bash
POST /v1/chats/1/messages
Authorization: Bearer {token}
{
  "sender_id": 1,
  "sender_type_id": 1,
  "message": "Halo, butuh bantuan kartu ATM"
}
```

### 4. **Send Employee Response**
```bash
POST /v1/chats/1/messages
Authorization: Bearer {token}
{
  "sender_id": 1,
  "sender_type_id": 2,
  "message": "Halo! Saya akan bantu masalah kartu ATM Anda"
}
```

### 5. **Get Chat History**
```bash
GET /v1/chats/1/messages?limit=50&offset=0
Authorization: Bearer {token}
```

## 🔧 **Request/Response Examples**

### **Create Session**
```json
// Request
POST /v1/chats/sessions
{
  "ticket_id": 1
}

// Response (201)
{
  "success": true,
  "message": "Chat session created",
  "data": {
    "session_id": 1
  }
}
```

### **Send Message**
```json
// Request
POST /v1/chats/1/messages
{
  "sender_id": 1,
  "sender_type_id": 1,
  "message": "Halo, butuh bantuan"
}

// Response (201)
{
  "success": true,
  "message": "Message sent",
  "data": {
    "chat_id": 4,
    "ticket_id": 1,
    "sender_id": 1,
    "sender_type_id": 1,
    "message": "Halo, butuh bantuan",
    "sent_at": "2025-08-26T10:30:00.000Z",
    "ticket": {
      "ticket_id": 1
    },
    "sender_type": {
      "sender_type_id": 1,
      "name": "Customer"
    }
  }
}
```

### **Get Messages**
```json
// Request
GET /v1/chats/1/messages?limit=10&offset=0

// Response (200)
{
  "success": true,
  "message": "Messages retrieved successfully",
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_items": 5,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  },
  "data": [
    {
      "chat_id": 1,
      "ticket_id": 1,
      "sender_id": 1,
      "sender_type_id": 1,
      "message": "Halo, butuh bantuan",
      "sent_at": "2025-08-26T08:05:00.000Z",
      "ticket": {
        "ticket_id": 1
      },
      "sender_type": {
        "sender_type_id": 1,
        "name": "Customer"
      }
    }
  ]
}
```

### **Session Summary**
```json
// Request
GET /v1/chats/1/summary

// Response (200)
{
  "success": true,
  "message": "Session summary retrieved successfully",
  "data": {
    "session_id": 1,
    "ticket_id": 1,
    "total_messages": 5,
    "first_message_at": "2025-08-26T08:05:00.000Z",
    "last_message_at": "2025-08-26T10:30:00.000Z",
    "participants": [
      {
        "sender_id": 1,
        "sender_type_id": 1,
        "sender_type_name": "Customer"
      },
      {
        "sender_id": 1,
        "sender_type_id": 2,
        "sender_type_name": "Employee"
      }
    ]
  }
}
```

## 📋 **Query Parameters**

### **Get Messages**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Max messages per page (max: 200) |
| `offset` | integer | 0 | Number of messages to skip |
| `since` | datetime | null | Only messages after this timestamp |

### **Examples:**
```bash
# Pagination
GET /v1/chats/1/messages?limit=20&offset=40

# Date filter
GET /v1/chats/1/messages?since=2025-08-26T00:00:00Z

# Combined
GET /v1/chats/1/messages?limit=10&since=2025-08-26T08:00:00Z
```

## 🎯 **Sender Types**

| ID | Type | Description |
|----|------|-------------|
| 1 | Customer | Messages dari customer |
| 2 | Employee | Messages dari customer service |

## ✅ **Validations**

### **Create Session**
- ✅ `ticket_id` wajib ada
- ✅ Ticket harus exist di database
- ✅ Require JWT authentication

### **Send Message**  
- ✅ `sender_id`, `sender_type_id`, `message` wajib ada
- ✅ `message` tidak boleh kosong/hanya whitespace
- ✅ Session/ticket harus exist
- ✅ `sender_type_id` harus valid (1 atau 2)
- ✅ Customer/Employee dengan `sender_id` harus exist
- ✅ Require JWT authentication

### **Get Messages**
- ✅ `session_id` wajib ada di path
- ✅ Session/ticket harus exist
- ✅ `limit` max 200 messages
- ✅ `since` harus valid date format
- ✅ Require JWT authentication

## 🚨 **Error Responses**

### **401 Unauthorized**
```json
{
  "success": false,
  "message": "Login required - No authorization token provided",
  "code": "LOGIN_REQUIRED"
}
```

### **400 Bad Request**
```json
{
  "success": false,
  "message": "message is required"
}
```

### **404 Not Found**
```json
{
  "success": false,
  "message": "Session/Ticket not found"
}
```

## 🧪 **Testing dengan Postman**

1. **Import collection**: `Chat_API_PostgreSQL.postman_collection.json`
2. **Set environment** variables:
   - `base_url`: `http://localhost:3000/v1`
   - `access_token`: (akan auto-set setelah login)
3. **Run sequence**:
   - Login Customer/Employee → auto-save token
   - Create Session → auto-save session_id  
   - Send Messages → test conversation
   - Get Messages → verify history
   - Get Summary → check session stats

## 🔄 **Features**

### ✅ **Implemented**
- JWT authentication pada semua endpoints
- Sequelize ORM dengan PostgreSQL
- Pagination dengan metadata lengkap
- Date filtering dengan `since` parameter
- Data enrichment dengan relasi (ticket, sender_type)
- Soft delete untuk messages
- Session summary dengan statistics
- Comprehensive error handling
- Input validation & sanitization

### 🚀 **Advanced Features**
- **Relational data**: Auto-include ticket & sender_type info
- **Sender validation**: Verify customer/employee exists
- **Soft delete**: Message content replaced with `[Message deleted]`
- **Session analytics**: Message count, participants, timestamps
- **Performance**: Optimized queries dengan proper indexing
- **Security**: JWT auth + input validation

## 🏗️ **Architecture**

```
┌─ Routes (chatRoutes.js)
│  ├─ Authentication middleware
│  └─ Controller methods
│
├─ Controller (chatController.js)  
│  ├─ Business logic
│  ├─ Validation
│  └─ Error handling
│
├─ Models (Sequelize)
│  ├─ chat_message.js
│  ├─ ticket.js
│  ├─ sender_type.js
│  ├─ customer.js
│  └─ employee.js
│
└─ Database (PostgreSQL)
   └─ Relational integrity
```

---

**Happy Chatting!** 🎉💬
