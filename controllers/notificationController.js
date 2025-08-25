const { HTTP_STATUS } = require('../constants/statusCodes');
const FCMService = require('../services/fcm_service');
const db = require('../models');

const {
    customer: Customer,
    employee: Employee
} = db;

class NotificationController {
    constructor() {
        // Remove db parameter
    }

    static createInstance() {
        return new NotificationController();
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
                await Customer.update(
                    { fcm_token: fcm_token },
                    { where: { customer_id: req.user.id } }
                );
            } else if (req.user.role === 'employee') {
                await Employee.update(
                    { fcm_token: fcm_token },
                    { where: { employee_id: req.user.id } }
                );
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
                await Customer.update(
                    { fcm_token: null },
                    { where: { customer_id: req.user.id } }
                );
            } else if (req.user.role === 'employee') {
                await Employee.update(
                    { fcm_token: null },
                    { where: { employee_id: req.user.id } }
                );
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
                user = await Customer.findByPk(req.user.id, {
                    attributes: ['customer_id', 'fcm_token']
                });
            } else {
                user = await Employee.findByPk(req.user.id, {
                    attributes: ['employee_id', 'fcm_token']
                });
            }

            if (!user?.fcm_token) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'No FCM token found for user'
                });
            }

            const result = await FCMService.sendNotification(
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