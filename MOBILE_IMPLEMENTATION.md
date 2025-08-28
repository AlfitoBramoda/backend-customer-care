# 📱 Mobile (React Native) - Chat Implementation Guide

## 🎯 Overview
Panduan lengkap implementasi real-time chat untuk aplikasi mobile customer menggunakan React Native dan Socket.IO.

## 📋 Prerequisites
- React Native CLI atau Expo CLI
- Node.js v16+
- Android Studio / Xcode
- Backend chat server running di `https://bcare.my.id:3001`

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install socket.io-client react-native-gifted-chat @react-native-async-storage/async-storage @react-native-netinfo/netinfo
```

### 2. Project Structure
```
src/
├── services/
│   └── SocketService.js          # Socket connection & chat logic
├── screens/
│   └── ChatScreen.js             # Main chat interface
├── components/
│   └── ChatHeader.js             # Custom header component
└── utils/
    └── storage.js                # Local storage utilities
```

## 🔧 Implementation Steps

### Step 1: Socket Service Setup

Create `src/services/SocketService.js`:

```javascript
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    // ⚠️ IMPORTANT: Replace with your actual server URL
    this.serverUrl = 'https://bcare.my.id:3001';
  }

  // Connect with mobile-optimized settings
  async connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io(this.serverUrl, {
      transports: ['polling'], // More stable for mobile
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

      this.socket.once('auth:ok', (data) => {
        console.log('✅ Customer authenticated:', data);
        AsyncStorage.setItem('userInfo', JSON.stringify(data));
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

### Step 2: Storage Utility

Create `src/utils/storage.js`:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  USER_INFO: 'userInfo',
  CHAT_HISTORY: 'chatHistory',
  TICKET_ID: 'ticketId'
};

export const storage = {
  async get(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  }
};
```

### Step 3: Chat Header Component

Create `src/components/ChatHeader.js`:

```javascript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ChatHeader = ({ ticketId, isConnected, onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <Text style={styles.backText}>←</Text>
    </TouchableOpacity>
    
    <View style={styles.headerInfo}>
      <Text style={styles.title}>Customer Support</Text>
      <Text style={styles.subtitle}>
        Ticket #{ticketId} • {isConnected ? '🟢 Online' : '🔴 Offline'}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 15,
  },
  backText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
});

export default ChatHeader;
```

### Step 4: Main Chat Screen

Create `src/screens/ChatScreen.js`:

```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { View, Alert, StyleSheet, AppState } from 'react-native';
import { GiftedChat, Bubble, Send } from 'react-native-gifted-chat';
import socketService from '../services/SocketService';
import { storage, StorageKeys } from '../utils/storage';
import ChatHeader from '../components/ChatHeader';

const ChatScreen = ({ route, navigation }) => {
  const { userEmail, ticketId } = route.params;
  
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeChat();
    
    // Handle app state changes
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background') {
        storage.set(StorageKeys.CHAT_HISTORY, messages);
      } else if (nextAppState === 'active') {
        if (!socketService.isConnected) {
          initializeChat();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      socketService.disconnect();
    };
  }, []);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      
      // 1. Connect to server
      await socketService.connect();
      setIsConnected(true);
      
      // 2. Authenticate customer
      await socketService.authenticateCustomer(userEmail);
      
      // 3. Join ticket room
      await socketService.joinTicket(ticketId);
      
      // 4. Load chat history
      await loadChatHistory();
      
      // 5. Setup message listeners
      setupMessageListeners();
      
    } catch (error) {
      console.error('Chat initialization failed:', error);
      Alert.alert('Connection Error', 'Failed to connect to chat server');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      const historyData = await socketService.loadHistory(ticketId);
      
      const formattedMessages = historyData.messages.map((msg, index) => ({
        _id: msg.chat_id || `history_${index}`,
        text: msg.message,
        createdAt: new Date(msg.sent_at),
        user: {
          _id: msg.sender_type_id === 1 ? 1 : 2, // 1=Customer, 2=Agent
          name: msg.sender_type_id === 1 ? 'You' : 'Customer Service',
          avatar: msg.sender_type_id === 1 ? '👤' : '👨💼'
        }
      })).reverse(); // GiftedChat expects newest first

      setMessages(formattedMessages);
      await storage.set(StorageKeys.CHAT_HISTORY, formattedMessages);
      
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // Load from cache as fallback
      const cachedHistory = await storage.get(StorageKeys.CHAT_HISTORY);
      if (cachedHistory) {
        setMessages(cachedHistory);
      }
    }
  };

  const setupMessageListeners = () => {
    // Listen for new messages from agent
    socketService.onNewMessage((data) => {
      const newMessage = {
        _id: Math.random().toString(),
        text: data.message,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Customer Service',
          avatar: '👨💼'
        }
      };
      
      setMessages(previousMessages => 
        GiftedChat.append(previousMessages, [newMessage])
      );
    });

    // Listen for errors
    socketService.onError((error) => {
      Alert.alert('Chat Error', error.message);
    });
  };

  const onSend = useCallback((messages = []) => {
    const message = messages[0];
    
    // Add to UI immediately for better UX
    setMessages(previousMessages => 
      GiftedChat.append(previousMessages, messages)
    );
    
    // Send to server
    socketService.sendMessage(ticketId, message.text);
    
  }, [ticketId]);

  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: { backgroundColor: '#007bff' },
        left: { backgroundColor: '#f1f1f1' }
      }}
      textStyle={{
        right: { color: 'white' },
        left: { color: 'black' }
      }}
    />
  );

  const renderSend = (props) => (
    <Send {...props}>
      <View style={styles.sendButton}>
        <Text style={styles.sendText}>📤</Text>
      </View>
    </Send>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Connecting to chat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ChatHeader 
        ticketId={ticketId}
        isConnected={isConnected}
        onBack={() => navigation.goBack()}
      />
      
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: 1 }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        placeholder="Type your message..."
        showUserAvatar={false}
        alwaysShowSend
        scrollToBottom
        keyboardShouldPersistTaps="never"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    marginRight: 10,
    marginBottom: 5,
  },
  sendText: {
    fontSize: 20,
  },
});

export default ChatScreen;
```

## 🔄 Usage Flow

### 1. Navigation Setup
```javascript
// In your navigation stack
import ChatScreen from './src/screens/ChatScreen';

// Navigate to chat
navigation.navigate('Chat', {
  userEmail: 'customer@example.com',
  ticketId: 123
});
```

### 2. Integration Example
```javascript
// In your main app component
const handleOpenChat = (ticketId) => {
  const userEmail = getUserEmail(); // Get from your auth system
  
  navigation.navigate('Chat', {
    userEmail,
    ticketId
  });
};
```

## ⚙️ Configuration

### 1. Server URL Configuration
Update `SocketService.js`:
```javascript
// Development
this.serverUrl = 'http://10.0.2.2:3001'; // Android emulator
this.serverUrl = 'http://localhost:3001'; // iOS simulator

// Production
this.serverUrl = 'https://bcare.my.id:3001';
```

### 2. Network Security (Android)
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<application
  android:usesCleartextTraffic="true"
  ...>
```

## 🐛 Troubleshooting

### Common Issues:

1. **Connection Failed**
   - Check server URL
   - Verify network permissions
   - Test with debug-chat.html first

2. **Messages Not Showing**
   - Check sender_type_id mapping
   - Verify ticket ID is correct
   - Check console logs

3. **Authentication Failed**
   - Verify email exists in customer table
   - Check database connection

### Debug Commands:
```javascript
// Test connection
socketService.connect().then(() => console.log('Connected'));

// Check authentication
socketService.authenticateCustomer('test@example.com');

// Test message sending
socketService.sendMessage(1, 'Test message');
```

## 📱 Platform-Specific Notes

### Android:
- Use `http://10.0.2.2:3001` for emulator
- Add network security config for HTTP
- Test on real device for production

### iOS:
- Use `http://localhost:3001` for simulator
- Add App Transport Security exception
- Test on real device for production

## 🚀 Production Checklist

- [ ] Update server URL to production
- [ ] Enable HTTPS/WSS
- [ ] Add error tracking (Sentry, Bugsnag)
- [ ] Test offline functionality
- [ ] Add push notifications for new messages
- [ ] Implement message encryption
- [ ] Add file/image sharing support

## 🔗 Related Files
- Backend server: `backend-customer-care/chatbot/chatbot/server.js`
- Test interface: `backend-customer-care/chatbot/chatbot/public/debug-chat.html`
- Socket events documentation: Check server.js for all available events

## 💡 Tips for AI Assistance

When asking AI for help, provide:
1. Specific error messages
2. Console logs
3. Code snippets that aren't working
4. Your current server URL and configuration
5. Platform (Android/iOS) and testing environment

Example prompt:
```
"I'm implementing the mobile chat using the guide above. I'm getting this error: [paste error]. Here's my current SocketService code: [paste code]. I'm testing on Android emulator with server at http://10.0.2.2:3001. Can you help debug this?"
```