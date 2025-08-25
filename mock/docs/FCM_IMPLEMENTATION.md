# Firebase Cloud Messaging (FCM) Implementation

## 📋 Overview

Implementasi FCM untuk sistem notifikasi real-time pada B-Care Customer Care System. Sistem ini mengirim notifikasi push ke mobile/web client untuk berbagai event ticket.

## 🚀 Features

### ✅ Implemented
- **FCM Token Management**: Register, update, dan remove token
- **Ticket Notifications**: Create, update, escalate, close
- **SLA Monitoring**: Warning dan overdue alerts
- **Template System**: Customizable notification templates
- **Role-based Notifications**: Different messages for customer vs employee
- **Batch Notifications**: Support multiple recipients
- **Error Handling**: Retry mechanism dan graceful degradation
- **Development Testing**: Test endpoint untuk development

### 🔄 Automatic Notifications
- **Ticket Created**: Notifikasi ke customer dan assigned employee
- **Ticket Updated**: Status changes, escalations, closures
- **SLA Warnings**: 1 jam sebelum deadline
- **SLA Overdue**: Notifikasi ke employee untuk ticket overdue
- **Escalation**: Notifikasi ke target division
- **Completion**: Notifikasi closure ke customer

## 🛠 Setup Instructions

### 1. Install Dependencies
```bash
npm install firebase-admin node-cron
```

### 2. Firebase Project Setup
1. Buat Firebase project di [Firebase Console](https://console.firebase.google.com)
2. Enable Cloud Messaging
3. Generate service account key:
   - Project Settings → Service Accounts
   - Generate new private key
   - Download JSON file

### 3. Environment Configuration
Tambahkan ke `.env`:
```env
# FCM Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FCM_ENABLED=true
```

### 4. Database Schema Updates
Tambahkan field `fcm_token` ke tabel existing:
```sql
-- Customer table
ALTER TABLE customer ADD COLUMN fcm_token TEXT;

-- Employee table  
ALTER TABLE employee ADD COLUMN fcm_token TEXT;
```

## 📡 API Endpoints

### Register FCM Token
```http
POST /v1/notifications/register-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "fcm_token": "dGhpcyBpcyBhIGZha2UgRkNNIHRva2Vu..."
}
```

### Remove FCM Token
```http
DELETE /v1/notifications/remove-token
Authorization: Bearer <token>
```

### Test Notification (Development Only)
```http
POST /v1/notifications/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Test Notification",
  "body": "This is a test message"
}
```

## 🔧 Architecture

### Core Components

#### 1. FCM Service (`services/fcm_service.js`)
- Firebase Admin SDK initialization
- Send single/batch notifications
- Token validation
- Error handling

#### 2. Notification Service (`services/notification_service.js`)
- Business logic untuk different events
- Role-based notification routing
- Integration dengan template service

#### 3. Template Service (`services/template_service.js`)
- Notification message templates
- Localization support
- Dynamic content generation

#### 4. SLA Monitor Service (`services/sla_monitor_service.js`)
- Cron jobs untuk SLA monitoring
- Automated warning notifications
- Overdue ticket alerts

### Integration Points

#### Ticket Controller Integration
```javascript
// Ticket creation
await this.notificationService.notifyTicketCreated(ticket, customer, employee);

// Ticket updates
await this.notificationService.notifyTicketUpdated(ticket, customer, employee, action);

// Escalations
await this.notificationService.notifyTicketEscalated(ticket, customer, fromEmployee, toEmployee);

// Closures
await this.notificationService.notifyTicketClosed(ticket, customer, employee);
```

## 📱 Client Implementation

### Web Client (JavaScript)
```javascript
// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Get FCM token
const token = await getToken(messaging, { vapidKey: 'your-vapid-key' });

// Register token with backend
await fetch('/v1/notifications/register-token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ fcm_token: token })
});

// Listen for messages
onMessage(messaging, (payload) => {
  console.log('Message received:', payload);
  // Handle notification
});
```

### Mobile Client (React Native)
```javascript
import messaging from '@react-native-firebase/messaging';

// Request permission
const authStatus = await messaging().requestPermission();

// Get FCM token
const token = await messaging().getToken();

// Register token with backend
await fetch('/v1/notifications/register-token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ fcm_token: token })
});

// Listen for messages
messaging().onMessage(async remoteMessage => {
  console.log('FCM Message:', remoteMessage);
});
```

## 🔍 Monitoring & Analytics

### Logging
- FCM send success/failure rates
- Token validation results
- Notification delivery metrics
- Error tracking

### Health Checks
- FCM service availability
- Token validity monitoring
- SLA monitor status
- Batch notification performance

## 🚨 Error Handling

### Graceful Degradation
- FCM service failures tidak mengganggu core functionality
- Retry mechanism untuk failed notifications
- Fallback ke email notifications (jika tersedia)

### Common Issues
1. **Invalid Token**: Automatic cleanup dari database
2. **Service Unavailable**: Retry dengan exponential backoff
3. **Rate Limiting**: Batch processing dengan delays
4. **Network Issues**: Queue notifications untuk retry

## 🔒 Security Considerations

### Token Management
- FCM tokens di-encrypt at rest
- Regular token cleanup untuk inactive users
- Rate limiting untuk prevent abuse

### Data Privacy
- Minimal data dalam notification payload
- Sensitive information hanya di title/body
- GDPR compliance dengan opt-out mechanism

## 📊 Performance Optimization

### Batch Processing
- Group notifications by user type
- Maximum 500 tokens per batch (FCM limit)
- Async processing untuk large batches

### Caching
- Template caching untuk frequently used messages
- User preference caching
- Token validation caching

## 🧪 Testing

### Unit Tests
```bash
npm test -- --grep "FCM"
```

### Integration Tests
```bash
npm run test:integration -- --grep "notification"
```

### Manual Testing
1. Register FCM token via API
2. Trigger ticket events
3. Verify notifications received
4. Test SLA monitoring
5. Validate error handling

## 📈 Metrics & KPIs

### Delivery Metrics
- Notification delivery rate
- Average delivery time
- Failed notification count
- Token validity rate

### Business Metrics
- User engagement dengan notifications
- Ticket response time improvement
- Customer satisfaction correlation

## 🔄 Maintenance

### Regular Tasks
- Clean up expired tokens (monthly)
- Monitor FCM quota usage
- Update notification templates
- Review error logs

### Scaling Considerations
- Horizontal scaling untuk SLA monitor
- Database indexing untuk FCM tokens
- CDN untuk static notification assets

## 📚 References

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [FCM Server Reference](https://firebase.google.com/docs/reference/fcm/rest)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Push Notification Best Practices](https://developers.google.com/web/fundamentals/push-notifications)

---

**🎯 Production Checklist:**
- [ ] Firebase project configured
- [ ] Environment variables set
- [ ] Database schema updated
- [ ] Client integration completed
- [ ] Testing completed
- [ ] Monitoring setup
- [ ] Documentation updated