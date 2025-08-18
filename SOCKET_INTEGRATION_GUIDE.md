# 🚀 Socket.IO Integration Guide - B-Care Backend

## 📢 Update Penting untuk Tim

Socket.IO telah **diintegrasikan ke dalam server utama**. Tidak perlu lagi menjalankan server terpisah di port 4000!

## 🔄 Perubahan yang Diperlukan

### 1. **Update Environment Variables**

**❌ Sebelumnya:**
```env
EXPO_PUBLIC_API_URL=https://4af813bf189d.ngrok-free.app
EXPO_PUBLIC_SOCKET_URL=http://192.168.49.151:4000
```

**✅ Sekarang:**
```env
EXPO_PUBLIC_API_URL=https://4af813bf189d.ngrok-free.app
EXPO_PUBLIC_SOCKET_URL=https://4af813bf189d.ngrok-free.app
```

### 2. **Update Client Connection**

**❌ Sebelumnya:**
```javascript
const socket = io('http://192.168.49.151:4000');
```

**✅ Sekarang:**
```javascript
const socket = io('https://4af813bf189d.ngrok-free.app');
```

## 🌐 Endpoint Baru

| **Fungsi** | **Method** | **URL** |
|------------|------------|---------|
| Socket.IO Connection | WebSocket | `wss://4af813bf189d.ngrok-free.app/socket.io` |
| Socket Status | GET | `https://4af813bf189d.ngrok-free.app/socket/status` |
| Online Users | GET | `https://4af813bf189d.ngrok-free.app/v1/socket/users/online` |
| Send Message | POST | `https://4af813bf189d.ngrok-free.app/v1/socket/message/send` |
| Room Info | GET | `https://4af813bf189d.ngrok-free.app/v1/socket/room/{roomId}/info` |
| Test Client | Browser | `https://4af813bf189d.ngrok-free.app/client-example.html` |

## 🧪 Testing & Debugging

### **1. Cek Status Socket.IO**
```bash
curl https://4af813bf189d.ngrok-free.app/socket/status
```

**Response:**
```json
{
  "success": true,
  "socketIO": "active",
  "connectedClients": 2,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **2. Lihat User Online**
```bash
curl https://4af813bf189d.ngrok-free.app/v1/socket/users/online
```

### **3. Kirim Pesan via REST (untuk testing)**
```bash
curl -X POST https://4af813bf189d.ngrok-free.app/v1/socket/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "room": "dm:user123:user456",
    "message": "Hello from REST API!",
    "fromUserId": "system"
  }'
```

### **4. Test Client HTML**
Buka browser: `https://4af813bf189d.ngrok-free.app/client-example.html`

## 💻 Socket.IO Events (Tidak Berubah)

### **Authentication**
```javascript
// Register user
socket.emit('auth:register', { userId: 'user123' });

// Listen for auth confirmation
socket.on('auth:ok', (data) => {
  console.log('Authenticated as:', data.userId);
});
```

### **Direct Messaging**
```javascript
// Open DM with another user
socket.emit('dm:open', { toUserId: 'user456' });

// Join DM room
socket.emit('dm:join', { room: 'dm:user123:user456' });

// Send chat message
socket.emit('chat:send', {
  room: 'dm:user123:user456',
  message: 'Hello!',
  fromUserId: 'user123',
  timestamp: new Date().toISOString()
});

// Listen for new messages
socket.on('chat:new', (msg) => {
  console.log('New message:', msg);
});
```

### **Presence & Room Management**
```javascript
// Get presence in room
socket.emit('presence:get', { room: 'dm:user123:user456' });

// Listen for presence updates
socket.on('presence:list', (data) => {
  console.log('Users in room:', data.peers);
});
```

### **Mock Call System**
```javascript
// Invite to call
socket.emit('call:invite', { room: 'dm:user123:user456' });

// Accept/decline call
socket.emit('call:accept', { room: 'dm:user123:user456' });
socket.emit('call:decline', { room: 'dm:user123:user456' });

// Listen for call events
socket.on('call:ringing', (data) => {
  console.log('Incoming call from:', data.fromUserId);
});
```

## ✅ Keuntungan Integrasi

- 🎯 **Satu Server** - REST API dan Socket.IO di tempat yang sama
- 🔒 **HTTPS Support** - Secure connection via ngrok
- 🚫 **No Port Management** - Tidak perlu manage multiple ports
- 🌐 **Same CORS Policy** - Tidak ada masalah cross-origin
- 🛠 **Better Debugging** - REST endpoints untuk monitoring
- 📊 **Integrated Monitoring** - Status dan metrics terpusat

## 🚨 Action Items untuk Tim

1. **Update environment variables** di project masing-masing
2. **Update socket connection URL** di kode client
3. **Test connection** menggunakan endpoint status
4. **Hapus referensi** ke server socket terpisah (port 4000)

## 📞 Support

Jika ada masalah atau pertanyaan:
1. Cek status server: `GET /socket/status`
2. Test dengan HTML client: `/client-example.html`
3. Hubungi tim backend untuk troubleshooting

---

**🎉 Happy Coding! Socket.IO sudah ready untuk digunakan di production!**