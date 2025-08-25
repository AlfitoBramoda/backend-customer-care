const { HTTP_STATUS } = require('../constants/statusCodes');
const fcmService = require('../services/fcm_service');

class NotificationController {
    constructor(db) {
        this.db = db;
    }

    static createInstance(db) {
        return new NotificationController(db);
    }

    async registerToken(req, res, next) {
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
                this.db.get('customer')
                    .find({ customer_id: req.user.id })
                    .assign({ fcm_token: fcm_token })
                    .write();
            } else if (req.user.role === 'employee') {
                this.db.get('employee')
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
    }

    async removeToken(req, res, next) {
        try {
            // Remove user's FCM token based on role
            if (req.user.role === 'customer') {
                this.db.get('customer')
                    .find({ customer_id: req.user.id })
                    .assign({ fcm_token: null })
                    .write();
            } else if (req.user.role === 'employee') {
                this.db.get('employee')
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
    }

    async testNotification(req, res, next) {
        try {
            if (process.env.NODE_ENV === 'production') {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: 'Test endpoint not available in production'
                });
            }

            const { title, body } = req.body;
            
            let user;
            if (req.user.role === 'customer') {
                user = this.db.get('customer').find({ customer_id: req.user.id }).value();
            } else {
                user = this.db.get('employee').find({ employee_id: req.user.id }).value();
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
    }
}

module.exports = NotificationController;