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

    async getNotificationHistory(req, res, next) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const userId = req.user.id;
            const userType = req.user.role;

            // Get user name
            let userName;
            if (userType === 'customer') {
                const user = this.db.get('customer').find({ customer_id: userId }).value();
                userName = user?.full_name;
            } else {
                const user = this.db.get('employee').find({ employee_id: userId }).value();
                userName = user?.full_name;
            }

            if (!userName) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Filter FCM notifications untuk user ini
            const notifications = this.db.get('ticket_activity')
                .filter(activity => {
                    if (activity.ticket_activity_type_id !== 5 || !activity.content) return false;
                    
                    // Check for customer notifications
                    if (userType === 'customer') {
                        return activity.content.includes('Notification sent to customer:');
                    }
                    
                    // Check for employee notifications
                    if (userType === 'employee') {
                        return activity.content.includes(`FCM notification sent to employee ${userName}:`);
                    }
                    
                    return false;
                })
                .orderBy('ticket_activity_time', 'desc')
                .drop((page - 1) * limit)
                .take(parseInt(limit))
                .map(activity => {
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
                })
                .value();

            // Get total count for pagination
            const total = this.db.get('ticket_activity')
                .filter(activity => {
                    if (activity.ticket_activity_type_id !== 5 || !activity.content) return false;
                    
                    if (userType === 'customer') {
                        return activity.content.includes('Notification sent to customer:');
                    }
                    
                    if (userType === 'employee') {
                        return activity.content.includes(`FCM notification sent to employee ${userName}:`);
                    }
                    
                    return false;
                })
                .size()
                .value();

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: notifications,
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
                const user = this.db.get('customer').find({ customer_id: userId }).value();
                userName = user?.full_name;
            } else {
                const user = this.db.get('employee').find({ employee_id: userId }).value();
                userName = user?.full_name;
            }

            if (!userName) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Find notification
            const activity = this.db.get('ticket_activity')
                .find(item => {
                    if (item.ticket_activity_id != id || item.ticket_activity_type_id !== 5 || !item.content) {
                        return false;
                    }
                    
                    if (userType === 'customer') {
                        return item.content.includes('Notification sent to customer:');
                    }
                    
                    if (userType === 'employee') {
                        return item.content.includes(`FCM notification sent to employee ${userName}:`);
                    }
                    
                    return false;
                })
                .value();

            if (!activity) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            // Update read status dalam content
            const updatedContent = activity.content.replace(/read:false/, 'read:true');

            this.db.get('ticket_activity')
                .find({ ticket_activity_id: parseInt(id) })
                .assign({ content: updatedContent })
                .write();

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Notification marked as read'
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

            // Log test notification
            if (result.success) {
                const activityId = this.db.get('ticket_activity').size().value() + 1;
                const content = `FCM notification sent to ${req.user.role} ${user.full_name}: ${title || 'Test Notification'} - ${body || 'This is a test notification from B-Care backend'} [status:sent,read:false]`;
                
                this.db.get('ticket_activity').push({
                    ticket_activity_id: activityId,
                    ticket_id: null,
                    ticket_activity_type_id: 5,
                    sender_type_id: null,
                    sender_id: null,
                    content: content,
                    ticket_activity_time: new Date().toISOString()
                }).write();
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