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

module.exports = router;