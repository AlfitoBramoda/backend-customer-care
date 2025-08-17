class TicketController {
    constructor(db) {
        this.db = db;
    }

    static createInstance(db) {
        return new TicketController(db);
    }

    async getAllTickets(req, res, next) {
        try {
            const {
                limit = 10,
                offset = 0,
                status,
                customer_id,
                employee_id,
                priority,
                channel_id,
                complaint_id,
                date_from,
                date_to,
                search
            } = req.query;

            // Get all tickets from database
            let tickets = this.db.get('ticket').value();

            // Role-based access control
            if (req.user.role === 'customer') {
                tickets = tickets.filter(ticket => ticket.customer_id == req.user.id);
            }

            // Apply filters
            if (status) {
                tickets = tickets.filter(ticket => {
                    const customerStatus = this.db.get('customer_status')
                        .find({ customer_status_id: ticket.customer_status_id })
                        .value();
                    const employeeStatus = this.db.get('employee_status')
                        .find({ employee_status_id: ticket.employee_status_id })
                        .value();
                    
                    return customerStatus?.customer_status_code === status.toUpperCase() ||
                            employeeStatus?.employee_status_code === status.toUpperCase();
                });
            }

            if (customer_id && req.user.role === 'employee') {
                tickets = tickets.filter(ticket => ticket.customer_id == customer_id);
            }

            if (employee_id && req.user.role === 'employee') {
                tickets = tickets.filter(ticket => ticket.responsible_employee_id == employee_id);
            }

            if (priority) {
                tickets = tickets.filter(ticket => {
                    const priorityData = this.db.get('priority')
                        .find({ priority_id: ticket.priority_id })
                        .value();
                    return priorityData?.priority_code === priority.toUpperCase();
                });
            }

            if (channel_id) {
                tickets = tickets.filter(ticket => ticket.issue_channel_id == channel_id);
            }

            if (complaint_id) {
                tickets = tickets.filter(ticket => ticket.complaint_id == complaint_id);
            }

            if (date_from || date_to) {
                tickets = tickets.filter(ticket => {
                    const ticketDate = new Date(ticket.created_time);
                    const fromDate = date_from ? new Date(date_from) : new Date('1900-01-01');
                    const toDate = date_to ? new Date(date_to) : new Date('2100-01-01');
                    
                    return ticketDate >= fromDate && ticketDate <= toDate;
                });
            }

            if (search) {
                const searchLower = search.toLowerCase();
                tickets = tickets.filter(ticket => 
                    ticket.description?.toLowerCase().includes(searchLower) ||
                    ticket.ticket_number?.toLowerCase().includes(searchLower)
                );
            }

            const total = tickets.length;
            const paginatedTickets = tickets.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

            // Role-based data enrichment
            const enrichedTickets = paginatedTickets.map(ticket => 
                this.enrichTicketData(ticket, req.user.role)
            );

            res.status(200).json({
                success: true,
                message: 'Tickets retrieved successfully',
                data: enrichedTickets,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    pages: Math.ceil(total / parseInt(limit))
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // Role-based data enrichment
    enrichTicketData(ticket, userRole) {
        // Base data yang selalu ada
        const baseData = {
            ticket_number: ticket.ticket_number,
            description: ticket.description,
            transaction_date: ticket.transaction_date,
            amount: ticket.amount,
            created_time: ticket.created_time,
            closed_time: ticket.closed_time
        };

        // Customer status (always included)
        const customerStatus = this.db.get('customer_status')
            .find({ customer_status_id: ticket.customer_status_id })
            .value();

        // Issue channel (always included)
        const channel = this.db.get('channel')
            .find({ channel_id: ticket.issue_channel_id })
            .value();

        // Customer info (always included)
        const customer = this.db.get('customer')
            .find({ customer_id: ticket.customer_id })
            .value();

        // Related account (always included)
        const relatedAccount = this.db.get('account')
            .find({ account_id: ticket.related_account_id })
            .value();

        // Related card (always included)
        const relatedCard = this.db.get('card')
            .find({ card_id: ticket.related_card_id })
            .value();

        // Complaint (always included)
        const complaint = this.db.get('complaint_category')
            .find({ complaint_id: ticket.complaint_id })
            .value();

        // Common data for both roles
        const commonData = {
            ...baseData,
            customer_status: customerStatus ? {
                customer_status_id: customerStatus.customer_status_id,
                customer_status_name: customerStatus.customer_status_name,
                customer_status_code: customerStatus.customer_status_code
            } : null,
            
            issue_channel: channel ? {
                channel_id: channel.channel_id,
                channel_name: channel.channel_name,
                channel_code: channel.channel_code
            } : null,
            
            customer: customer ? {
                customer_id: customer.customer_id,
                full_name: customer.full_name,
                email: customer.email
            } : null,
            
            related_account: relatedAccount ? {
                account_id: relatedAccount.account_id,
                account_number: relatedAccount.account_number
            } : null,
            
            related_card: relatedCard ? {
                card_id: relatedCard.card_id,
                card_number: relatedCard.card_number,
                card_type: relatedCard.card_type
            } : null,
            
            complaint: complaint ? {
                complaint_id: complaint.complaint_id,
                complaint_name: complaint.complaint_name,
                complaint_code: complaint.complaint_code
            } : null
        };

        // Customer role: return limited data
        if (userRole === 'customer') {
            return commonData;
        }

        // Employee role: return full data
        if (userRole === 'employee') {
            const employee = this.db.get('employee')
                .find({ employee_id: ticket.responsible_employee_id })
                .value();

            const priority = this.db.get('priority')
                .find({ priority_id: ticket.priority_id })
                .value();

            const employeeStatus = this.db.get('employee_status')
                .find({ employee_status_id: ticket.employee_status_id })
                .value();

            const terminal = this.db.get('terminal')
                .find({ terminal_id: ticket.terminal_id })
                .value();

            const source = this.db.get('source')
                .find({ source_id: ticket.intake_source_id })
                .value();

            const policy = this.db.get('complaint_policy')
                .find({ policy_id: ticket.policy_id })
                .value();

            return {
                ...commonData,
                ticket_id: ticket.ticket_id,
                
                employee: employee ? {
                    employee_id: employee.employee_id,
                    full_name: employee.full_name,
                    npp: employee.npp,
                    email: employee.email
                } : null,
                
                priority: priority ? {
                    priority_id: priority.priority_id,
                    priority_name: priority.priority_name,
                    priority_code: priority.priority_code
                } : null,
                
                employee_status: employeeStatus ? {
                    employee_status_id: employeeStatus.employee_status_id,
                    employee_status_name: employeeStatus.employee_status_name,
                    employee_status_code: employeeStatus.employee_status_code
                } : null,
                
                terminal: terminal ? {
                    terminal_id: terminal.terminal_id,
                    terminal_code: terminal.terminal_code,
                    location: terminal.location
                } : null,
                
                intake_source: source ? {
                    source_id: source.source_id,
                    source_name: source.source_name,
                    source_code: source.source_code
                } : null,
                
                policy: policy ? {
                    policy_id: policy.policy_id,
                    sla: policy.sla,
                    uic_id: policy.uic_id
                } : null,
                
                committed_due_at: ticket.committed_due_at,
                division_notes: ticket.division_notes,
                
                sla_info: this.calculateSLAInfo(ticket)
            };
        }

        return commonData;
    }

    async getTicketById(req, res, next) {
        try {
            const { id } = req.params;
            
            const ticket = this.db.get('ticket')
                .find({ ticket_id: parseInt(id) })
                .value();

            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            // Role-based access control
            if (req.user.role === 'customer' && ticket.customer_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            const detailedTicket = this.getDetailedTicketData(ticket, req.user.role);

            res.status(200).json({
                success: true,
                message: 'Ticket retrieved successfully',
                data: detailedTicket
            });

        } catch (error) {
            next(error);
        }
    }

    getDetailedTicketData(ticket, userRole) {
        const baseData = {
            ticket_number: ticket.ticket_number,
            description: ticket.description,
            transaction_date: ticket.transaction_date,
            amount: ticket.amount,
            created_time: ticket.created_time,
            closed_time: ticket.closed_time
        };

        // Get related data
        const customer = this.db.get('customer')
            .find({ customer_id: ticket.customer_id })
            .value();

        const customerStatus = this.db.get('customer_status')
            .find({ customer_status_id: ticket.customer_status_id })
            .value();

        const channel = this.db.get('channel')
            .find({ channel_id: ticket.issue_channel_id })
            .value();

        const complaint = this.db.get('complaint_category')
            .find({ complaint_id: ticket.complaint_id })
            .value();

        const relatedAccount = this.db.get('account')
            .find({ account_id: ticket.related_account_id })
            .value();

        const relatedCard = this.db.get('card')
            .find({ card_id: ticket.related_card_id })
            .value();

        // Get activities
        const activities = this.db.get('ticket_activity')
            .filter({ ticket_id: ticket.ticket_id })
            .value()
            .map(activity => {
                const activityType = this.db.get('ticket_activity_type')
                    .find({ activity_type_id: activity.activity_type_id })
                    .value();
                
                return {
                    activity_id: activity.activity_id,
                    activity_type: activityType?.activity_type_name,
                    description: activity.description,
                    created_time: activity.created_time,
                    created_by: activity.created_by
                };
            });

        // Get attachments
        const attachments = this.db.get('attachment')
            .filter({ ticket_id: ticket.ticket_id })
            .value()
            .map(attachment => ({
                attachment_id: attachment.attachment_id,
                file_name: attachment.file_name,
                file_size: attachment.file_size,
                file_type: attachment.file_type,
                uploaded_time: attachment.uploaded_time
            }));

        // Get feedback
        const feedback = this.db.get('feedback')
            .find({ ticket_id: ticket.ticket_id })
            .value();

        const commonData = {
            ...baseData,
            customer: customer ? {
                customer_id: customer.customer_id,
                full_name: customer.full_name,
                email: customer.email,
                phone_number: customer.phone_number
            } : null,
            
            customer_status: customerStatus ? {
                customer_status_id: customerStatus.customer_status_id,
                customer_status_name: customerStatus.customer_status_name,
                customer_status_code: customerStatus.customer_status_code
            } : null,
            
            issue_channel: channel ? {
                channel_id: channel.channel_id,
                channel_name: channel.channel_name,
                channel_code: channel.channel_code
            } : null,
            
            complaint: complaint ? {
                complaint_id: complaint.complaint_id,
                complaint_name: complaint.complaint_name,
                complaint_code: complaint.complaint_code
            } : null,
            
            related_account: relatedAccount ? {
                account_id: relatedAccount.account_id,
                account_number: relatedAccount.account_number,
                account_type: relatedAccount.account_type
            } : null,
            
            related_card: relatedCard ? {
                card_id: relatedCard.card_id,
                card_number: relatedCard.card_number,
                card_type: relatedCard.card_type
            } : null,
            
            activities: activities,
            attachments: attachments,
            
            feedback: feedback ? {
                feedback_id: feedback.feedback_id,
                rating: feedback.rating,
                comment: feedback.comment,
                created_time: feedback.created_time
            } : null
        };

        // Customer role: return limited data
        if (userRole === 'customer') {
            return commonData;
        }

        // Employee role: return full data
        if (userRole === 'employee') {
            const employee = this.db.get('employee')
                .find({ employee_id: ticket.responsible_employee_id })
                .value();

            const priority = this.db.get('priority')
                .find({ priority_id: ticket.priority_id })
                .value();

            const employeeStatus = this.db.get('employee_status')
                .find({ employee_status_id: ticket.employee_status_id })
                .value();

            const terminal = this.db.get('terminal')
                .find({ terminal_id: ticket.terminal_id })
                .value();

            const source = this.db.get('source')
                .find({ source_id: ticket.intake_source_id })
                .value();

            const policy = this.db.get('complaint_policy')
                .find({ policy_id: ticket.policy_id })
                .value();

            return {
                ...commonData,
                ticket_id: ticket.ticket_id,
                
                employee: employee ? {
                    employee_id: employee.employee_id,
                    full_name: employee.full_name,
                    npp: employee.npp,
                    email: employee.email
                } : null,
                
                priority: priority ? {
                    priority_id: priority.priority_id,
                    priority_name: priority.priority_name,
                    priority_code: priority.priority_code
                } : null,
                
                employee_status: employeeStatus ? {
                    employee_status_id: employeeStatus.employee_status_id,
                    employee_status_name: employeeStatus.employee_status_name,
                    employee_status_code: employeeStatus.employee_status_code
                } : null,
                
                terminal: terminal ? {
                    terminal_id: terminal.terminal_id,
                    terminal_code: terminal.terminal_code,
                    location: terminal.location
                } : null,
                
                intake_source: source ? {
                    source_id: source.source_id,
                    source_name: source.source_name,
                    source_code: source.source_code
                } : null,
                
                policy: policy ? {
                    policy_id: policy.policy_id,
                    sla: policy.sla,
                    uic_id: policy.uic_id
                } : null,
                
                committed_due_at: ticket.committed_due_at,
                division_notes: ticket.division_notes,
                
                sla_info: this.calculateSLAInfo(ticket)
            };
        }

        return commonData;
    }

    calculateSLAInfo(ticket) {
        if (!ticket.committed_due_at) return null;

        const now = new Date();
        const dueDate = new Date(ticket.committed_due_at);
        const diffMs = dueDate.getTime() - now.getTime();
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

        return {
            committed_due_at: ticket.committed_due_at,
            remaining_hours: diffHours,
            is_overdue: diffHours < 0,
            status: diffHours < 0 ? 'overdue' : diffHours <= 24 ? 'urgent' : 'normal'
        };
    }
}

module.exports = TicketController;