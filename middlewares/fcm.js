class FCMMiddleware {
    static updateFCMToken(req, res, next) {
        try {
            const { fcm_token } = req.body;
            
            if (fcm_token && req.user) {
                // Add FCM token to user object for use in controllers
                req.user.fcm_token = fcm_token;
            }
            
            next();
        } catch (error) {
            console.error('FCM middleware error:', error.message);
            next(); // Continue even if FCM fails
        }
    }

    static extractFCMToken(req, res, next) {
        try {
            const fcmToken = req.headers['x-fcm-token'] || req.body.fcm_token;
            
            if (fcmToken && req.user) {
                req.user.fcm_token = fcmToken;
            }
            
            next();
        } catch (error) {
            console.error('FCM token extraction error:', error.message);
            next();
        }
    }
}

module.exports = FCMMiddleware;