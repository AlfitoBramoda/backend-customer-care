const fcmService = require('./fcm_service');
const templateService = require('./template_service');

class NotificationService {
    constructor(db) {
        this.db = db;
    }

    async logNotification(ticketId, recipientId, recipientType, recipientName, title, body, fcmResult) {
        const activityId = this.db.get('ticket_activity').size().value() + 1;
        
        // Content untuk customer dan employee dengan format yang konsisten
        let content;
        if (recipientType === 'customer') {
            content = `Notification sent to customer: ${title} - ${body} [status:${fcmResult.success ? 'sent' : 'failed'},read:false]`;
        } else {
            content = `FCM notification sent to ${recipientType} ${recipientName}: ${title} - ${body} [status:${fcmResult.success ? 'sent' : 'failed'},read:false]`;
        }
        
        this.db.get('ticket_activity').push({
            ticket_activity_id: activityId,
            ticket_id: ticketId,
            ticket_activity_type_id: 5,
            sender_type_id: null,
            sender_id: null,
            content: content,
            ticket_activity_time: new Date().toISOString()
        }).write();
    }

    async notifyTicketCreated(ticket, customer, employee = null) {
        try {
            // Notify customer
            if (customer?.fcm_token) {
                const template = templateService.getTicketCreatedTemplate(ticket, 'customer');
                const result = await fcmService.sendNotification(
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
                const template = templateService.getTicketCreatedTemplate(ticket, 'employee');
                const result = await fcmService.sendNotification(
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
                const template = templateService.getTicketUpdatedTemplate(ticket, 'customer', action);
                const result = await fcmService.sendNotification(
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
                const template = templateService.getTicketUpdatedTemplate(ticket, 'employee', action);
                const result = await fcmService.sendNotification(
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
                const template = templateService.getTicketEscalatedTemplate(ticket, 'customer');
                const result = await fcmService.sendNotification(
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
                const template = templateService.getTicketEscalatedTemplate(ticket, 'employee');
                const result = await fcmService.sendNotification(
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
                const template = templateService.getTicketClosedTemplate(ticket, 'customer');
                const result = await fcmService.sendNotification(
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

module.exports = NotificationService;