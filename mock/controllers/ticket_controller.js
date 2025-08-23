const { NotFoundError, ForbiddenError, ValidationError, ConflictError } = require('../middlewares/error_handler');
const { HTTP_STATUS } = require('../constants/statusCodes');
const EmailEscalationService = require('../services/emailEscalationService');

class TicketController {
    constructor(db) {
        this.db = db;
        this.emailEscalationService = new EmailEscalationService(db);
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
            } else if (req.user.role === 'employee') {
                // Check role_id and division_id from JWT token
                if (req.user.role_id === 1 && req.user.division_id === 1) {
                    // CXC Agent can see all tickets - no filter
                } else {
                    // Other employees (non-CXC): hanya lihat ticket yang di-escalate ke division mereka
                    tickets = tickets.filter(ticket => {
                        // Cek status employee
                        const employeeStatus = this.db.get('employee_status')
                            .find({ employee_status_id: ticket.employee_status_id })
                            .value();
                        
                        // Jika bukan status ESCALATED, tidak bisa lihat
                        if (employeeStatus?.employee_status_code !== 'ESCALATED') {
                            return false;
                        }
                        
                        // Jika ESCALATED, cek apakah policy division cocok dengan user division
                        const policy = this.db.get('complaint_policy')
                            .find({ policy_id: ticket.policy_id })
                            .value();
                        
                        return policy?.uic_id == req.user.division_id;
                    });
                    
                }
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

            const allTickets = paginatedTickets.map(ticket => {

                const channel = this.db.get('channel')
                    .find({ channel_id: ticket.issue_channel_id })
                    .value();
            
                const customerStatus = this.db.get('customer_status')
                    .find({ customer_status_id: ticket.customer_status_id })
                    .value();

                const baseTicket = {
                    ticket_id: ticket.ticket_id,
                    ticket_number: ticket.ticket_number,
                    issue_channel: channel ? {
                        channel_id: channel.channel_id,
                        channel_name: channel.channel_name,
                        channel_code: channel.channel_code
                    } : null,
                    created_time: ticket.created_time
                }

                if(req.user.role === 'employee') {

                    const customer = this.db.get('customer')
                        .find({ customer_id: ticket.customer_id })
                        .value();

                    const complaint = this.db.get('complaint_category')
                        .find({ complaint_id: ticket.complaint_id })
                        .value();

                    const employeeStatus = this.db.get('employee_status')
                        .find({ employee_status_id: ticket.employee_status_id })
                        .value();

                    const policy = this.db.get('complaint_policy')
                        .find({ policy_id: ticket.policy_id })
                        .value();

                    const customTicket = {
                        ...baseTicket,

                        customer: customer ? {
                            customer_id: customer.customer_id,
                            full_name: customer.full_name,
                            email: customer.email
                        } : null,

                        complaint: complaint ? {
                            complaint_id: complaint.complaint_id,
                            complaint_name: complaint.complaint_name,
                            complaint_code: complaint.complaint_code
                        } : null,

                        employee_status: employeeStatus ? {
                            employee_status_id: employeeStatus.employee_status_id,
                            employee_status_name: employeeStatus.employee_status_name,
                            employee_status_code: employeeStatus.employee_status_code
                        } : null

                    }
                    if(req.user.role_id === 1 && req.user.division_id === 1) {

                        const relatedAccount = this.db.get('account')
                            .find({ account_id: ticket.related_account_id })
                            .value();

                        const relatedCard = this.db.get('card')
                            .find({ card_id: ticket.related_card_id })
                            .value();

                        const source = this.db.get('source')
                            .find({ source_id: ticket.intake_source_id })
                            .value();

                        return {
                            ...customTicket,

                            related_account: relatedAccount ? {
                                account_id: relatedAccount.account_id,
                                account_number: relatedAccount.account_number
                            } : null,
                            
                            related_card: relatedCard ? {
                                card_id: relatedCard.card_id,
                                card_number: relatedCard.card_number,
                                card_type: relatedCard.card_type
                            } : null,

                            intake_source: source ? {
                                source_id: source.source_id,
                                source_name: source.source_name,
                                source_code: source.source_code
                            } : null,

                            division: (() => {
                                let targetDivisionId;
                                
                                if (employeeStatus?.employee_status_code === 'ESCALATED') {
                                    targetDivisionId = policy?.uic_id;
                                } else {
                                    targetDivisionId = 1;
                                }

                                const division = this.db.get('division')
                                    .find({ division_id: targetDivisionId })
                                    .value();
                                
                                return division ? {
                                    division_id: division.division_id,
                                    division_name: division.division_name,
                                    division_code: division.division_code
                                } : null;
                            })(),

                            policy: policy ? {
                                policy_id: policy.policy_id,
                                sla_days: policy.sla,
                                sla_hours: policy.sla * 24
                            } : null,

                            committed_due_at: ticket.committed_due_at,

                            sla_info: this.calculateSLAInfo(ticket),
                        }
                    } else {
                        return {
                            ...customTicket,

                            policy: policy ? {
                                policy_id: policy.policy_id,
                                sla_days: policy.sla,
                                sla_hours: policy.sla * 24
                            } : null,

                            committed_due_at: ticket.committed_due_at,

                            sla_info: this.calculateSLAInfo(ticket),
                        }
                    }
                } else {
                    return {
                        ...baseTicket,
                        customer_status: customerStatus ? {
                            customer_status_id: customerStatus.customer_status_id,
                            customer_status_name: customerStatus.customer_status_name,
                            customer_status_code: customerStatus.customer_status_code
                        } : null
                    }
                }
            })

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Tickets retrieved successfully',
                data: allTickets,
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
            ticket_id: ticket.ticket_id,
            ticket_number: ticket.ticket_number,
            description: ticket.description,
            transaction_date: ticket.transaction_date,
            amount: ticket.amount,
            reason: ticket.reason || "",
            solution: ticket.solution || "",
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
                
                policy: policy ? (() => {
                    const policyData = {
                        policy_id: policy.policy_id,
                        sla_days: policy.sla,
                        sla_hours: policy.sla * 24,
                        uic_id: policy.uic_id
                    };
                    
                    if (policy.uic_id) {
                        const division = this.db.get('division')
                            .find({ division_id: policy.uic_id })
                            .value();
                        
                        if (division) {
                            policyData.uic_code = division.division_code;
                            policyData.uic_name = division.division_name;
                        }
                    }
                    
                    return policyData;
                })() : null,
                
                committed_due_at: ticket.committed_due_at,
                division_notes: this.parseDivisionNotes(ticket.division_notes),
                
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
                throw new NotFoundError('Ticket');
            }

            // Role-based access control
            if (req.user.role === 'customer' && ticket.customer_id !== req.user.id) {
                throw new ForbiddenError('Access denied');
            } else if (req.user.role === 'employee') {
                // Check role_id and division_id from JWT token
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    if (ticket.responsible_employee_id !== req.user.id) {
                        return res.status(HTTP_STATUS.FORBIDDEN).json({
                            success: false,
                            message: 'Access denied - you can only view tickets assigned to you'
                        });
                    }
                }
            }

            const detailedTicket = this.getDetailedTicketData(ticket, req.user.role);

            res.status(HTTP_STATUS.OK).json({
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
            record: ticket.record || "",
            reason: ticket.reason || "",
            solution: ticket.solution || "",
            created_time: ticket.created_time,
            closed_time: ticket.closed_time
        };

        // Get status history from activities
        const statusHistory = this.getStatusHistory(ticket.ticket_id);
        
        // Get email history from activities
        const emailHistory = this.getEmailHistory(ticket.ticket_id);

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

        // Get activities first
        const rawActivities = this.db.get('ticket_activity')
            .filter({ ticket_id: ticket.ticket_id })
            .value();

        const activities = rawActivities.map(activity => {
            const activityType = this.db.get('ticket_activity_type')
                .find({ ticket_activity_type_id: activity.ticket_activity_type_id })
                .value();
            
            const senderType = this.db.get('sender_type')
                .find({ sender_type_id: activity.sender_type_id })
                .value();
            
            return {
                ticket_activity_id: activity.ticket_activity_id,
                activity_type: activityType ? {
                    ticket_activity_type_id: activityType.ticket_activity_type_id,
                    ticket_activity_code: activityType.ticket_activity_code,
                    ticket_activity_name: activityType.ticket_activity_name
                } : null,
                sender_type: senderType ? {
                    sender_type_id: senderType.sender_type_id,
                    sender_type_code: senderType.sender_type_code,
                    sender_type_name: senderType.sender_type_name
                } : null,
                sender_id: activity.sender_id,
                content: activity.content,
                ticket_activity_time: activity.ticket_activity_time
            };
        });

        // Get attachments (through ticket activities)
        const attachments = [];
        rawActivities.forEach(activity => {
            const activityAttachments = this.db.get('attachment')
                .filter({ ticket_activity_id: activity.ticket_activity_id })
                .value()
                .map(attachment => ({
                    attachment_id: attachment.attachment_id,
                    ticket_activity_id: attachment.ticket_activity_id,
                    file_name: attachment.file_name,
                    file_path: attachment.file_path,
                    file_size: attachment.file_size,
                    file_type: attachment.file_type,
                    upload_time: attachment.upload_time
                }));
            attachments.push(...activityAttachments);
        });

        // Get feedback
        const feedback = this.db.get('feedback')
            .find({ ticket_id: ticket.ticket_id })
            .value();

        const commonData = {
            ...baseData,
            customer,
            
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
            status_history: statusHistory,
            email_history: emailHistory,
            
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
                
                policy: policy ? (() => {
                    const policyData = {
                        policy_id: policy.policy_id,
                        sla: policy.sla,
                        uic_id: policy.uic_id
                    };
                    
                    if (policy.uic_id) {
                        const division = this.db.get('division')
                            .find({ division_id: policy.uic_id })
                            .value();
                        
                        if (division) {
                            policyData.uic_code = division.division_code;
                            policyData.uic_name = division.division_name;
                        }
                    }
                    
                    return policyData;
                })() : null,
                
                committed_due_at: ticket.committed_due_at,
                division_notes: this.parseDivisionNotes(ticket.division_notes),
                
                sla_info: this.calculateSLAInfo(ticket)
            };
        }

        return commonData;
    }

    async createTicket(req, res, next) {
        try {
            const {
                action,
                customer_id, // For employee use
                priority_id,
                record,
                issue_channel_id, // Wajib
                intake_source_id,
                amount,
                complaint_id, // Wajib
                transaction_date,
                terminal_id,
                description, // Wajib
                related_account_id,
                related_card_id,
                division_notes,
                reason,
                solution,
                committed_due_at,
                policy_id
            } = req.body;

            // Validation
            if (!description || !issue_channel_id || !complaint_id) {
                throw new ValidationError('Required fields: description, issue_channel_id, complaint_id');
            }

            // Employee role and permission check
            if (req.user.role === 'employee') {
                // Check role_id and division_id from JWT token
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    return res.status(HTTP_STATUS.FORBIDDEN).json({
                        success: false,
                        message: 'Only CXC agents can create tickets'
                    });
                }
                
                // CXC agent must provide customer_id
                if (!customer_id) {
                    return res.status(HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: 'Employee must provide customer_id'
                    });
                }
            }

            // Validate references exist
            const channel = this.db.get('channel').find({ channel_id: parseInt(issue_channel_id) }).value();
            if (!channel) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid issue_channel_id'
                });
            }

            const complaint = this.db.get('complaint_category').find({ complaint_id: parseInt(complaint_id) }).value();
            if (!complaint) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid complaint_id'
                });
            }

            // Get customer data (role-based)
            const targetCustomerId = req.user.role === 'customer' ? req.user.id : parseInt(customer_id);
            const customer = this.db.get('customer').find({ customer_id: targetCustomerId }).value();
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            // Business Logic: Resolve Policy & SLA
            const policy = this.resolvePolicy(complaint.complaint_id, channel.channel_id);
            
            // Generate ticket number
            const ticketNumber = this.generateTicketNumber();
            
            // Get statuses (default or employee-specified)
            let customerStatus, employeeStatus;
            
            if(!action) {
                customerStatus = this.db.get('customer_status')
                    .find({ customer_status_code: "ACC" })
                    .value();

                employeeStatus = this.db.get('employee_status')
                    .find({ employee_status_code: "OPEN" })
                    .value();
            }

            if(action === 'ESCALATED') {
                customerStatus = this.db.get('customer_status')
                    .find({ customer_status_code: "PROCESS" })
                    .value();

                employeeStatus = this.db.get('employee_status')
                    .find({ employee_status_code: "ESCALATED" })
                    .value();
            }

            if(action === 'CLOSED') {
                customerStatus = this.db.get('customer_status')
                    .find({ customer_status_code: "CLOSED" })
                    .value();

                employeeStatus = this.db.get('employee_status')
                    .find({ employee_status_code: "CLOSED" })
                    .value();
            }

            // Create ticket
            const newTicket = {
                ticket_id: this.getNextId('ticket'),
                ticket_number: ticketNumber,
                description: description,
                record: record || "", // Initialize empty record field
                reason: reason || "",
                solution: solution || "",
                customer_id: targetCustomerId,
                customer_status_id: customerStatus?.customer_status_id,
                employee_status_id: employeeStatus?.employee_status_id,
                priority_id: priority_id || 3,
                issue_channel_id: parseInt(issue_channel_id),
                intake_source_id: req.user.role === 'customer' ? 2 : intake_source_id,
                related_account_id: related_account_id ? parseInt(related_account_id) : null,
                related_card_id: related_card_id ? parseInt(related_card_id) : null,
                complaint_id: parseInt(complaint_id),
                responsible_employee_id: !action ? null : req.user.id, // Will be assigned later
                policy_id: policy?.policy_id || null,
                committed_due_at: committed_due_at,
                transaction_date: transaction_date || null,
                amount: amount || null,
                terminal_id: terminal_id ? parseInt(terminal_id) : null,
                created_time: new Date().toISOString(),
                closed_time: employeeStatus?.employee_status_id === 4 ? new Date().toISOString() : null,
                division_notes: division_notes ? JSON.stringify(division_notes) : null,
                delete_at: null,
                delete_by: null
            };

            // Save ticket
            this.db.get('ticket').push(newTicket).write();

            // Create initial activity
            const initialActivity = {
                ticket_activity_id: this.getNextId('ticket_activity'),
                ticket_id: newTicket.ticket_id,
                ticket_activity_type_id: 1,
                sender_type_id: req.user.role === 'customer' ? 1 : 2,
                sender_id: req.user.id,
                content: req.user.role === 'customer' 
                    ? `Ticket created: ${description}`
                    : `Ticket created by employee for customer ${customer.full_name}: ${description}`,
                ticket_activity_time: new Date().toISOString()
            };

            this.db.get('ticket_activity').push(initialActivity).write();

            // Create status history activities based on action
            this.createStatusHistoryActivities(newTicket, action, req.user, customerStatus, employeeStatus);

            // Send escalation email if ticket was created with escalation
            if (action === 'ESCALATED') {
                try {
                    await this.emailEscalationService.sendEscalationEmail(newTicket.ticket_id, req.user.id);
                } catch (emailError) {
                    console.error('Failed to send escalation email:', emailError);
                    // Don't fail the entire request if email fails
                }
            }

            // Return created ticket with enriched data
            const enrichedTicket = this.enrichTicketData(newTicket, 'customer');

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Ticket created successfully',
                data: {
                    ...enrichedTicket,
                    ticket_id: newTicket.ticket_id,
                    record: newTicket.record,
                    sla_info: {
                        committed_due_at: committed_due_at,
                        sla_days: policy?.sla || 1,
                        sla_hours: (policy?.sla || 1) * 24
                    }
                }
            });

        } catch (error) {
            next(error);
        }
    }

    resolvePolicy(complaintId, channelId) {
        // Get all matching policies
        const policies = this.db.get('complaint_policy')
            .filter(p => p.complaint_id === complaintId && p.channel_id === channelId)
            .value();
        
        if (policies.length === 0) {
            // Fallback: find by complaint only
            return this.db.get('complaint_policy')
                .find({ complaint_id: complaintId })
                .value();
        }
        
        if (policies.length === 1) {
            return policies[0];
        }
        
        // SMART SELECTION for multiple policies
        return this.selectBestPolicy(policies, complaintId, channelId);
    }

    selectBestPolicy(policies, complaintId, channelId) {
        // Rule 1: Prioritize by SLA (shortest = most critical)
        const shortestSLA = Math.min(...policies.map(p => p.sla));
        let candidates = policies.filter(p => p.sla === shortestSLA);
        
        if (candidates.length === 1) return candidates[0];
        
        // Rule 2: Prioritize specific descriptions over generic
        const specificKeywords = ['BNI', 'Bank Lain', 'ATM BNI', 'ATM Bank Lain'];
        const specificPolicy = candidates.find(p => 
            specificKeywords.some(keyword => p.description.includes(keyword))
        );
        
        if (specificPolicy) return specificPolicy;
        
        // Rule 3: Prioritize by UIC (lower UIC = more specialized)
        candidates.sort((a, b) => a.uic_id - b.uic_id);
        
        // Rule 4: Log for monitoring
        console.warn(`Multiple policies found for channel ${channelId} + complaint ${complaintId}. Selected policy ${candidates[0].policy_id}`);
        
        return candidates[0];
    }

    generateTicketNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        // Get today's ticket count
        const todayStart = new Date(year, now.getMonth(), now.getDate()).toISOString();
        const todayEnd = new Date(year, now.getMonth(), now.getDate() + 1).toISOString();
        
        const todayTickets = this.db.get('ticket')
            .filter(ticket => ticket.created_time >= todayStart && ticket.created_time < todayEnd)
            .value();
        
        const sequence = String(todayTickets.length + 1).padStart(4, '0');
        
        return `BNI-${year}${month}${day}${sequence}`;
    }

    calculateSLADueDate(slaDays) {
        const now = new Date();
        const dueDate = new Date(now.getTime() + (slaDays * 24 * 60 * 60 * 1000));
        return dueDate.toISOString();
    }

    createStatusHistoryActivities(ticket, action, user, customerStatus, employeeStatus) {
        const timestamp = new Date().toISOString();
        const activities = [];

        if (!action) {
            // Default creation - ACC/OPEN status
            activities.push({
                ticket_activity_id: this.getNextId('ticket_activity'),
                ticket_id: ticket.ticket_id,
                ticket_activity_type_id: 2, // STATUS_CHANGE
                sender_type_id: user.role === 'customer' ? 1 : 2,
                sender_id: user.id,
                content: `Initial status set: customer status to ${customerStatus.customer_status_code}, employee status to ${employeeStatus.employee_status_code}`,
                ticket_activity_time: timestamp
            });
        } else if (action === 'ESCALATED') {
            // Escalated creation - PROCESS/ESCALATED status
            activities.push({
                ticket_activity_id: this.getNextId('ticket_activity'),
                ticket_id: ticket.ticket_id,
                ticket_activity_type_id: 2, // STATUS_CHANGE
                sender_type_id: 2, // Employee
                sender_id: user.id,
                content: `Ticket created and escalated: customer status to ${customerStatus.customer_status_code}, employee status to ${employeeStatus.employee_status_code}`,
                ticket_activity_time: timestamp
            });
        } else if (action === 'CLOSED') {
            // Closed creation - CLOSED/CLOSED status
            activities.push({
                ticket_activity_id: this.getNextId('ticket_activity'),
                ticket_id: ticket.ticket_id,
                ticket_activity_type_id: 2, // STATUS_CHANGE
                sender_type_id: 2, // Employee
                sender_id: user.id,
                content: `Ticket created and closed: customer status to ${customerStatus.customer_status_code}, employee status to ${employeeStatus.employee_status_code}`,
                ticket_activity_time: timestamp
            });
        }

        // Save all status history activities
        activities.forEach(activity => {
            this.db.get('ticket_activity').push(activity).write();
        });
    }

    createUpdateActivity(ticketId, action, user, customerStatus, employeeStatus) {
        const timestamp = new Date().toISOString();
        let content = '';

        switch(action) {
            case 'HANDLEDCXC':
                content = 'Ticket handled by CXC agent';
                break;
            case 'ESCALATED':
                content = 'Ticket escalated to specialist division';
                break;
            case 'CLOSED':
                content = 'Ticket closed by CXC agent';
                break;
            case 'DECLINED':
                content = 'Ticket declined by CXC agent';
                break;
            case 'DONE_BY_UIC':
                content = 'Ticket completed by UIC division';
                break;
            default:
                content = 'Ticket updated';
        }

        const activity = {
            ticket_activity_id: this.getNextId('ticket_activity'),
            ticket_id: ticketId,
            ticket_activity_type_id: 1, // COMMENT
            sender_type_id: 2, // Employee
            sender_id: user.id,
            content: content,
            ticket_activity_time: timestamp
        };

        this.db.get('ticket_activity').push(activity).write();
    }

    createUpdateStatusHistory(ticketId, action, user, customerStatus, employeeStatus) {
        const timestamp = new Date().toISOString();
        let content = '';

        if (customerStatus && employeeStatus) {
            content = `Status updated via ${action}: customer status to ${customerStatus.customer_status_code}, employee status to ${employeeStatus.employee_status_code}`;
        } else if (customerStatus) {
            content = `Status updated via ${action}: customer status to ${customerStatus.customer_status_code}`;
        } else if (employeeStatus) {
            content = `Status updated via ${action}: employee status to ${employeeStatus.employee_status_code}`;
        }

        if (content) {
            const statusActivity = {
                ticket_activity_id: this.getNextId('ticket_activity'),
                ticket_id: ticketId,
                ticket_activity_type_id: 2, // STATUS_CHANGE
                sender_type_id: 2, // Employee
                sender_id: user.id,
                content: content,
                ticket_activity_time: timestamp
            };

            this.db.get('ticket_activity').push(statusActivity).write();
        }
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

    async updateTicket(req, res, next) {
        try {
            const { id } = req.params;
            const {
                action,
                priority_id,
                record,
                issue_channel_id,
                intake_source_id,
                amount,
                complaint_id,
                transaction_date,
                terminal_id,
                description,
                division_notes,
                reason,
                solution,
            } = req.body;

            const ticket = this.db.get('ticket')
                .find({ ticket_id: parseInt(id) })
                .value();

            if (!ticket) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            // Role-based access control - Only employees can update tickets
            if (req.user.role === 'customer') {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: 'Customers cannot update tickets'
                });
            }

            let customerStatus, employeeStatus, responsible_employee_id;
            // Prepare update data
            const updateData = {};

            if(!action) {
                if(division_notes) {
                    updateData.division_notes = JSON.stringify(division_notes)
                }
            }

            if(action === 'HANDLEDCXC' && req.user.division_id === 1) {
                
                customerStatus = this.db.get('customer_status')
                    .find({ customer_status_code: "VERIF" })
                    .value();

                employeeStatus = this.db.get('employee_status')
                    .find({ employee_status_code: "HANDLEDCXC" })
                    .value();

                responsible_employee_id = req.user.id

                updateData.customer_status_id = customerStatus.customer_status_id
                updateData.employee_status_id = employeeStatus.employee_status_id
                updateData.responsible_employee_id = responsible_employee_id
            }

            if(action === 'ESCALATED' && req.user.division_id === 1) {
                customerStatus = this.db.get('customer_status')
                    .find({ customer_status_code: "PROCESS" })
                    .value();

                employeeStatus = this.db.get('employee_status')
                    .find({ employee_status_code: "ESCALATED" })
                    .value();

                updateData.customer_status_id = customerStatus.customer_status_id
                updateData.employee_status_id = employeeStatus.employee_status_id

                if(priority_id) {
                    updateData.priority_id = priority_id
                }
                if(record) {
                    updateData.record = record
                }
                if(issue_channel_id) {
                    updateData.issue_channel_id = issue_channel_id
                }
                if(intake_source_id) {
                    updateData.intake_source_id = intake_source_id
                }
                if(complaint_id) {
                    updateData.complaint_id = complaint_id
                }
                if(amount) {
                    updateData.amount = amount
                }
                if(transaction_date) {
                    updateData.transaction_date = transaction_date
                }
                if(terminal_id) {
                    updateData.terminal_id = terminal_id
                }
                if(description) {
                    updateData.description = description
                }
                if(division_notes) {
                    updateData.division_notes = JSON.stringify(division_notes)
                }
            }

            if(action === 'CLOSED' && req.user.division_id === 1) {
                customerStatus = this.db.get('customer_status')
                    .find({ customer_status_code: "CLOSED" })
                    .value();

                employeeStatus = this.db.get('employee_status')
                    .find({ employee_status_code: "CLOSED" })
                    .value();

                updateData.customer_status_id = customerStatus.customer_status_id
                updateData.employee_status_id = employeeStatus.employee_status_id

                if(priority_id) {
                    updateData.priority_id = priority_id
                }
                if(record) {
                    updateData.record = record
                }
                if(issue_channel_id) {
                    updateData.issue_channel_id = issue_channel_id
                }
                if(intake_source_id) {
                    updateData.intake_source_id = intake_source_id
                }
                if(complaint_id) {
                    updateData.complaint_id = complaint_id
                }
                if(amount) {
                    updateData.amount = amount
                }
                if(transaction_date) {
                    updateData.transaction_date = transaction_date
                }
                if(terminal_id) {
                    updateData.terminal_id = terminal_id
                }
                if(description) {
                    updateData.description = description
                }
                if(solution) {
                    updateData.solution = solution
                }
                if(division_notes) {
                    updateData.division_notes = JSON.stringify(division_notes)
                }

                updateData.closed_time = new Date().toISOString()
            }

            if(action === 'DECLINED' && req.user.division_id === 1) {
                customerStatus = this.db.get('customer_status')
                    .find({ customer_status_code: "DECLINED" })
                    .value();

                employeeStatus = this.db.get('employee_status')
                    .find({ employee_status_code: "DECLINED" })
                    .value();

                updateData.customer_status_id = customerStatus.customer_status_id
                updateData.employee_status_id = employeeStatus.employee_status_id

                if(priority_id) {
                    updateData.priority_id = priority_id
                }
                if(record) {
                    updateData.record = record
                }
                if(issue_channel_id) {
                    updateData.issue_channel_id = issue_channel_id
                }
                if(intake_source_id) {
                    updateData.intake_source_id = intake_source_id
                }
                if(complaint_id) {
                    updateData.complaint_id = complaint_id
                }
                if(amount) {
                    updateData.amount = amount
                }
                if(transaction_date) {
                    updateData.transaction_date = transaction_date
                }
                if(terminal_id) {
                    updateData.terminal_id = terminal_id
                }
                if(description) {
                    updateData.description = description
                }
                if(reason) {
                    updateData.reason = reason
                }
                if(division_notes) {
                    updateData.division_notes = JSON.stringify(division_notes)
                }

                updateData.closed_time = new Date().toISOString()
            }

            if(action === 'DONE_BY_UIC' && req.user.division_id !== 1) {
                customerStatus = this.db.get('customer_status')
                    .find({ customer_status_code: "PROCESS" })
                    .value();

                employeeStatus = this.db.get('employee_status')
                    .find({ employee_status_code: "DONE_BY_UIC" })
                    .value();

                updateData.customer_status_id = customerStatus.customer_status_id
                updateData.employee_status_id = employeeStatus.employee_status_id

                if(division_notes) {
                    updateData.division_notes = JSON.stringify(division_notes)
                }
            }
            
            // Check if updateData object is empty
            if(Object.keys(updateData).length === 0) {
                
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'No valid update data provided'
                });
            }

            // Update ticket
            this.db.get('ticket')
                .find({ ticket_id: parseInt(id) })
                .assign(updateData)
                .write();

            // Create activity log for update
            this.createUpdateActivity(parseInt(id), action, req.user, customerStatus, employeeStatus);

            // Create status history if status changed
            if (customerStatus || employeeStatus) {
                this.createUpdateStatusHistory(parseInt(id), action, req.user, customerStatus, employeeStatus);
            }

            // Send escalation email if ticket was escalated
            if (action === 'ESCALATED') {
                try {
                    await this.emailEscalationService.sendEscalationEmail(parseInt(id), req.user.id);
                } catch (emailError) {
                    console.error('Failed to send escalation email:', emailError);
                    // Don't fail the entire request if email fails
                }
            }
                
            // Get updated ticket
            const updatedTicket = this.db.get('ticket')
                .find({ ticket_id: parseInt(id) })
                .value();

            const enrichedTicket = this.enrichTicketData(updatedTicket, req.user.role);

            res.status(200).json({
                success: true,
                message: 'Ticket updated successfully',
                data: enrichedTicket
            });

        } catch (error) {
            next(error);
        }
    }

    generateUpdateActivityContent(updateData, userRole) {
        const changes = [];
        
        if (updateData.description) changes.push('description');
        if (updateData.record) changes.push('record');
        if (updateData.customer_status) changes.push(`customer status to ${updateData.customer_status}`);
        if (updateData.employee_status) changes.push(`employee status to ${updateData.employee_status}`);
        if (updateData.priority) changes.push(`priority to ${updateData.priority}`);
        if (updateData.responsible_employee_id) changes.push('responsible employee');
        if (updateData.division_notes) changes.push('division notes');
        if (updateData.transaction_date) changes.push('transaction date');
        if (updateData.amount) changes.push('amount');
        if (updateData.related_account_id) changes.push('related account');
        if (updateData.related_card_id) changes.push('related card');
        if (updateData.terminal_id) changes.push('terminal');
        
        return `Employee updated: ${changes.join(', ')}`;
    }

    async deleteTicket(req, res, next) {
        try {
            const { id } = req.params;

            const ticket = this.db.get('ticket')
                .find({ ticket_id: parseInt(id) })
                .value();

            if (!ticket) {
                throw new NotFoundError('Ticket');
            }

            // Check if already deleted
            if (ticket.deleted_at) {
                throw new ConflictError('Ticket already deleted');
            }

            // Role-based access control - Only CXC employees can delete tickets
            if (req.user.role !== 'employee') {
                throw new ForbiddenError('Only employees can delete tickets');
            }

            // Check if user is CXC employee (role_id=1 AND division_id=1)
            if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                throw new ForbiddenError('Only CXC employees can delete tickets');
            }

            // Business rule: Cannot delete closed tickets
            const employeeStatus = this.db.get('employee_status')
                .find({ employee_status_id: ticket.employee_status_id })
                .value();

            if (employeeStatus && ['CLOSED', 'RESOLVED'].includes(employeeStatus.employee_status_code)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete closed or resolved tickets'
                });
            }

            // Soft delete - add deleted_at timestamp and deleted_by
            const deleteData = {
                deleted_at: new Date().toISOString(),
                deleted_by: req.user.id
            };

            this.db.get('ticket')
                .find({ ticket_id: parseInt(id) })
                .assign(deleteData)
                .write();

            // Create activity log for deletion
            const deleteActivity = {
                ticket_activity_id: this.getNextId('ticket_activity'),
                ticket_id: parseInt(id),
                ticket_activity_type_id: 4, // Assuming 4 = delete activity
                sender_type_id: 2, // Employee
                sender_id: req.user.id,
                content: `Ticket deleted by ${req.user.full_name || req.user.npp}`,
                ticket_activity_time: new Date().toISOString()
            };

            this.db.get('ticket_activity').push(deleteActivity).write();

            res.status(200).json({
                success: true,
                message: 'Ticket deleted successfully',
                data: {
                    ticket_id: ticket.ticket_id,
                    ticket_number: ticket.ticket_number,
                    deleted_at: deleteData.deleted_at,
                    deleted_by: deleteData.deleted_by
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async getTicketActivities(req, res, next) {
        try {
            const { id } = req.params;
            const { limit = 50, offset = 0, activity_type } = req.query;

            const ticket = this.db.get('ticket')
                .find({ ticket_id: parseInt(id) })
                .value();

            if (!ticket) {
                throw new NotFoundError('Ticket');
            }

            // Role-based access control
            if (req.user.role === 'customer' && ticket.customer_id !== req.user.id) {
                throw new ForbiddenError('Access denied');
            } else if (req.user.role === 'employee') {
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    if (ticket.responsible_employee_id !== req.user.id) {
                        throw new ForbiddenError('Access denied - you can only view activities for tickets assigned to you');
                    }
                }
            }

            // Get activities
            let activities = this.db.get('ticket_activity')
                .filter({ ticket_id: parseInt(id) })
                .value();

            // Filter by activity type if provided
            if (activity_type) {
                const activityTypeData = this.db.get('ticket_activity_type')
                    .find({ ticket_activity_code: activity_type.toUpperCase() })
                    .value();
                
                if (activityTypeData) {
                    activities = activities.filter(activity => 
                        activity.ticket_activity_type_id === activityTypeData.ticket_activity_type_id
                    );
                }
            }

            // Sort by time (newest first)
            activities.sort((a, b) => new Date(b.ticket_activity_time) - new Date(a.ticket_activity_time));

            const total = activities.length;
            const paginatedActivities = activities.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

            // Enrich activities with related data
            const enrichedActivities = paginatedActivities.map(activity => {
                const activityType = this.db.get('ticket_activity_type')
                    .find({ ticket_activity_type_id: activity.ticket_activity_type_id })
                    .value();
                
                const senderType = this.db.get('sender_type')
                    .find({ sender_type_id: activity.sender_type_id })
                    .value();

                // Get sender details based on sender type
                let sender = null;
                if (senderType?.sender_type_code === 'CUSTOMER') {
                    const customer = this.db.get('customer')
                        .find({ customer_id: activity.sender_id })
                        .value();
                    if (customer) {
                        sender = {
                            sender_id: customer.customer_id,
                            full_name: customer.full_name,
                            email: customer.email,
                            type: 'customer'
                        };
                    }
                } else if (senderType?.sender_type_code === 'EMPLOYEE') {
                    const employee = this.db.get('employee')
                        .find({ employee_id: activity.sender_id })
                        .value();
                    if (employee) {
                        const division = this.db.get('division')
                            .find({ division_id: employee.division_id })
                            .value();
                        sender = {
                            sender_id: employee.employee_id,
                            full_name: employee.full_name,
                            npp: employee.npp,
                            email: employee.email,
                            division: division ? {
                                division_id: division.division_id,
                                division_name: division.division_name,
                                division_code: division.division_code
                            } : null,
                            type: 'employee'
                        };
                    }
                }

                // Get attachments for this activity
                const attachments = this.db.get('attachment')
                    .filter({ ticket_activity_id: activity.ticket_activity_id })
                    .value()
                    .map(attachment => ({
                        attachment_id: attachment.attachment_id,
                        file_name: attachment.file_name,
                        file_path: attachment.file_path,
                        file_size: attachment.file_size,
                        file_type: attachment.file_type,
                        upload_time: attachment.upload_time
                    }));

                return {
                    ticket_activity_id: activity.ticket_activity_id,
                    activity_type: activityType ? {
                        ticket_activity_type_id: activityType.ticket_activity_type_id,
                        ticket_activity_code: activityType.ticket_activity_code,
                        ticket_activity_name: activityType.ticket_activity_name
                    } : null,
                    sender_type: senderType ? {
                        sender_type_id: senderType.sender_type_id,
                        sender_type_code: senderType.sender_type_code,
                        sender_type_name: senderType.sender_type_name
                    } : null,
                    sender: sender,
                    content: activity.content,
                    ticket_activity_time: activity.ticket_activity_time,
                    attachments: attachments
                };
            });

            res.status(200).json({
                success: true,
                message: 'Ticket activities retrieved successfully',
                data: {
                    ticket_id: parseInt(id),
                    ticket_number: ticket.ticket_number,
                    activities: enrichedActivities
                },
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

    async getTicketAttachments(req, res, next) {
        try {
            const { id } = req.params;
            const { limit = 20, offset = 0, file_type } = req.query;

            const ticket = this.db.get('ticket')
                .find({ ticket_id: parseInt(id) })
                .value();

            if (!ticket) {
                throw new NotFoundError('Ticket');
            }

            // Role-based access control
            if (req.user.role === 'customer' && ticket.customer_id !== req.user.id) {
                throw new ForbiddenError('Access denied');
            } else if (req.user.role === 'employee') {
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    if (ticket.responsible_employee_id !== req.user.id) {
                        throw new ForbiddenError('Access denied - you can only view attachments for tickets assigned to you');
                    }
                }
            }

            // Get all activities for this ticket
            const activities = this.db.get('ticket_activity')
                .filter({ ticket_id: parseInt(id) })
                .value();

            const activityIds = activities.map(activity => activity.ticket_activity_id);

            // Get all attachments for these activities
            let attachments = this.db.get('attachment')
                .filter(attachment => activityIds.includes(attachment.ticket_activity_id))
                .value();

            // Filter by file type if provided
            if (file_type) {
                attachments = attachments.filter(attachment => 
                    attachment.file_type.toLowerCase().includes(file_type.toLowerCase())
                );
            }

            // Sort by upload time (newest first)
            attachments.sort((a, b) => new Date(b.upload_time) - new Date(a.upload_time));

            const total = attachments.length;
            const paginatedAttachments = attachments.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

            // Enrich attachments with activity and sender info
            const enrichedAttachments = paginatedAttachments.map(attachment => {
                const activity = this.db.get('ticket_activity')
                    .find({ ticket_activity_id: attachment.ticket_activity_id })
                    .value();

                const activityType = this.db.get('ticket_activity_type')
                    .find({ ticket_activity_type_id: activity?.ticket_activity_type_id })
                    .value();

                const senderType = this.db.get('sender_type')
                    .find({ sender_type_id: activity?.sender_type_id })
                    .value();

                // Get sender details
                let sender = null;
                if (activity && senderType?.sender_type_code === 'CUSTOMER') {
                    const customer = this.db.get('customer')
                        .find({ customer_id: activity.sender_id })
                        .value();
                    if (customer) {
                        sender = {
                            sender_id: customer.customer_id,
                            full_name: customer.full_name,
                            type: 'customer'
                        };
                    }
                } else if (activity && senderType?.sender_type_code === 'EMPLOYEE') {
                    const employee = this.db.get('employee')
                        .find({ employee_id: activity.sender_id })
                        .value();
                    if (employee) {
                        sender = {
                            sender_id: employee.employee_id,
                            full_name: employee.full_name,
                            npp: employee.npp,
                            type: 'employee'
                        };
                    }
                }

                return {
                    attachment_id: attachment.attachment_id,
                    file_name: attachment.file_name,
                    file_path: attachment.file_path,
                    file_size: attachment.file_size,
                    file_type: attachment.file_type,
                    upload_time: attachment.upload_time,
                    activity: activity ? {
                        ticket_activity_id: activity.ticket_activity_id,
                        activity_type: activityType ? {
                            ticket_activity_code: activityType.ticket_activity_code,
                            ticket_activity_name: activityType.ticket_activity_name
                        } : null,
                        content: activity.content,
                        ticket_activity_time: activity.ticket_activity_time
                    } : null,
                    uploaded_by: sender
                };
            });

            res.status(200).json({
                success: true,
                message: 'Ticket attachments retrieved successfully',
                data: {
                    ticket_id: parseInt(id),
                    ticket_number: ticket.ticket_number,
                    attachments: enrichedAttachments
                },
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

    async getTicketFeedback(req, res, next) {
        try {
            const { id } = req.params;

            const ticket = this.db.get('ticket')
                .find({ ticket_id: parseInt(id) })
                .value();

            if (!ticket) {
                throw new NotFoundError('Ticket');
            }

            // Role-based access control
            if (req.user.role === 'customer' && ticket.customer_id !== req.user.id) {
                throw new ForbiddenError('Access denied');
            } else if (req.user.role === 'employee') {
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    if (ticket.responsible_employee_id !== req.user.id) {
                        throw new ForbiddenError('Access denied - you can only view feedback for tickets assigned to you');
                    }
                }
            }

            // Get feedback for this ticket
            const feedback = this.db.get('feedback')
                .find({ ticket_id: parseInt(id) })
                .value();

            if (!feedback) {
                return res.status(200).json({
                    success: true,
                    message: 'No feedback found for this ticket',
                    data: {
                        ticket_id: parseInt(id),
                        ticket_number: ticket.ticket_number,
                        feedback: null
                    }
                });
            }

            // Get customer info
            const customer = this.db.get('customer')
                .find({ customer_id: ticket.customer_id })
                .value();

            const enrichedFeedback = {
                feedback_id: feedback.feedback_id,
                score: feedback.score,
                comment: feedback.comment,
                submit_time: feedback.submit_time,
                customer: customer ? {
                    customer_id: customer.customer_id,
                    full_name: customer.full_name,
                    email: customer.email
                } : null
            };

            res.status(200).json({
                success: true,
                message: 'Ticket feedback retrieved successfully',
                data: {
                    ticket_id: parseInt(id),
                    ticket_number: ticket.ticket_number,
                    feedback: enrichedFeedback
                }
            });

        } catch (error) {
            next(error);
        }
    }

    getStatusHistory(ticketId) {
        const activities = this.db.get('ticket_activity')
            .filter({ ticket_id: ticketId })
            .value()
            .filter(activity => {
                const content = activity.content || '';
                return content.includes('status to') || 
                       content.includes('Initial status set') || 
                       content.includes('created and escalated') || 
                       content.includes('created and closed');
            })
            .sort((a, b) => new Date(a.ticket_activity_time) - new Date(b.ticket_activity_time));

        const history = {
            customer_status_history: [],
            employee_status_history: []
        };

        activities.forEach(activity => {
            const content = activity.content || '';
            const timestamp = activity.ticket_activity_time;
            
            // Get sender info
            const senderType = this.db.get('sender_type')
                .find({ sender_type_id: activity.sender_type_id })
                .value();
            
            let changedBy = 'System';
            if (senderType?.sender_type_code === 'EMPLOYEE') {
                const employee = this.db.get('employee')
                    .find({ employee_id: activity.sender_id })
                    .value();
                changedBy = employee?.full_name || employee?.npp || 'Employee';
            } else if (senderType?.sender_type_code === 'CUSTOMER') {
                const customer = this.db.get('customer')
                    .find({ customer_id: activity.sender_id })
                    .value();
                changedBy = customer?.full_name || 'Customer';
            }

            // Parse customer status changes
            if (content.includes('customer status to')) {
                const match = content.match(/customer status to (\w+)/);
                if (match) {
                    const newStatus = match[1];
                    const statusData = this.db.get('customer_status')
                        .find({ customer_status_code: newStatus })
                        .value();
                    
                    let action_type = 'updated';
                    if (content.includes('Initial status set')) action_type = 'created';
                    else if (content.includes('created and escalated')) action_type = 'escalated';
                    else if (content.includes('created and closed')) action_type = 'closed';
                    
                    history.customer_status_history.push({
                        status_code: newStatus,
                        status_name: statusData?.customer_status_name || newStatus,
                        changed_by: changedBy,
                        changed_at: timestamp,
                        activity_id: activity.ticket_activity_id,
                        action_type: action_type
                    });
                }
            }

            // Parse employee status changes
            if (content.includes('employee status to')) {
                const match = content.match(/employee status to (\w+)/);
                if (match) {
                    const newStatus = match[1];
                    const statusData = this.db.get('employee_status')
                        .find({ employee_status_code: newStatus })
                        .value();
                    
                    let action_type = 'updated';
                    if (content.includes('Initial status set')) action_type = 'created';
                    else if (content.includes('created and escalated')) action_type = 'escalated';
                    else if (content.includes('created and closed')) action_type = 'closed';
                    
                    history.employee_status_history.push({
                        status_code: newStatus,
                        status_name: statusData?.employee_status_name || newStatus,
                        changed_by: changedBy,
                        changed_at: timestamp,
                        activity_id: activity.ticket_activity_id,
                        action_type: action_type
                    });
                }
            }
        });

        return history;
    }

    parseDivisionNotes(divisionNotes) {
        if (!divisionNotes || divisionNotes === 'null' || divisionNotes === null || divisionNotes === undefined) {
            return null;
        }
        
        if (typeof divisionNotes !== 'string') {
            return divisionNotes; // Already parsed or is an object
        }
        
        try {
            const parsed = JSON.parse(divisionNotes);
            return parsed;
        } catch (error) {
            // If parsing fails, return the raw string as a single note
            return [{ note: divisionNotes, timestamp: new Date().toISOString() }];
        }
    }

    stringifyDivisionNotes(divisionNotes) {
        if (!divisionNotes || divisionNotes === null || divisionNotes === undefined) {
            return null;
        }
        
        if (typeof divisionNotes === 'string') {
            return divisionNotes; // Already stringified
        }
        
        try {
            return JSON.stringify(divisionNotes);
        } catch (error) {
            return null;
        }
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

    getEmailHistory(ticketId) {
        const emailActivities = this.db.get('ticket_activity')
            .filter({ ticket_id: ticketId, ticket_activity_type_id: 4 }) // EMAIL_SENT type
            .value()
            .sort((a, b) => new Date(a.ticket_activity_time) - new Date(b.ticket_activity_time));

        return emailActivities.map(activity => {
            // Get sender info
            const senderType = this.db.get('sender_type')
                .find({ sender_type_id: activity.sender_type_id })
                .value();
            
            let sentBy = 'System';
            if (senderType?.sender_type_code === 'EMPLOYEE') {
                const employee = this.db.get('employee')
                    .find({ employee_id: activity.sender_id })
                    .value();
                sentBy = employee?.full_name || employee?.npp || 'Employee';
            }

            return {
                email_id: activity.ticket_activity_id,
                content: activity.content,
                sent_by: sentBy,
                sent_at: activity.ticket_activity_time,
                activity_id: activity.ticket_activity_id
            };
        });
    }

    async createTicketActivity(req, res, next) {
        try {
            const { id } = req.params;
            const { activity_type, content } = req.body;

            // Validation
            if (!activity_type || !content) {
                throw new ValidationError('Required fields: activity_type, content');
            }

            const ticket = this.db.get('ticket')
                .find({ ticket_id: parseInt(id) })
                .value();

            if (!ticket) {
                throw new NotFoundError('Ticket');
            }

            // Role-based access control
            if (req.user.role === 'customer' && ticket.customer_id !== req.user.id) {
                throw new ForbiddenError('Access denied');
            } else if (req.user.role === 'employee') {
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    if (ticket.responsible_employee_id !== req.user.id) {
                        throw new ForbiddenError('Access denied - you can only add activities to tickets assigned to you');
                    }
                }
            }

            // Validate activity type
            const activityType = this.db.get('ticket_activity_type')
                .find({ ticket_activity_code: activity_type.toUpperCase() })
                .value();

            if (!activityType) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid activity_type. Valid types: COMMENT, STATUS_CHANGE, ATTACHMENT'
                });
            }

            // Create activity
            const newActivity = {
                ticket_activity_id: this.getNextId('ticket_activity'),
                ticket_id: parseInt(id),
                ticket_activity_type_id: activityType.ticket_activity_type_id,
                sender_type_id: req.user.role === 'customer' ? 1 : 2,
                sender_id: req.user.id,
                content: content,
                ticket_activity_time: new Date().toISOString()
            };

            this.db.get('ticket_activity').push(newActivity).write();

            // Get sender details for response
            let sender = null;
            if (req.user.role === 'customer') {
                const customer = this.db.get('customer')
                    .find({ customer_id: req.user.id })
                    .value();
                if (customer) {
                    sender = {
                        sender_id: customer.customer_id,
                        full_name: customer.full_name,
                        email: customer.email,
                        type: 'customer'
                    };
                }
            } else {
                const employee = this.db.get('employee')
                    .find({ employee_id: req.user.id })
                    .value();
                if (employee) {
                    const division = this.db.get('division')
                        .find({ division_id: employee.division_id })
                        .value();
                    sender = {
                        sender_id: employee.employee_id,
                        full_name: employee.full_name,
                        npp: employee.npp,
                        email: employee.email,
                        division: division ? {
                            division_id: division.division_id,
                            division_name: division.division_name,
                            division_code: division.division_code
                        } : null,
                        type: 'employee'
                    };
                }
            }

            const senderType = this.db.get('sender_type')
                .find({ sender_type_id: newActivity.sender_type_id })
                .value();

            res.status(201).json({
                success: true,
                message: 'Activity created successfully',
                data: {
                    ticket_activity_id: newActivity.ticket_activity_id,
                    ticket_id: parseInt(id),
                    activity_type: {
                        ticket_activity_type_id: activityType.ticket_activity_type_id,
                        ticket_activity_code: activityType.ticket_activity_code,
                        ticket_activity_name: activityType.ticket_activity_name
                    },
                    sender_type: senderType ? {
                        sender_type_id: senderType.sender_type_id,
                        sender_type_code: senderType.sender_type_code,
                        sender_type_name: senderType.sender_type_name
                    } : null,
                    sender: sender,
                    content: newActivity.content,
                    ticket_activity_time: newActivity.ticket_activity_time
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async getActivityById(req, res, next) {
        try {
            const { id } = req.params;

            const activity = this.db.get('ticket_activity')
                .find({ ticket_activity_id: parseInt(id) })
                .value();

            if (!activity) {
                throw new NotFoundError('Activity');
            }

            // Get the ticket to check access permissions
            const ticket = this.db.get('ticket')
                .find({ ticket_id: activity.ticket_id })
                .value();

            if (!ticket) {
                throw new NotFoundError('Associated ticket');
            }

            // Role-based access control
            if (req.user.role === 'customer' && ticket.customer_id !== req.user.id) {
                throw new ForbiddenError('Access denied');
            } else if (req.user.role === 'employee') {
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    if (ticket.responsible_employee_id !== req.user.id) {
                        throw new ForbiddenError('Access denied - you can only view activities for tickets assigned to you');
                    }
                }
            }

            // Get activity type
            const activityType = this.db.get('ticket_activity_type')
                .find({ ticket_activity_type_id: activity.ticket_activity_type_id })
                .value();

            // Get sender type
            const senderType = this.db.get('sender_type')
                .find({ sender_type_id: activity.sender_type_id })
                .value();

            // Get sender details based on sender type
            let sender = null;
            if (senderType?.sender_type_code === 'CUSTOMER') {
                const customer = this.db.get('customer')
                    .find({ customer_id: activity.sender_id })
                    .value();
                if (customer) {
                    sender = {
                        sender_id: customer.customer_id,
                        full_name: customer.full_name,
                        email: customer.email,
                        phone_number: customer.phone_number,
                        type: 'customer'
                    };
                }
            } else if (senderType?.sender_type_code === 'EMPLOYEE') {
                const employee = this.db.get('employee')
                    .find({ employee_id: activity.sender_id })
                    .value();
                if (employee) {
                    const division = this.db.get('division')
                        .find({ division_id: employee.division_id })
                        .value();
                    const role = this.db.get('role')
                        .find({ role_id: employee.role_id })
                        .value();
                    sender = {
                        sender_id: employee.employee_id,
                        full_name: employee.full_name,
                        npp: employee.npp,
                        email: employee.email,
                        division: division ? {
                            division_id: division.division_id,
                            division_name: division.division_name,
                            division_code: division.division_code
                        } : null,
                        role: role ? {
                            role_id: role.role_id,
                            role_name: role.role_name,
                            role_code: role.role_code
                        } : null,
                        type: 'employee'
                    };
                }
            }

            // Get attachments for this activity
            const attachments = this.db.get('attachment')
                .filter({ ticket_activity_id: activity.ticket_activity_id })
                .value()
                .map(attachment => ({
                    attachment_id: attachment.attachment_id,
                    file_name: attachment.file_name,
                    file_path: attachment.file_path,
                    file_size: attachment.file_size,
                    file_type: attachment.file_type,
                    upload_time: attachment.upload_time
                }));

            const enrichedActivity = {
                ticket_activity_id: activity.ticket_activity_id,
                ticket: {
                    ticket_id: ticket.ticket_id,
                    ticket_number: ticket.ticket_number,
                    description: ticket.description
                },
                activity_type: activityType ? {
                    ticket_activity_type_id: activityType.ticket_activity_type_id,
                    ticket_activity_code: activityType.ticket_activity_code,
                    ticket_activity_name: activityType.ticket_activity_name
                } : null,
                sender_type: senderType ? {
                    sender_type_id: senderType.sender_type_id,
                    sender_type_code: senderType.sender_type_code,
                    sender_type_name: senderType.sender_type_name
                } : null,
                sender: sender,
                content: activity.content,
                ticket_activity_time: activity.ticket_activity_time,
                attachments: attachments
            };

            res.status(200).json({
                success: true,
                message: 'Activity retrieved successfully',
                data: enrichedActivity
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = TicketController;