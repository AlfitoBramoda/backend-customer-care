# 📊 Status Tracking Case - Ticket ID 1

## 🎯 Overview
Case ini menunjukkan bagaimana sistem melacak perubahan status ticket dari awal sampai akhir dengan memisahkan **Customer Status** dan **Employee Status**.

## 📋 Ticket Information
- **Ticket ID**: 1
- **Ticket Number**: BNI-00001  
- **Description**: Kartu nasabah tertelan di ATM
- **Customer**: Andi Saputra (customer_id: 1)
- **Channel**: ATM (channel_id: 1)
- **Created**: 2025-08-14T08:15:00Z

## 🔄 Complete Status Journey

### 👤 Customer Status Timeline
```
1. ACC (Accepted) ────────────────────── Initial Status
   ├─ Changed by: Budi Hartono
   ├─ Time: 2025-08-14T08:15:00Z
   └─ Activity ID: 5

2. VERIF (Verification) ─────────────── Customer Verification
   ├─ Changed by: Budi Hartono  
   ├─ Time: 2025-08-14T09:30:00Z
   └─ Activity ID: 6

3. PROCESS (Processing) ────────────── Under Processing
   ├─ Changed by: Budi Hartono
   ├─ Time: 2025-08-14T14:20:00Z
   └─ Activity ID: 8

4. CLOSED (Closed) ─────────────────── Final Status
   ├─ Changed by: Budi Hartono
   ├─ Time: 2025-08-15T16:30:00Z
   └─ Activity ID: 10
```

### 👨💼 Employee Status Timeline  
```
1. OPEN (Open) ──────────────────────── Initial Status
   ├─ Changed by: Budi Hartono
   ├─ Time: 2025-08-14T08:15:00Z
   └─ Activity ID: 5

2. HANDLEDCXC (Handled by CxC) ─────── Agent Handling
   ├─ Changed by: Budi Hartono
   ├─ Time: 2025-08-14T10:15:00Z
   └─ Activity ID: 7

3. ESCALATED (Escalated) ───────────── Escalated to Division
   ├─ Changed by: Budi Hartono
   ├─ Time: 2025-08-14T14:20:00Z
   └─ Activity ID: 8

4. DONE_BY_UIC (Done by UIC) ───────── UIC Completed
   ├─ Changed by: Lina Oktavia
   ├─ Time: 2025-08-15T11:45:00Z
   └─ Activity ID: 9

5. CLOSED (Closed) ─────────────────── Final Status
   ├─ Changed by: Budi Hartono
   ├─ Time: 2025-08-15T16:30:00Z
   └─ Activity ID: 10
```

## 🔍 How to Test

### 1. Get Ticket Detail with Status History
```bash
GET /v1/tickets/1
Authorization: Bearer {employee_token}
```

**Response Structure:**
```json
{
  "data": {
    "ticket_id": 1,
    "ticket_number": "BNI-00001",
    "current_status": {
      "customer_status": {
        "customer_status_code": "CLOSED",
        "customer_status_name": "Closed"
      },
      "employee_status": {
        "employee_status_code": "CLOSED", 
        "employee_status_name": "Closed"
      }
    },
    "status_history": {
      "customer_status_history": [...],
      "employee_status_history": [...]
    }
  }
}
```

### 2. Get Status Change Activities Only
```bash
GET /v1/tickets/1/activities?activity_type=STATUS_CHANGE
Authorization: Bearer {employee_token}
```

### 3. Run Test Script
```bash
cd backend-customer-care
node test-status-history.js
```

## 💡 Key Features

### ✅ Separated Status Tracking
- **Customer Status**: Customer-facing status (ACC → VERIF → PROCESS → CLOSED)
- **Employee Status**: Internal workflow status (OPEN → HANDLEDCXC → ESCALATED → DONE_BY_UIC → CLOSED)

### ✅ Complete Audit Trail
- Who changed the status
- When it was changed  
- Link to original activity
- Initial status marker

### ✅ Smart Parsing
- Extracts status changes from activity content
- Handles multiple status changes in one activity
- Maps status codes to readable names

### ✅ Timeline Visualization
- Chronological order
- Duration between changes
- Clear progression path

## 🎨 Frontend Implementation Examples

### Timeline Component
```javascript
// Combine both histories for complete timeline
const allStatusChanges = [
  ...ticket.status_history.customer_status_history.map(s => ({
    ...s, 
    type: 'customer',
    color: 'blue'
  })),
  ...ticket.status_history.employee_status_history.map(s => ({
    ...s, 
    type: 'employee', 
    color: 'green'
  }))
].sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
```

### Status Badge Component
```javascript
const getStatusBadge = (statusCode, type) => {
  const colors = {
    customer: {
      'ACC': 'bg-blue-100 text-blue-800',
      'VERIF': 'bg-yellow-100 text-yellow-800', 
      'PROCESS': 'bg-orange-100 text-orange-800',
      'CLOSED': 'bg-green-100 text-green-800'
    },
    employee: {
      'OPEN': 'bg-gray-100 text-gray-800',
      'HANDLEDCXC': 'bg-blue-100 text-blue-800',
      'ESCALATED': 'bg-purple-100 text-purple-800',
      'DONE_BY_UIC': 'bg-indigo-100 text-indigo-800',
      'CLOSED': 'bg-green-100 text-green-800'
    }
  };
  
  return colors[type][statusCode] || 'bg-gray-100 text-gray-800';
};
```

## 🚀 Benefits

1. **Complete Visibility**: Tim FE bisa melihat perjalanan lengkap ticket
2. **Separated Concerns**: Status customer vs employee terpisah jelas
3. **Audit Trail**: Siapa, kapan, dan kenapa status berubah
4. **Real-time Updates**: Bisa diintegrasikan dengan WebSocket
5. **Easy Integration**: Response structure yang konsisten

---

**🎉 Status tracking sekarang sudah lengkap dan siap digunakan oleh tim Frontend!**