const express = require('express');
const NotificationController = require('../controllers/notification_controller');
const { authenticateToken } = require('../middlewares/auth');

const createNotificationRoutes = (db) => {
    const router = express.Router();
    const notificationController = NotificationController.createInstance(db);
    
    // POST /v1/notifications/register-token - Register/Update FCM Token
    router.post('/register-token', 
        authenticateToken, 
        notificationController.registerToken.bind(notificationController)
    );
    
    // DELETE /v1/notifications/remove-token - Remove FCM Token (logout)
    router.delete('/remove-token', 
        authenticateToken, 
        notificationController.removeToken.bind(notificationController)
    );
    
    // POST /v1/notifications/test - Test notification (development only)
    router.post('/test', 
        authenticateToken, 
        notificationController.testNotification.bind(notificationController)
    );
    
    return router;
};

module.exports = createNotificationRoutes;