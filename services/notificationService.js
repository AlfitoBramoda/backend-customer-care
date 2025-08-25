const FCMService = require('./fcmService');
const TemplateService = require('./templateService');

class NotificationService {
    async notifyTicketCreated(ticket, customer, employee = null) {
        try {
            // Notify customer
            if (customer?.fcm_token) {
                const template = templateService.getTicketCreatedTemplate(ticket, 'customer');
                await FCMService.sendNotification(
                    customer.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
            }

            // Notify assigned employee
            if (employee?.fcm_token) {
                const template = templateService.getTicketCreatedTemplate(ticket, 'employee');
                await FCMService.sendNotification(
                    employee.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
            }
        } catch (error) {
            console.error('Notification error:', error.message);
        }
    }
    async notifyTicketUpdated(ticket, customer, employee = null, action = 'updated') {
        try {
            // Notify customer
            if (customer?.fcm_token) {
                const template = templateService.getTicketUpdatedTemplate(ticket, 'customer', action);
                await fcmService.sendNotification(
                    customer.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
            }

            // Notify employee if different from updater
            if (employee?.fcm_token) {
                const template = templateService.getTicketUpdatedTemplate(ticket, 'employee', action);
                await fcmService.sendNotification(
                    employee.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
            }
        } catch (error) {
            console.error('Notification error:', error.message);
        }
    }

    async notifyTicketEscalated(ticket, customer, fromEmployee, toEmployee) {
        try {
            // Notify customer
            if (customer?.fcm_token) {
                const template = templateService.getTicketEscalatedTemplate(ticket, 'customer');
                await fcmService.sendNotification(
                    customer.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
            }

            // Notify new assigned employee
            if (toEmployee?.fcm_token) {
                const template = templateService.getTicketEscalatedTemplate(ticket, 'employee');
                await fcmService.sendNotification(
                    toEmployee.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
            }
        } catch (error) {
            console.error('Notification error:', error.message);
        }
    }

    async notifyTicketClosed(ticket, customer, employee = null) {
        try {
            // Notify customer
            if (customer?.fcm_token) {
                const template = templateService.getTicketClosedTemplate(ticket, 'customer');
                await fcmService.sendNotification(
                    customer.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
            }
        } catch (error) {
            console.error('Notification error:', error.message);
        }
    }
}

module.exports = new NotificationService(); 
