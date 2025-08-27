# Chat Persistence Testing dengan Postman

## Overview
Testing chat message persistence dari Socket.IO ke PostgreSQL database menggunakan REST API endpoints yang mudah ditest dengan Postman.

## Setup

### 1. Import Postman Collection
- Import file: `Chat_Persistence_Test.postman_collection.json`
- Base URL: `http://localhost:4000` (chatbot server)
- Backend API: `https://bcare.my.id` (customer care API)

### 2. Server Requirements
- Chatbot server running di port 4000
- Backend customer care API accessible di https://bcare.my.id

## Test Scenarios

### 1. Check Configuration
```
GET /api/test/test-config
```
**Purpose:** Validate server configuration dan auth token status

**Expected Response:**
```json
{
  "backend_api_url": "https://bcare.my.id",
  "api_token_configured": false,
  "api_token_preview": null,
  "environment": "development",
  "timestamp": "2025-08-27T..."
}
```

### 2. Test Room Format Validation
```
POST /api/test/test-room-formats
```
**Purpose:** Test regex parsing untuk berbagai format room

**Expected Response:**
```json
{
  "test_type": "room_format_validation",
  "results": [
    {
      "room": "ticket:123",
      "extracted_ticket_id": "123",
      "is_dm_room": false,
      "will_persist": true,
      "reason": "Valid ticket room"
    },
    {
      "room": "call:ticket-456",
      "extracted_ticket_id": "456", 
      "is_dm_room": false,
      "will_persist": true,
      "reason": "Valid ticket room"
    },
    {
      "room": "dm:CUS-1:EMP-2",
      "extracted_ticket_id": null,
      "is_dm_room": true,
      "will_persist": false,
      "reason": "DM room - skip persistence"
    }
  ]
}
```

### 3. Test Chat Persistence

#### 3a. Ticket Room (ticket:123)
```
POST /api/test/test-chat-persistence
Body:
{
  "room": "ticket:123",
  "message": "Test message from Postman untuk ticket room",
  "senderId": "CUS-TEST-001",
  "senderTypeId": 1,
  "authToken": "MASUKKAN_TOKEN_DISINI"
}
```

#### 3b. Call Room (call:ticket-456)  
```
POST /api/test/test-chat-persistence
Body:
{
  "room": "call:ticket-456",
  "message": "Test message from call room via Postman",
  "senderId": "EMP-TEST-001", 
  "senderTypeId": 2,
  "authToken": "MASUKKAN_TOKEN_DISINI"
}
```

#### 3c. DM Room (should skip)
```
POST /api/test/test-chat-persistence
Body:
{
  "room": "dm:CUS-1:EMP-2",
  "message": "Test DM message - should be skipped",
  "senderId": "CUS-TEST-001",
  "senderTypeId": 1
}
```

**Expected Response (DM skip):**
```json
{
  "success": true,
  "skipped": true,
  "reason": "DM room - tidak perlu persist ke database",
  "room": "dm:CUS-1:EMP-2"
}
```

#### 3d. Test Without Auth Token
```
POST /api/test/test-chat-persistence
Body:
{
  "room": "ticket:789",
  "message": "Test message tanpa auth token",
  "senderId": "CUS-TEST-002",
  "senderTypeId": 1
}
```

**Expected Response (401 error):**
```json
{
  "success": false,
  "ticketId": "789",
  "room": "ticket:789",
  "steps": [
    {
      "step": 1,
      "action": "create_session",
      "url": "https://bcare.my.id/v1/chats/sessions",
      "status": 401,
      "success": false,
      "error": "{\"success\":false,\"message\":\"Login required - No authorization token provided\",\"code\":\"LOGIN_REQUIRED\"}"
    },
    {
      "step": 2,
      "action": "save_message", 
      "url": "https://bcare.my.id/v1/chats/789/messages",
      "status": 401,
      "success": false,
      "error": "{\"success\":false,\"message\":\"Login required - No authorization token provided\",\"code\":\"LOGIN_REQUIRED\"}"
    }
  ]
}
```

### 4. Get Auth Token
```
POST https://bcare.my.id/v1/auth/login
Body:
{
  "email": "employee@bni.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {...}
  }
}
```

### 5. Test With Valid Token
Copy token dari response login, paste ke request:
```
POST /api/test/test-chat-persistence
Body:
{
  "room": "ticket:999",
  "message": "Test message dengan valid auth token",
  "senderId": "EMP-TEST-AUTH",
  "senderTypeId": 2,
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Success Response:**
```json
{
  "success": true,
  "ticketId": "999",
  "room": "ticket:999", 
  "steps": [
    {
      "step": 1,
      "action": "create_session",
      "url": "https://bcare.my.id/v1/chats/sessions",
      "status": 200,
      "success": true,
      "data": {
        "success": true,
        "message": "Chat session created/found successfully",
        "data": {...}
      }
    },
    {
      "step": 2,
      "action": "save_message",
      "url": "https://bcare.my.id/v1/chats/999/messages", 
      "status": 201,
      "success": true,
      "data": {
        "success": true,
        "message": "Message saved successfully",
        "data": {...}
      }
    }
  ]
}
```

## Field Explanations

### Request Fields
- **room**: Format room Socket.IO (`ticket:123`, `call:ticket-456`, `dm:user1:user2`)
- **message**: Isi pesan chat
- **senderId**: ID pengirim (`CUS-123`, `EMP-456`)  
- **senderTypeId**: 1=Customer, 2=Employee
- **ticketId**: Optional, akan di-extract dari room jika tidak ada
- **authToken**: JWT token untuk authenticate ke backend API

### Response Fields
- **success**: Overall status test
- **ticketId**: Extracted ticket ID
- **room**: Original room format
- **steps**: Array hasil setiap langkah (create session + save message)
- **skipped**: true jika DM room yang di-skip

## Debugging Tips

1. **Check server logs** di terminal untuk detail persistence process
2. **Validate room format** dengan endpoint `/api/test/test-room-formats`
3. **Check auth token** dengan endpoint `/api/test/test-config`
4. **Start with DM room test** untuk confirm skip logic
5. **Test tanpa token dulu** untuk confirm 401 error handling
6. **Login dan test dengan valid token** untuk end-to-end success

## Common Issues

1. **"Cannot extract ticket ID"** → Pastikan room format: `ticket:123` atau `call:ticket-456`
2. **401 Authentication errors** → Login dulu, copy token ke `authToken` field
3. **Network errors** → Pastikan backend API accessible di https://bcare.my.id
4. **Server not responding** → Pastikan chatbot server running di port 4000

## Success Indicators

✅ **DM rooms**: `"skipped": true, "reason": "DM room - tidak perlu persist ke database"`
✅ **Valid ticket rooms**: `"success": true` dengan 2 steps (session + message) status 200/201
✅ **Server logs**: `[test] ✅ Message saved successfully` muncul di console
