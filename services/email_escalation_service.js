const nodemailer = require('nodemailer');

// Import Sequelize models
const {
    ticket: Ticket,
    customer: Customer,
    employee: Employee,
    division: Division,
    complaint_category: ComplaintCategory,
    complaint_policy: ComplaintPolicy,
    priority: Priority,
    ticket_activity: TicketActivity,
    customer_status: CustomerStatus,
    employee_status: EmployeeStatus
} = require('../models');

class EmailEscalationService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST_DEV,
            port: process.env.SMTP_PORT_DEV,
            auth: {
                user: process.env.SMTP_USER_DEV,
                pass: process.env.SMTP_PASS_DEV
            }
        });
    }

    async sendEscalationEmail(ticketId, escalatedByEmployeeId) {
        try {
            // Get ticket details with all relations
            const ticket = await Ticket.findByPk(ticketId, {
                include: [
                    { model: Customer, as: 'customer' },
                    { model: ComplaintCategory, as: 'complaint_category' },
                    { model: Priority, as: 'priority' },
                    { model: ComplaintPolicy, as: 'policy' }
                ]
            });

            if (!ticket) {
                throw new Error('Ticket not found');
            }

            // Get escalating agent details
            const escalatingAgent = await Employee.findByPk(escalatedByEmployeeId);

            // Get customer details
            const customer = ticket.customer;

            // Get policy to determine target division
            const policy = ticket.policy;

            if (!policy || !policy.uic_id) {
                console.log('No target division found for escalation');
                return;
            }

            // Get target division details
            const targetDivision = await Division.findByPk(policy.uic_id);

            // Get all employees in target division
            const targetEmployees = await Employee.findAll({
                where: { 
                    division_id: policy.uic_id, 
                    is_active: true 
                }
            });

            if (!targetEmployees || targetEmployees.length === 0) {
                console.log(`No active employees found in division ${targetDivision?.division_name}`);
                return;
            }

            // Get complaint details
            const complaint = ticket.complaint_category;

            // Get priority details
            const priority = ticket.priority;

            // Prepare email content
            const emailSubject = `🚨 TICKET ESCALATION - ${ticket.ticket_number}`;
            const emailContent = this.generateEscalationEmailContent({
                ticket,
                customer,
                escalatingAgent,
                targetDivision,
                complaint,
                priority,
                policy
            });

            // Send email to all employees in target division
            const emailPromises = targetEmployees.map(employee => 
                this.sendEmailToEmployee(employee, emailSubject, emailContent)
            );

            await Promise.all(emailPromises);

            // Create ticket activity for email sent
            await this.createEmailActivity(ticketId, escalatedByEmployeeId, targetEmployees.length, targetDivision.division_name);

            console.log(`✅ Escalation emails sent to ${targetEmployees.length} employees in ${targetDivision.division_name}`);
            
            return {
                success: true,
                sentTo: targetEmployees.length,
                division: targetDivision.division_name
            };

        } catch (error) {
            console.error('❌ Error sending escalation email:', error);
            throw error;
        }
    }

    async sendEmailToEmployee(employee, subject, htmlContent) {
        const mailOptions = {
            from: process.env.SMTP_FROM_DEV || 'noreply@bcare.my.id',
            to: employee.email,
            subject: subject,
            html: htmlContent
        };

        return await this.transporter.sendMail(mailOptions);
    }

    generateEscalationEmailContent({ ticket, customer, escalatingAgent, targetDivision, complaint, priority, policy }) {
        const priorityColor = this.getPriorityColor(priority?.priority_code);
        const slaHours = policy.sla * 24;

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
                .footer { background: #64748b; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
                .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; color: white; }
                .info-row { margin: 10px 0; padding: 8px; background: white; border-radius: 4px; }
                .label { font-weight: bold; color: #475569; }
                .urgent { background: #dc2626; }
                .high { background: #ea580c; }
                .normal { background: #16a34a; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🚨 TICKET ESCALATION NOTIFICATION</h2>
                    <p>A ticket has been escalated to your division</p>
                </div>
                
                <div class="content">
                    <div class="info-row">
                        <span class="label">Ticket Number:</span> <strong>${ticket.ticket_number}</strong>
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Priority:</span> 
                        <span class="priority-badge ${priorityColor}">${priority?.priority_name || 'Regular'}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Customer:</span> ${customer?.full_name || 'N/A'}
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Customer Email:</span> ${customer?.email || 'N/A'}
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Complaint Type:</span> ${complaint?.complaint_name || 'N/A'}
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Description:</span><br>
                        <div style="margin-top: 8px; padding: 10px; background: #f1f5f9; border-radius: 4px;">
                            ${ticket.description || 'No description provided'}
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Transaction Amount:</span> ${ticket.amount ? `Rp ${ticket.amount.toLocaleString('id-ID')}` : 'N/A'}
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Transaction Date:</span> ${ticket.transaction_date ? new Date(ticket.transaction_date).toLocaleDateString('id-ID') : 'N/A'}
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Escalated By:</span> ${escalatingAgent?.full_name || 'System'} (${escalatingAgent?.email || 'N/A'})
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Target Division:</span> <strong>${targetDivision?.division_name || 'N/A'}</strong>
                    </div>
                    
                    <div class="info-row">
                        <span class="label">SLA:</span> <strong>${slaHours} hours</strong>
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Due Date:</span> <strong>${ticket.committed_due_at ? new Date(ticket.committed_due_at).toLocaleString('id-ID') : 'N/A'}</strong>
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Created:</span> ${new Date(ticket.created_time).toLocaleString('id-ID')}
                    </div>
                </div>
                
                <div class="footer">
                    <p><strong>Action Required:</strong> Please review and handle this escalated ticket promptly.</p>
                    <p>B-Care Customer Care System</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    getPriorityColor(priorityCode) {
        switch (priorityCode) {
            case 'CRITICAL':
                return 'urgent';
            case 'HIGH':
                return 'high';
            default:
                return 'normal';
        }
    }

    async createEmailActivity(ticketId, senderId, recipientCount, divisionName) {
        await TicketActivity.create({
            ticket_id: ticketId,
            ticket_activity_type_id: 4, // EMAIL_SENT type
            sender_type_id: 2, // Employee
            sender_id: senderId,
            content: `Escalation email sent to ${recipientCount} employees in ${divisionName}`,
            ticket_activity_time: new Date()
        });
    }

    async sendDoneByUICEmail(ticketId, completedByEmployeeId) {
        try {
            // Get ticket details
            const ticket = await Ticket.findByPk(ticketId, {
                include: [
                    { model: Customer, as: 'customer' },
                    { model: ComplaintCategory, as: 'complaint_category' },
                    { model: Priority, as: 'priority' }
                ]
            });

            if (!ticket) {
                throw new Error('Ticket not found');
            }

            // Get UIC employee who completed the task
            const completingEmployee = await Employee.findByPk(completedByEmployeeId, {
                include: [{ model: Division, as: 'division' }]
            });

            // Get customer details
            const customer = ticket.customer;

            // Get responsible CXC agent (agent_cxc)
            const responsibleAgent = await Employee.findByPk(ticket.responsible_employee_id);

            if (!responsibleAgent) {
                console.log('No responsible CXC agent found for notification');
                return;
            }

            // Get complaint details
            const complaint = ticket.complaint_category;

            // Get priority details
            const priority = ticket.priority;

            // Get UIC division details
            const uicDivision = completingEmployee?.division;

            // Prepare email content
            const emailSubject = `✅ TICKET COMPLETED BY UIC - ${ticket.ticket_number}`;
            const emailContent = this.generateDoneByUICEmailContent({
                ticket,
                customer,
                completingEmployee,
                responsibleAgent,
                complaint,
                priority,
                uicDivision
            });

            // Send email to responsible CXC agent
            await this.sendEmailToEmployee(responsibleAgent, emailSubject, emailContent);

            // Create ticket activity for email sent
            await this.createEmailActivity(ticketId, completedByEmployeeId, 1, `CXC Agent (${responsibleAgent.full_name})`);

            console.log(`✅ DONE_BY_UIC notification email sent to CXC agent ${responsibleAgent.full_name}`);
            
            return {
                success: true,
                sentTo: 1,
                recipient: responsibleAgent.full_name
            };

        } catch (error) {
            console.error('❌ Error sending DONE_BY_UIC email:', error);
            throw error;
        }
    }

    generateDoneByUICEmailContent({ ticket, customer, completingEmployee, responsibleAgent, complaint, priority, uicDivision }) {
        const priorityColor = this.getPriorityColor(priority?.priority_code);

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #16a34a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
                .footer { background: #64748b; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
                .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; color: white; }
                .info-row { margin: 10px 0; padding: 8px; background: white; border-radius: 4px; }
                .label { font-weight: bold; color: #475569; }
                .urgent { background: #dc2626; }
                .high { background: #ea580c; }
                .normal { background: #16a34a; }
                .success-badge { background: #16a34a; color: white; padding: 6px 12px; border-radius: 20px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>✅ TICKET COMPLETED BY UIC</h2>
                    <p>A ticket has been completed by UIC division and is ready for your review</p>
                </div>
                
                <div class="content">
                    <div class="info-row">
                        <span class="label">Ticket Number:</span> <strong>${ticket.ticket_number}</strong>
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Status:</span> 
                        <span class="success-badge">COMPLETED BY UIC</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Priority:</span> 
                        <span class="priority-badge ${priorityColor}">${priority?.priority_name || 'Regular'}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Customer:</span> ${customer?.full_name || 'N/A'}
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Customer Email:</span> ${customer?.email || 'N/A'}
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Complaint Type:</span> ${complaint?.complaint_name || 'N/A'}
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Description:</span><br>
                        <div style="margin-top: 8px; padding: 10px; background: #f1f5f9; border-radius: 4px;">
                            ${ticket.description || 'No description provided'}
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Transaction Amount:</span> ${ticket.amount ? `Rp ${ticket.amount.toLocaleString('id-ID')}` : 'N/A'}
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Transaction Date:</span> ${ticket.transaction_date ? new Date(ticket.transaction_date).toLocaleDateString('id-ID') : 'N/A'}
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Completed By:</span> ${completingEmployee?.full_name || 'UIC Employee'} (${completingEmployee?.email || 'N/A'})
                    </div>
                    
                    <div class="info-row">
                        <span class="label">UIC Division:</span> <strong>${uicDivision?.division_name || 'N/A'}</strong>
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Assigned CXC Agent:</span> <strong>${responsibleAgent?.full_name || 'N/A'}</strong> (${responsibleAgent?.email || 'N/A'})
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Created:</span> ${new Date(ticket.created_time).toLocaleString('id-ID')}
                    </div>
                    
                    <div class="info-row">
                        <span class="label">Completed:</span> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                    </div>
                </div>
                
                <div class="footer">
                    <p><strong>Action Required:</strong> Please review the completed ticket and proceed with closure or further actions as needed.</p>
                    <p>B-Care Customer Care System</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

module.exports = EmailEscalationService;