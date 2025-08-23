const nodemailer = require('nodemailer');

class EmailEscalationService {
    constructor(db) {
        this.db = db;
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendEscalationEmail(ticketId, escalatedByEmployeeId) {
        try {
            // Get ticket details
            const ticket = this.db.get('ticket')
                .find({ ticket_id: ticketId })
                .value();

            if (!ticket) {
                throw new Error('Ticket not found');
            }

            // Get escalating agent details
            const escalatingAgent = this.db.get('employee')
                .find({ employee_id: escalatedByEmployeeId })
                .value();

            // Get customer details
            const customer = this.db.get('customer')
                .find({ customer_id: ticket.customer_id })
                .value();

            // Get policy to determine target division
            const policy = this.db.get('complaint_policy')
                .find({ policy_id: ticket.policy_id })
                .value();

            if (!policy || !policy.uic_id) {
                console.log('No target division found for escalation');
                return;
            }

            // Get target division details
            const targetDivision = this.db.get('division')
                .find({ division_id: policy.uic_id })
                .value();

            // Get all employees in target division
            const targetEmployees = this.db.get('employee')
                .filter({ division_id: policy.uic_id, is_active: true })
                .value();

            if (!targetEmployees || targetEmployees.length === 0) {
                console.log(`No active employees found in division ${targetDivision?.division_name}`);
                return;
            }

            // Get complaint details
            const complaint = this.db.get('complaint_category')
                .find({ complaint_id: ticket.complaint_id })
                .value();

            // Get priority details
            const priority = this.db.get('priority')
                .find({ priority_id: ticket.priority_id })
                .value();

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
            this.createEmailActivity(ticketId, escalatedByEmployeeId, targetEmployees.length, targetDivision.division_name);

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
            from: process.env.SMTP_FROM || 'noreply@bcare.my.id',
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
                        <span class="label">Created:</span> ${new Date(ticket.created_time.replace('Z', '+07:00')).toLocaleString('id-ID')}
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

    createEmailActivity(ticketId, senderId, recipientCount, divisionName) {
        const activityId = this.getNextId('ticket_activity');
        
        const emailActivity = {
            ticket_activity_id: activityId,
            ticket_id: ticketId,
            ticket_activity_type_id: 4, // EMAIL_SENT type
            sender_type_id: 2, // Employee
            sender_id: senderId,
            content: `Escalation email sent to ${recipientCount} employees in ${divisionName}`,
            ticket_activity_time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T') + '.000Z'
        };

        this.db.get('ticket_activity').push(emailActivity).write();
    }

    async sendDoneByUICEmail(ticketId, completedByEmployeeId) {
        try {
            // Get ticket details
            const ticket = this.db.get('ticket')
                .find({ ticket_id: ticketId })
                .value();

            if (!ticket) {
                throw new Error('Ticket not found');
            }

            // Get UIC employee who completed the task
            const completingEmployee = this.db.get('employee')
                .find({ employee_id: completedByEmployeeId })
                .value();

            // Get customer details
            const customer = this.db.get('customer')
                .find({ customer_id: ticket.customer_id })
                .value();

            // Get responsible CXC agent (agent_cxc)
            const responsibleAgent = this.db.get('employee')
                .find({ employee_id: ticket.responsible_employee_id })
                .value();

            if (!responsibleAgent) {
                console.log('No responsible CXC agent found for notification');
                return;
            }

            // Get complaint details
            const complaint = this.db.get('complaint_category')
                .find({ complaint_id: ticket.complaint_id })
                .value();

            // Get priority details
            const priority = this.db.get('priority')
                .find({ priority_id: ticket.priority_id })
                .value();

            // Get UIC division details
            const uicDivision = this.db.get('division')
                .find({ division_id: completingEmployee?.division_id })
                .value();

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
            this.createEmailActivity(ticketId, completedByEmployeeId, 1, `CXC Agent (${responsibleAgent.full_name})`);

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
                        <span class="label">Created:</span> ${new Date(ticket.created_time.replace('Z', '+07:00')).toLocaleString('id-ID')}
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

    getNextId(tableName) {
        const records = this.db.get(tableName).value();
        if (!records || records.length === 0) return 1;
        
        const maxId = Math.max(...records.map(record => {
            const idField = `${tableName}_id`;
            return record[idField] || 0;
        }));
        
        return maxId + 1;
    }
}

module.exports = EmailEscalationService;