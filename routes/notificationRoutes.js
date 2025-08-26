const express = require('express');
const NotificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();
const notificationController = NotificationController.createInstance();

// POST /v1/notifications/register-token - Register/Update FCM Token
router.post('/register-token', 
    authenticateToken, 
    notificationController.registerToken.bind(notificationController)
);

// GET /v1/notifications/history - Get notification history
router.get('/history', 
    authenticateToken, 
    notificationController.getNotificationHistory.bind(notificationController)
);

// PUT /v1/notifications/:id/read - Mark notification as read
router.put('/:id/read', 
    authenticateToken, 
    notificationController.markAsRead.bind(notificationController)
);

// POST /v1/notifications/test - Test notification (development only)
router.post('/test', 
    authenticateToken, 
    notificationController.testNotification.bind(notificationController)
);

module.exports = router;