# 🌐 Website (Next.js) - Chat Implementation Guide

## 🎯 Overview
Panduan lengkap implementasi real-time chat untuk dashboard employee menggunakan Next.js dan Socket.IO.

## 📋 Prerequisites
- Next.js 13+ (App Router atau Pages Router)
- Node.js v16+
- Backend chat server running di `https://bcare.my.id:3001`

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install socket.io-client
```

### 2. Project Structure
```
src/
├── utils/
│   └── socketService.js          # Socket connection & chat logic
├── components/
│   ├── ChatWindow.jsx            # Main chat component
│   ├── MessageBubble.jsx         # Individual message component
│   └── ChatHeader.jsx            # Chat header with status
├── hooks/
│   └── useChat.js                # Custom chat hook
└── pages/ (or app/)
    └── tickets/
        └── [ticketId]/
            └── chat.js           # Chat page
```

## 🔧 Implementation Steps

### Step 1: Socket Service Setup

Create `src/utils/socketService.js`:

```javascript
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    // ⚠️ IMPORTANT: Replace with your actual server URL
    this.serverUrl = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:3001';
  }

  // Connect with web-optimized settings
  connect() {
    if (this.socket?.connected) return Promise.resolve(this.socket);

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        console.log('✅ Connected to chat server');
        this.isConnected = true;
        resolve(this.socket);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection failed:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
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
        console.log('✅ Employee authenticated:', data);
        // Store in localStorage for persistence
        localStorage.setItem('employeeInfo', JSON.stringify(data));
        resolve(data);
      });

      this.socket.once('auth:error', (error) => {
        console.error('❌ Auth failed:', error);
        reject(error);
      });
    });
  }

  // Join ticket room
  joinTicket(ticketId) {
    return new Promise((resolve) => {
      this.socket.emit('ticket:join', { ticketId });
      
      this.socket.once('ticket:joined', (data) => {
        console.log('🎫 Joined ticket room:', data);
        resolve(data);
      });
    });
  }

  // Load chat history
  loadHistory(ticketId) {
    return new Promise((resolve) => {
      this.socket.emit('chat:history', { ticketId });
      
      this.socket.once('chat:history', (data) => {
        console.log('📜 History loaded:', data.messages.length, 'messages');
        resolve(data);
      });
    });
  }

  // Send message
  sendMessage(ticketId, message) {
    this.socket.emit('chat:send', {
      ticketId,
      message
    });
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

  // Send typing indicator
  sendTyping(ticketId) {
    this.socket.emit('typing', { ticketId });
  }

  sendTypingStop(ticketId) {
    this.socket.emit('typing:stop', { ticketId });
  }

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

### Step 2: Custom Chat Hook

Create `src/hooks/useChat.js`:

```javascript
import { useState, useEffect, useCallback } from 'react';
import socketService from '../utils/socketService';

export const useChat = (ticketId, employeeNpp) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  // Initialize chat connection
  const initializeChat = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 1. Connect to server
      await socketService.connect();
      setIsConnected(true);
      
      // 2. Authenticate employee
      await socketService.authenticateEmployee(employeeNpp);
      
      // 3. Join ticket room
      await socketService.joinTicket(ticketId);
      
      // 4. Load chat history
      const historyData = await socketService.loadHistory(ticketId);
      const formattedMessages = historyData.messages.map(msg => ({
        id: msg.chat_id,
        text: msg.message,
        timestamp: new Date(msg.sent_at),
        isOwn: msg.sender_type_id === 2, // Employee messages
        senderType: msg.sender_type_id === 1 ? 'Customer' : 'Agent',
        senderId: msg.sender_id
      }));
      
      setMessages(formattedMessages);
      
    } catch (error) {
      console.error('Chat initialization failed:', error);
      setError(error.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, employeeNpp]);

  // Send message
  const sendMessage = useCallback((messageText) => {
    if (!messageText.trim()) return;
    
    // Add to UI immediately
    const newMessage = {
      id: Date.now(),
      text: messageText,
      timestamp: new Date(),
      isOwn: true,
      senderType: 'Agent',
      senderId: 'current_employee'
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Send to server
    socketService.sendMessage(ticketId, messageText);
  }, [ticketId]);

  // Setup event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Listen for new messages
    const handleNewMessage = (data) => {
      const newMessage = {
        id: Date.now(),
        text: data.message,
        timestamp: new Date(),
        isOwn: false,
        senderType: data.senderType === 'customer' ? 'Customer' : 'Agent',
        senderId: data.senderId
      };
      
      setMessages(prev => [...prev, newMessage]);
    };

    // Listen for typing indicators
    const handleTyping = (data) => {
      if (data.userType === 'customer') {
        setIsTyping(true);
      }
    };

    const handleTypingStop = () => {
      setIsTyping(false);
    };

    // Listen for errors
    const handleError = (error) => {
      setError(error.message);
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onTyping(handleTyping);
    socketService.onTypingStop(handleTypingStop);
    socketService.onError(handleError);

    return () => {
      // Cleanup listeners
      socketService.socket?.off('chat:new', handleNewMessage);
      socketService.socket?.off('typing', handleTyping);
      socketService.socket?.off('typing:stop', handleTypingStop);
      socketService.socket?.off('chat:error', handleError);
    };
  }, [isConnected]);

  // Initialize on mount
  useEffect(() => {
    initializeChat();
    
    return () => {
      socketService.disconnect();
    };
  }, [initializeChat]);

  return {
    messages,
    isConnected,
    isLoading,
    isTyping,
    error,
    sendMessage,
    reconnect: initializeChat
  };
};
```

### Step 3: Message Bubble Component

Create `src/components/MessageBubble.jsx`:

```javascript
import React from 'react';
import styles from './MessageBubble.module.css';

const MessageBubble = ({ message }) => {
  const { text, timestamp, isOwn, senderType } = message;
  
  return (
    <div className={`${styles.messageContainer} ${isOwn ? styles.own : styles.other}`}>
      <div className={`${styles.bubble} ${isOwn ? styles.ownBubble : styles.otherBubble}`}>
        <div className={styles.messageText}>{text}</div>
        <div className={styles.messageTime}>
          {timestamp.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
      {!isOwn && (
        <div className={styles.senderLabel}>{senderType}</div>
      )}
    </div>
  );
};

export default MessageBubble;
```

Create `src/components/MessageBubble.module.css`:

```css
.messageContainer {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  max-width: 70%;
}

.own {
  align-self: flex-end;
  align-items: flex-end;
}

.other {
  align-self: flex-start;
  align-items: flex-start;
}

.bubble {
  padding: 12px 16px;
  border-radius: 18px;
  word-wrap: break-word;
  position: relative;
}

.ownBubble {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
}

.otherBubble {
  background: #f1f3f4;
  color: #333;
  border: 1px solid #e1e5e9;
}

.messageText {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.messageTime {
  font-size: 11px;
  opacity: 0.7;
  text-align: right;
}

.senderLabel {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
  margin-left: 8px;
}
```

### Step 4: Chat Header Component

Create `src/components/ChatHeader.jsx`:

```javascript
import React from 'react';
import styles from './ChatHeader.module.css';

const ChatHeader = ({ ticketId, isConnected, customerInfo, onClose }) => {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <button onClick={onClose} className={styles.closeButton}>
          ←
        </button>
        <div className={styles.headerInfo}>
          <h3 className={styles.title}>
            Ticket #{ticketId}
          </h3>
          <p className={styles.subtitle}>
            {customerInfo?.full_name || 'Customer'} • 
            <span className={`${styles.status} ${isConnected ? styles.online : styles.offline}`}>
              {isConnected ? '🟢 Online' : '🔴 Offline'}
            </span>
          </p>
        </div>
      </div>
      
      <div className={styles.headerActions}>
        <button className={styles.actionButton} title="Call Customer">
          📞
        </button>
        <button className={styles.actionButton} title="View Ticket Details">
          📋
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
```

Create `src/components/ChatHeader.module.css`:

```css
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e1e5e9;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: 12px;
}

.closeButton {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.closeButton:hover {
  background-color: #f1f3f4;
}

.headerInfo {
  display: flex;
  flex-direction: column;
}

.title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.subtitle {
  margin: 0;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status {
  font-size: 11px;
}

.online {
  color: #28a745;
}

.offline {
  color: #dc3545;
}

.headerActions {
  display: flex;
  gap: 8px;
}

.actionButton {
  background: none;
  border: 1px solid #e1e5e9;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.actionButton:hover {
  background-color: #f8f9fa;
  border-color: #007bff;
}
```

### Step 5: Main Chat Window Component

Create `src/components/ChatWindow.jsx`:

```javascript
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import styles from './ChatWindow.module.css';

const ChatWindow = ({ ticketId, employeeNpp, onClose }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTypingMessage, setIsTypingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const {
    messages,
    isConnected,
    isLoading,
    isTyping,
    error,
    sendMessage,
    reconnect
  } = useChat(ticketId, employeeNpp);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle message input
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (!isTypingMessage) {
      setIsTypingMessage(true);
      socketService.sendTyping(ticketId);
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingMessage(false);
      socketService.sendTypingStop(ticketId);
    }, 2000);
  };

  // Handle send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    sendMessage(newMessage);
    setNewMessage('');
    
    // Stop typing indicator
    if (isTypingMessage) {
      setIsTypingMessage(false);
      socketService.sendTypingStop(ticketId);
    }
    
    // Focus back to input
    inputRef.current?.focus();
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Connecting to chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>❌ Connection Error: {error}</p>
        <button onClick={reconnect} className={styles.retryButton}>
          🔄 Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      <ChatHeader
        ticketId={ticketId}
        isConnected={isConnected}
        onClose={onClose}
      />
      
      <div className={styles.messagesContainer}>
        <div className={styles.messagesList}>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isTyping && (
            <div className={styles.typingIndicator}>
              <div className={styles.typingDots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>Customer is typing...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <form onSubmit={handleSendMessage} className={styles.inputContainer}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your response..."
            className={styles.messageInput}
            rows={1}
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className={styles.sendButton}
          >
            📤
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
```

Create `src/components/ChatWindow.module.css`:

```css
.chatWindow {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.loadingContainer,
.errorContainer {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
  gap: 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retryButton {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.messagesContainer {
  flex: 1;
  overflow: hidden;
  background: #f8f9fa;
}

.messagesList {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.typingIndicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f1f3f4;
  border-radius: 18px;
  margin-bottom: 16px;
  max-width: 200px;
  font-size: 12px;
  color: #666;
}

.typingDots {
  display: flex;
  gap: 4px;
}

.typingDots span {
  width: 6px;
  height: 6px;
  background: #666;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typingDots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typingDots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
}

.inputContainer {
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #e1e5e9;
}

.inputWrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.messageInput {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e1e5e9;
  border-radius: 20px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  max-height: 120px;
  outline: none;
  transition: border-color 0.2s;
}

.messageInput:focus {
  border-color: #007bff;
}

.messageInput:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.sendButton {
  padding: 12px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
  min-width: 48px;
}

.sendButton:hover:not(:disabled) {
  background: #0056b3;
}

.sendButton:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
```

### Step 6: Chat Page Implementation

Create `src/pages/tickets/[ticketId]/chat.js` (Pages Router):

```javascript
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ChatWindow from '../../../components/ChatWindow';

export default function ChatPage() {
  const router = useRouter();
  const { ticketId } = router.query;
  const [employeeNpp, setEmployeeNpp] = useState(null);

  useEffect(() => {
    // Get employee info from your auth system
    const getEmployeeInfo = () => {
      // Replace with your actual auth logic
      const employeeInfo = localStorage.getItem('employeeInfo');
      if (employeeInfo) {
        const parsed = JSON.parse(employeeInfo);
        setEmployeeNpp(parsed.npp || parsed.userIdentifier);
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    };

    if (ticketId) {
      getEmployeeInfo();
    }
  }, [ticketId, router]);

  const handleCloseChat = () => {
    router.push('/tickets');
  };

  if (!ticketId || !employeeNpp) {
    return <div>Loading...</div>;
  }

  return (
    <ChatWindow
      ticketId={parseInt(ticketId)}
      employeeNpp={employeeNpp}
      onClose={handleCloseChat}
    />
  );
}
```

Or for App Router, create `src/app/tickets/[ticketId]/chat/page.js`:

```javascript
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatWindow from '../../../../components/ChatWindow';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { ticketId } = params;
  const [employeeNpp, setEmployeeNpp] = useState(null);

  useEffect(() => {
    const getEmployeeInfo = () => {
      const employeeInfo = localStorage.getItem('employeeInfo');
      if (employeeInfo) {
        const parsed = JSON.parse(employeeInfo);
        setEmployeeNpp(parsed.npp || parsed.userIdentifier);
      } else {
        router.push('/login');
      }
    };

    if (ticketId) {
      getEmployeeInfo();
    }
  }, [ticketId, router]);

  const handleCloseChat = () => {
    router.push('/tickets');
  };

  if (!ticketId || !employeeNpp) {
    return <div>Loading...</div>;
  }

  return (
    <ChatWindow
      ticketId={parseInt(ticketId)}
      employeeNpp={employeeNpp}
      onClose={handleCloseChat}
    />
  );
}
```

## 🔄 Usage Flow

### 1. Environment Configuration
Create `.env.local`:
```env
NEXT_PUBLIC_CHAT_SERVER_URL=http://localhost:3001
```

### 2. Integration in Ticket List
```javascript
// In your ticket list component
const handleOpenChat = (ticketId) => {
  router.push(`/tickets/${ticketId}/chat`);
};

// Or open in modal/sidebar
const [selectedTicket, setSelectedTicket] = useState(null);

return (
  <div>
    {/* Ticket list */}
    {tickets.map(ticket => (
      <div key={ticket.id}>
        <button onClick={() => setSelectedTicket(ticket.id)}>
          Chat with Customer
        </button>
      </div>
    ))}
    
    {/* Chat modal/sidebar */}
    {selectedTicket && (
      <ChatWindow
        ticketId={selectedTicket}
        employeeNpp={currentEmployee.npp}
        onClose={() => setSelectedTicket(null)}
      />
    )}
  </div>
);
```

## ⚙️ Configuration

### 1. Environment Variables
```env
# Development
NEXT_PUBLIC_CHAT_SERVER_URL=http://localhost:3001

# Production
NEXT_PUBLIC_CHAT_SERVER_URL=https://bcare.my.id:3001
```

### 2. Next.js Configuration
Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable WebSocket support
  experimental: {
    esmExternals: false,
  },
  // For Socket.IO client
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
```

## 🐛 Troubleshooting

### Common Issues:

1. **Socket.IO Connection Failed**
   ```javascript
   // Check browser console for errors
   // Verify server URL in .env.local
   // Test with debug-chat.html first
   ```

2. **Messages Not Displaying Correctly**
   ```javascript
   // Check sender_type_id mapping in useChat hook
   // Verify isOwn logic: msg.sender_type_id === 2 for employees
   ```

3. **Authentication Issues**
   ```javascript
   // Verify NPP exists in employee table
   // Check localStorage for employeeInfo
   ```

### Debug Tools:
```javascript
// Add to SocketService for debugging
console.log('Socket events:', this.socket.eventNames());

// Test connection manually
socketService.connect().then(() => {
  console.log('Connected successfully');
  socketService.authenticateEmployee('12345');
});
```

## 🚀 Production Checklist

- [ ] Update server URL to production HTTPS
- [ ] Enable WSS (WebSocket Secure)
- [ ] Add error boundary components
- [ ] Implement proper authentication flow
- [ ] Add message encryption
- [ ] Set up monitoring and logging
- [ ] Add typing indicators
- [ ] Implement file sharing
- [ ] Add emoji support
- [ ] Set up push notifications

## 🔗 Related Files
- Backend server: `backend-customer-care/chatbot/chatbot/server.js`
- Test interface: `backend-customer-care/chatbot/chatbot/public/debug-chat.html`
- Mobile implementation: `MOBILE_IMPLEMENTATION.md`

## 💡 Tips for AI Assistance

When asking AI for help, provide:
1. Specific error messages from browser console
2. Network tab showing WebSocket/Socket.IO requests
3. Code snippets that aren't working
4. Your current environment configuration
5. Browser and Next.js version

Example prompt:
```
"I'm implementing the Next.js chat using the guide above. The socket connection fails with this error: [paste error]. Here's my socketService code: [paste code]. I'm using Next.js 13 with App Router. The server is running at http://localhost:3001. Can you help debug this?"
```

## 🎨 Customization Options

### Themes:
```css
/* Add to your global CSS */
:root {
  --chat-primary: #007bff;
  --chat-secondary: #6c757d;
  --chat-success: #28a745;
  --chat-danger: #dc3545;
  --chat-bg: #f8f9fa;
}
```

### Custom Message Types:
```javascript
// Extend MessageBubble for different message types
const MessageBubble = ({ message }) => {
  if (message.type === 'system') {
    return <SystemMessage message={message} />;
  }
  if (message.type === 'file') {
    return <FileMessage message={message} />;
  }
  // ... default message bubble
};
```