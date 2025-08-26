const { HTTP_STATUS } = require('../constants/statusCodes');
const FCMService = require('../services/fcm_service');
const db = require('../models');

const {
    customer: Customer,
    employee: Employee,
    ticket_activity: TicketActivity
} = db;

class NotificationController {
    constructor() {
        // Remove db parameter - using Sequelize models
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

    async getNotificationHistory(req, res, next) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const userId = req.user.id;
            const userType = req.user.role;

            // Get user name
            let userName;
            if (userType === 'customer') {
                const user = await Customer.findByPk(userId, {
                    attributes: ['full_name']
                });
                userName = user?.full_name;
            } else {
                const user = await Employee.findByPk(userId, {
                    attributes: ['full_name']
                });
                userName = user?.full_name;
            }

            if (!userName) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Build where conditions for filtering notifications
            const { Op } = require('sequelize');
            let whereConditions = {
                ticket_activity_type_id: 5,
                content: {
                    [Op.and]: [
                        { [Op.ne]: null },
                        userType === 'customer' 
                            ? { [Op.like]: '%Notification sent to customer:%' }
                            : { [Op.like]: `%FCM notification sent to employee ${userName}:%` }
                    ]
                }
            };

            // Get notifications with pagination
            const notifications = await TicketActivity.findAll({
                where: whereConditions,
                order: [['ticket_activity_time', 'DESC']],
                offset: (page - 1) * limit,
                limit: parseInt(limit)
            });

            // Transform the data
            const transformedNotifications = notifications.map(activity => {
                const content = activity.content;
                let title, body;
                
                if (userType === 'customer') {
                    // Format: "Notification sent to customer: TITLE - BODY [status:sent,read:false]"
                    const titleMatch = content.match(/Notification sent to customer: (.+?) - /);
                    const bodyMatch = content.match(/customer: .+? - (.+?) \[/);
                    title = titleMatch ? titleMatch[1] : 'Notification';
                    body = bodyMatch ? bodyMatch[1] : title;
                } else {
                    // Format: "FCM notification sent to employee NAME: TITLE - BODY [status:sent,read:false]"
                    const titleMatch = content.match(/: (.+?) - /);
                    const bodyMatch = content.match(/ - (.+?) \[/);
                    title = titleMatch ? titleMatch[1] : 'Notification';
                    body = bodyMatch ? bodyMatch[1] : title;
                }
                
                const statusMatch = content.match(/status:(\w+)/);
                const readMatch = content.match(/read:(\w+)/);
                
                return {
                    notification_id: activity.ticket_activity_id,
                    ticket_id: activity.ticket_id,
                    title: title,
                    body: body,
                    status: statusMatch ? statusMatch[1] : 'unknown',
                    is_read: readMatch ? readMatch[1] === 'true' : false,
                    created_at: activity.ticket_activity_time
                };
            });

            // Get total count for pagination
            const total = await TicketActivity.count({
                where: whereConditions
            });

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: transformedNotifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async markAsRead(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const userType = req.user.role;

            // Get user name
            let userName;
            if (userType === 'customer') {
                const user = await Customer.findByPk(userId, {
                    attributes: ['full_name']
                });
                userName = user?.full_name;
            } else {
                const user = await Employee.findByPk(userId, {
                    attributes: ['full_name']
                });
                userName = user?.full_name;
            }

            if (!userName) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Build where conditions for finding the notification
            const { Op } = require('sequelize');
            let whereConditions = {
                ticket_activity_id: parseInt(id),
                ticket_activity_type_id: 5,
                content: {
                    [Op.and]: [
                        { [Op.ne]: null },
                        userType === 'customer' 
                            ? { [Op.like]: '%Notification sent to customer:%' }
                            : { [Op.like]: `%FCM notification sent to employee ${userName}:%` }
                    ]
                }
            };

            // Find notification
            const activity = await TicketActivity.findOne({
                where: whereConditions
            });

            if (!activity) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            // Update read status dalam content
            const updatedContent = activity.content.replace(/read:false/, 'read:true');

            await TicketActivity.update(
                { content: updatedContent },
                { where: { ticket_activity_id: parseInt(id) } }
            );

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Notification marked as read'
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
                    attributes: ['customer_id', 'fcm_token', 'full_name']
                });
            } else {
                user = await Employee.findByPk(req.user.id, {
                    attributes: ['employee_id', 'fcm_token', 'full_name']
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

            // Log test notification - sama seperti di DB JSON
            if (result.success) {
                const content = `FCM notification sent to ${req.user.role} ${user.full_name}: ${title || 'Test Notification'} - ${body || 'This is a test notification from B-Care backend'} [status:sent,read:false]`;
                
                await TicketActivity.create({
                    ticket_id: null,
                    ticket_activity_type_id: 5,
                    sender_type_id: null,
                    sender_id: null,
                    content: content,
                    ticket_activity_time: new Date()
                });
            }

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