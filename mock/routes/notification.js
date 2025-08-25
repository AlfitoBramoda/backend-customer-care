const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { HTTP_STATUS } = require('../constants/statusCodes');

function createNotificationRoutes(db) {
    // Register/Update FCM Token
    router.post('/register-token', authenticateToken, async (req, res, next) => {
        try {
            const { fcm_token } = req.body;
            
            if (!fcm_token) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'FCM token is required'
                });
            }

            // Update user's FCM token based on role
            if (req.user.role === 'customer') {
                db.get('customer')
                    .find({ customer_id: req.user.id })
                    .assign({ fcm_token: fcm_token })
                    .write();
            } else if (req.user.role === 'employee') {
                db.get('employee')
                    .find({ employee_id: req.user.id })
                    .assign({ fcm_token: fcm_token })
                    .write();
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'FCM token registered successfully'
            });

        } catch (error) {
            next(error);
        }
    });

    // Remove FCM Token (logout)
    router.delete('/remove-token', authenticateToken, async (req, res, next) => {
        try {
            // Remove user's FCM token based on role
            if (req.user.role === 'customer') {
                db.get('customer')
                    .find({ customer_id: req.user.id })
                    .assign({ fcm_token: null })
                    .write();
            } else if (req.user.role === 'employee') {
                db.get('employee')
                    .find({ employee_id: req.user.id })
                    .assign({ fcm_token: null })
                    .write();
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'FCM token removed successfully'
            });

        } catch (error) {
            next(error);
        }
    });

    // Test notification (development only)
    if (process.env.NODE_ENV !== 'production') {
        router.post('/test', authenticateToken, async (req, res, next) => {
            try {
                const { title, body } = req.body;
                const fcmService = require('../services/fcm_service');
                
                let user;
                if (req.user.role === 'customer') {
                    user = db.get('customer').find({ customer_id: req.user.id }).value();
                } else {
                    user = db.get('employee').find({ employee_id: req.user.id }).value();
                }

                if (!user?.fcm_token) {
                    return res.status(HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: 'No FCM token found for user'
                    });
                }

                const result = await fcmService.sendNotification(
                    user.fcm_token,
                    title || 'Test Notification',
                    body || 'This is a test notification from B-Care backend',
                    { type: 'test' }
                );

                res.status(HTTP_STATUS.OK).json({
                    success: result.success,
                    message: result.success ? 'Test notification sent' : 'Failed to send notification',
                    data: result
                });

            } catch (error) {
                next(error);
            }
        });
    }

    return router;
}

module.exports = createNotificationRoutes;