# 🔌 Socket.IO Connection Guide - BNI Customer Care

## 🎯 Overview
Panduan fokus untuk koneksi Socket.IO ke server chat BNI Customer Care di `https://bcare.my.id`

## 📡 Server Information
- **Server URL**: `https://bcare.my.id`
- **Protocol**: HTTPS/WSS (WebSocket Secure)
- **Port**: Default HTTPS (443)

## 📱 Mobile (React Native) Connection

### 1. Install Socket.IO Client
```bash
npm install socket.io-client
```

### 2. Socket Service for Mobile
```javascript
// services/SocketService.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.serverUrl = 'https://bcare.my.id';
  }

  // Connect to server
  async connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io(this.serverUrl, {
      transports: ['polling', 'websocket'], // Polling first for mobile stability
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      secure: true, // HTTPS connection
      rejectUnauthorized: false // For self-signed certificates if needed
    });

    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        console.log('✅ Connected to BNI Chat Server');
        this.isConnected = true;
        resolve(this.socket);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection failed:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected:', reason);
        this.isConnected = false;
      });
    });
  }

  // Customer authentication
  authenticateCustomer(email) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('auth:register', {
        userIdentifier: email,
        userType: 'customer'
      });

      this.socket.once('auth:ok', resolve);
      this.socket.once('auth:error', reject);
    });
  }

  // Join ticket room
  joinTicket(ticketId) {
    return new Promise((resolve) => {
      this.socket.emit('ticket:join', { ticketId });
      this.socket.once('ticket:joined', resolve);
    });
  }

  // Load chat history
  loadHistory(ticketId) {
    return new Promise((resolve) => {
      this.socket.emit('chat:history', { ticketId });
      this.socket.once('chat:history', resolve);
    });
  }

  // Send message
  sendMessage(ticketId, message) {
    this.socket.emit('chat:send', { ticketId, message });
  }

  // Listen for new messages
  onNewMessage(callback) {
    this.socket.on('chat:new', callback);
  }

  // Listen for errors
  onError(callback) {
    this.socket.on('chat:error', callback);
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export default new SocketService();
```

### 3. Usage in React Native Component
```javascript
import React, { useEffect, useState } from 'react';
import socketService from '../services/SocketService';

const ChatScreen = ({ userEmail, ticketId }) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initChat = async () => {
      try {
        // 1. Connect
        await socketService.connect();
        setIsConnected(true);
        
        // 2. Authenticate
        await socketService.authenticateCustomer(userEmail);
        
        // 3. Join ticket
        await socketService.joinTicket(ticketId);
        
        // 4. Load history
        const history = await socketService.loadHistory(ticketId);
        setMessages(history.messages);
        
        // 5. Listen for new messages
        socketService.onNewMessage((data) => {
          setMessages(prev => [...prev, data]);
        });
        
      } catch (error) {
        console.error('Chat init failed:', error);
        setIsConnected(false);
      }
    };

    initChat();
    
    return () => socketService.disconnect();
  }, [userEmail, ticketId]);

  const sendMessage = (text) => {
    socketService.sendMessage(ticketId, text);
  };

  // Your existing UI components here
  return (
    // Your chat UI
  );
};
```

## 🌐 Website (Next.js) Connection

### 1. Install Socket.IO Client
```bash
npm install socket.io-client
```

### 2. Socket Service for Web
```javascript
// utils/socketService.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.serverUrl = 'https://bcare.my.id';
  }

  // Connect to server
  connect() {
    if (this.socket?.connected) return Promise.resolve(this.socket);

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'], // WebSocket first for web
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      secure: true, // HTTPS connection
      autoConnect: true
    });

    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        console.log('✅ Connected to BNI Chat Server');
        this.isConnected = true;
        resolve(this.socket);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection failed:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected:', reason);
        this.isConnected = false;
      });
    });
  }

  // Employee authentication
  authenticateEmployee(npp) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('auth:register', {
        userIdentifier: npp,
        userType: 'employee'
      });

      this.socket.once('auth:ok', (data) => {
        localStorage.setItem('employeeInfo', JSON.stringify(data));
        resolve(data);
      });

      this.socket.once('auth:error', reject);
    });
  }

  // Join ticket room
  joinTicket(ticketId) {
    return new Promise((resolve) => {
      this.socket.emit('ticket:join', { ticketId });
      this.socket.once('ticket:joined', resolve);
    });
  }

  // Load chat history
  loadHistory(ticketId) {
    return new Promise((resolve) => {
      this.socket.emit('chat:history', { ticketId });
      this.socket.once('chat:history', resolve);
    });
  }

  // Send message
  sendMessage(ticketId, message) {
    this.socket.emit('chat:send', { ticketId, message });
  }

  // Event listeners
  onNewMessage(callback) {
    this.socket.on('chat:new', callback);
  }

  onError(callback) {
    this.socket.on('chat:error', callback);
  }

  onTyping(callback) {
    this.socket.on('typing', callback);
  }

  onTypingStop(callback) {
    this.socket.on('typing:stop', callback);
  }

  // Send typing indicators
  sendTyping(ticketId) {
    this.socket.emit('typing', { ticketId });
  }

  sendTypingStop(ticketId) {
    this.socket.emit('typing:stop', { ticketId });
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export default new SocketService();
```

### 3. Usage in Next.js Component
```javascript
import { useEffect, useState } from 'react';
import socketService from '../utils/socketService';

const ChatComponent = ({ employeeNpp, ticketId }) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initChat = async () => {
      try {
        // 1. Connect
        await socketService.connect();
        setIsConnected(true);
        
        // 2. Authenticate
        await socketService.authenticateEmployee(employeeNpp);
        
        // 3. Join ticket
        await socketService.joinTicket(ticketId);
        
        // 4. Load history
        const history = await socketService.loadHistory(ticketId);
        setMessages(history.messages);
        
        // 5. Listen for new messages
        socketService.onNewMessage((data) => {
          setMessages(prev => [...prev, data]);
        });
        
      } catch (error) {
        console.error('Chat init failed:', error);
        setIsConnected(false);
      }
    };

    initChat();
    
    return () => socketService.disconnect();
  }, [employeeNpp, ticketId]);

  const sendMessage = (text) => {
    socketService.sendMessage(ticketId, text);
  };

  // Your existing UI components here
  return (
    // Your chat UI
  );
};
```

## 🔄 Socket Events Flow

### 1. Connection & Authentication
```javascript
// 1. Connect to server
await socketService.connect();

// 2. Authenticate user
// For Customer:
await socketService.authenticateCustomer('customer@example.com');

// For Employee:
await socketService.authenticateEmployee('12345');
```

### 2. Join Ticket & Load History
```javascript
// 3. Join ticket room
await socketService.joinTicket(ticketId);

// 4. Load chat history
const history = await socketService.loadHistory(ticketId);
```

### 3. Real-time Messaging
```javascript
// Send message
socketService.sendMessage(ticketId, 'Hello, how can I help?');

// Listen for new messages
socketService.onNewMessage((data) => {
  console.log('New message:', data);
  // data contains: message, senderType, senderId, timestamp, etc.
});
```

## 🔧 Connection Configuration

### Environment Variables
```env
# For Next.js (.env.local)
NEXT_PUBLIC_CHAT_SERVER_URL=https://bcare.my.id

# For React Native (.env)
CHAT_SERVER_URL=https://bcare.my.id
```

### Network Configuration

#### For React Native (Android)
Add to `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">bcare.my.id</domain>
    </domain-config>
</network-security-config>
```

#### For React Native (iOS)
Add to `ios/YourApp/Info.plist`:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSExceptionDomains</key>
    <dict>
        <key>bcare.my.id</key>
        <dict>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <false/>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>TLSv1.0</string>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

## 🐛 Troubleshooting

### Common Connection Issues

1. **CORS Error**
   ```
   Error: Cross-Origin Request Blocked
   ```
   **Solution**: Server sudah dikonfigurasi untuk CORS, pastikan menggunakan HTTPS

2. **SSL Certificate Error**
   ```
   Error: certificate verify failed
   ```
   **Solution**: Tambahkan `rejectUnauthorized: false` di config socket (development only)

3. **Connection Timeout**
   ```
   Error: timeout
   ```
   **Solution**: Periksa network connectivity dan firewall

### Debug Connection
```javascript
// Test connection manually
const testConnection = async () => {
  try {
    console.log('Testing connection to https://bcare.my.id...');
    
    const socket = io('https://bcare.my.id', {
      transports: ['polling'],
      timeout: 10000
    });
    
    socket.on('connect', () => {
      console.log('✅ Connection successful!');
      console.log('Socket ID:', socket.id);
      console.log('Transport:', socket.io.engine.transport.name);
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Connection failed:', error);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run test
testConnection();
```

### Network Diagnostics
```javascript
// Check if server is reachable
const checkServer = async () => {
  try {
    const response = await fetch('https://bcare.my.id/socket-status');
    const data = await response.json();
    console.log('Server status:', data);
  } catch (error) {
    console.error('Server unreachable:', error);
  }
};
```

## 📋 Quick Integration Checklist

### For Mobile (React Native):
- [ ] Install `socket.io-client`
- [ ] Create SocketService with `https://bcare.my.id`
- [ ] Configure network security for HTTPS
- [ ] Test connection with customer email
- [ ] Implement message sending/receiving

### For Website (Next.js):
- [ ] Install `socket.io-client`
- [ ] Create SocketService with `https://bcare.my.id`
- [ ] Set environment variable
- [ ] Test connection with employee NPP
- [ ] Implement message sending/receiving

### Authentication Data:
- **Customer**: Use email from customer table
- **Employee**: Use NPP from employee table
- **Ticket ID**: Get from your ticket system

## 💡 Tips for Implementation

1. **Always connect first** before authentication
2. **Handle connection errors** gracefully
3. **Use polling transport** for mobile stability
4. **Store user info** in localStorage/AsyncStorage after auth
5. **Clean up connections** on component unmount
6. **Test with real data** from your database

## 🔗 Test Your Connection

Use the debug interface at: `https://bcare.my.id/debug-chat`

This will help you verify:
- Server connectivity
- Authentication flow
- Message sending/receiving
- Real-time updates

## 📞 Support

If you encounter issues:
1. Check browser/app console for errors
2. Test with debug-chat.html first
3. Verify your email/NPP exists in database
4. Check network connectivity to https://bcare.my.id