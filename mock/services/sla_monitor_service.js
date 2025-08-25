const cron = require('node-cron');
const fcmService = require('./fcm_service');
const templateService = require('./template_service');

class SLAMonitorService {
    constructor(db) {
        this.db = db;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        
        // Check SLA every hour
        cron.schedule('0 * * * *', () => {
            this.checkSLAWarnings();
        });

        // Check overdue tickets every 30 minutes
        cron.schedule('*/30 * * * *', () => {
            this.checkOverdueTickets();
        });

        this.isRunning = true;
        console.log('SLA Monitor Service started');
    }

    stop() {
        this.isRunning = false;
        console.log('SLA Monitor Service stopped');
    }

    async checkSLAWarnings() {
        try {
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000));

            const tickets = this.db.get('ticket')
                .filter(ticket => {
                    if (!ticket.committed_due_at || ticket.closed_time) return false;
                    
                    const dueDate = new Date(ticket.committed_due_at);
                    return dueDate > now && dueDate <= oneHourFromNow;
                })
                .value();

            for (const ticket of tickets) {
                await this.sendSLAWarning(ticket, 1);
            }

        } catch (error) {
            console.error('SLA warning check failed:', error.message);
        }
    }

    async checkOverdueTickets() {
        try {
            const now = new Date();

            const overdueTickets = this.db.get('ticket')
                .filter(ticket => {
                    if (!ticket.committed_due_at || ticket.closed_time) return false;
                    
                    const dueDate = new Date(ticket.committed_due_at);
                    return dueDate < now;
                })
                .value();

            for (const ticket of overdueTickets) {
                const hoursOverdue = Math.floor((now - new Date(ticket.committed_due_at)) / (1000 * 60 * 60));
                await this.sendOverdueAlert(ticket, hoursOverdue);
            }

        } catch (error) {
            console.error('Overdue check failed:', error.message);
        }
    }

    async sendSLAWarning(ticket, hoursLeft) {
        try {
            // Notify customer
            const customer = this.db.get('customer')
                .find({ customer_id: ticket.customer_id })
                .value();

            if (customer?.fcm_token) {
                const template = templateService.getSLAWarningTemplate(ticket, 'customer', hoursLeft);
                await fcmService.sendNotification(
                    customer.fcm_token,
                    template.title,
                    template.body,
                    template.data
                );
            }

            // Notify responsible employee
            if (ticket.responsible_employee_id) {
                const employee = this.db.get('employee')
                    .find({ employee_id: ticket.responsible_employee_id })
                    .value();

                if (employee?.fcm_token) {
                    const template = templateService.getSLAWarningTemplate(ticket, 'employee', hoursLeft);
                    await fcmService.sendNotification(
                        employee.fcm_token,
                        template.title,
                        template.body,
                        template.data
                    );
                }
            }

        } catch (error) {
            console.error('SLA warning notification failed:', error.message);
        }
    }

    async sendOverdueAlert(ticket, hoursOverdue) {
        try {
            // Only notify employees for overdue tickets
            if (ticket.responsible_employee_id) {
                const employee = this.db.get('employee')
                    .find({ employee_id: ticket.responsible_employee_id })
                    .value();

                if (employee?.fcm_token) {
                    await fcmService.sendNotification(
                        employee.fcm_token,
                        'SLA Overdue Alert',
                        `Ticket #${ticket.ticket_number} is ${hoursOverdue} hours overdue`,
                        {
                            ticket_id: String(ticket.ticket_id),
                            ticket_number: ticket.ticket_number,
                            action: 'view_ticket',
                            type: 'sla_overdue',
                            priority: 'critical'
                        }
                    );
                }
            }

        } catch (error) {
            console.error('Overdue alert notification failed:', error.message);
        }
    }
}

module.exports = SLAMonitorService;