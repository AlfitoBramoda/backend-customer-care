const FCMService = require('./fcmService');
const TemplateService = require('./templateService');
const db = require('../models');

const { ticket_activity: TicketActivity } = db;

class NotificationService {
    async logNotification(ticketId, recipientId, recipientType, recipientName, title, body, fcmResult) {
        try {
            let content;
            if (recipientType === 'customer') {
                content = `Notification sent to customer: ${title} - ${body} [status:${fcmResult.success ? 'sent' : 'failed'},read:false]`;
            } else {
                content = `FCM notification sent to ${recipientType} ${recipientName}: ${title} - ${body} [status:${fcmResult.success ? 'sent' : 'failed'},read:false]`;
            }
            
            await TicketActivity.create({
                ticket_id: ticketId,
                ticket_activity_type_id: 5, // FCM_NOTIFICATION type
                sender_type_id: null,
                sender_id: null,
                content: content
            });
        } catch (error) {
            console.error('Failed to log notification:', error.message);
        }
    }

    async notifyTicketCreated(ticket, customer, employee = null) {
        try {
            // Notify customer
            if (customer?.fcm_token) {
                const template = TemplateService.getTicketCreatedTemplate(ticket, 'customer');
                const result = await FCMService.sendNotification(
                    customer.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
                
                await this.logNotification(
                    ticket.ticket_id, customer.customer_id, 'customer', customer.full_name,
                    template.title, template.body, result
                );
            }

            // Notify assigned employee
            if (employee?.fcm_token) {
                const template = TemplateService.getTicketCreatedTemplate(ticket, 'employee');
                const result = await FCMService.sendNotification(
                    employee.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
                
                await this.logNotification(
                    ticket.ticket_id, employee.employee_id, 'employee', employee.full_name,
                    template.title, template.body, result
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
                const template = TemplateService.getTicketUpdatedTemplate(ticket, 'customer', action);
                const result = await FCMService.sendNotification(
                    customer.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
                
                await this.logNotification(
                    ticket.ticket_id, customer.customer_id, 'customer', customer.full_name,
                    template.title, template.body, result
                );
            }

            // Notify employee if different from updater
            if (employee?.fcm_token) {
                const template = TemplateService.getTicketUpdatedTemplate(ticket, 'employee', action);
                const result = await FCMService.sendNotification(
                    employee.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
                
                await this.logNotification(
                    ticket.ticket_id, employee.employee_id, 'employee', employee.full_name,
                    template.title, template.body, result
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
                const template = TemplateService.getTicketEscalatedTemplate(ticket, 'customer');
                const result = await FCMService.sendNotification(
                    customer.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
                
                await this.logNotification(
                    ticket.ticket_id, customer.customer_id, 'customer', customer.full_name,
                    template.title, template.body, result
                );
            }

            // Notify new assigned employee
            if (toEmployee?.fcm_token) {
                const template = TemplateService.getTicketEscalatedTemplate(ticket, 'employee');
                const result = await FCMService.sendNotification(
                    toEmployee.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
                
                await this.logNotification(
                    ticket.ticket_id, toEmployee.employee_id, 'employee', toEmployee.full_name,
                    template.title, template.body, result
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
                const template = TemplateService.getTicketClosedTemplate(ticket, 'customer');
                const result = await FCMService.sendNotification(
                    customer.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
                
                await this.logNotification(
                    ticket.ticket_id, customer.customer_id, 'customer', customer.full_name,
                    template.title, template.body, result
                );
            }
        } catch (error) {
            console.error('Notification error:', error.message);
        }
    }
}

module.exports = new NotificationService();