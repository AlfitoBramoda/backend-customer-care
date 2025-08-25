const admin = require('firebase-admin');

class FCMService {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        try {
            if (process.env.FCM_ENABLED !== 'true') {
                console.log('FCM disabled via environment variable');
                return;
            }

            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    }),
                });
            }
            
            this.initialized = true;
            console.log('FCM Service initialized successfully');
        } catch (error) {
            console.error('FCM initialization failed:', error.message);
            this.initialized = false;
        }
    }

    async sendNotification(token, title, body, data = {}) {
        if (!this.initialized) return { success: false, error: 'FCM not initialized' };

        // Development mode: Mock FCM for testing
        if (process.env.NODE_ENV === 'development' && token.startsWith('fake-')) {
            console.log('🔔 [MOCK FCM] Notification sent:');
            console.log('   Token:', token);
            console.log('   Title:', title);
            console.log('   Body:', body);
            console.log('   Data:', data);
            return { 
                success: true, 
                messageId: `mock-message-${Date.now()}`,
                mock: true 
            };
        }

        try {
            const message = {
                notification: { title, body },
                data: this.sanitizeData(data),
                token
            };

            const response = await admin.messaging().send(message);
            return { success: true, messageId: response };
        } catch (error) {
            console.error('FCM send failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async sendBatchNotification(tokens, title, body, data = {}) {
        if (!this.initialized || !tokens.length) return { success: false };

        try {
            const message = {
                notification: { title, body },
                data: this.sanitizeData(data),
                tokens: tokens.slice(0, 500) // FCM limit
            };

            const response = await admin.messaging().sendMulticast(message);
            return {
                success: true,
                successCount: response.successCount,
                failureCount: response.failureCount
            };
        } catch (error) {
            console.error('FCM batch send failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    sanitizeData(data) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = String(value);
        }
        return sanitized;
    }
}

module.exports = new FCMService();