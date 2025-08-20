const { NotFoundError, ForbiddenError, ValidationError, ConflictError } = require('../middlewares/error_handler');

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
            } else if (req.user.role === 'employee') {
                // Check role_id and division_id from JWT token
                if (req.user.role_id === 1 && req.user.division_id === 1) {
                    // CXC Agent can see all tickets - no filter
                } else {
                    // Other employees can only see tickets assigned to them
                    tickets = tickets.filter(ticket => ticket.responsible_employee_id == req.user.id);
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
            ticket_id: ticket.ticket_id,
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
                    sla_days: policy.sla,
                    sla_hours: policy.sla * 24,
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
                throw new NotFoundError('Ticket');
            }

            // Role-based access control
            if (req.user.role === 'customer' && ticket.customer_id !== req.user.id) {
                throw new ForbiddenError('Access denied');
            } else if (req.user.role === 'employee') {
                // Check role_id and division_id from JWT token
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    if (ticket.responsible_employee_id !== req.user.id) {
                        return res.status(403).json({
                            success: false,
                            message: 'Access denied - you can only view tickets assigned to you'
                        });
                    }
                }
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
            record: ticket.record || "",
            created_time: ticket.created_time,
            closed_time: ticket.closed_time
        };

        // Get status history from activities
        const statusHistory = this.getStatusHistory(ticket.ticket_id);

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
                division_notes: JSON.parse(ticket.division_notes || '[]'),
                
                sla_info: this.calculateSLAInfo(ticket)
            };
        }

        return commonData;
    }

    async createTicket(req, res, next) {
        try {
            const {
                description,
                transaction_date,
                amount,
                issue_channel_id,
                complaint_id,
                related_account_id,
                related_card_id,
                terminal_id,
                intake_source_id,
                customer_id // For employee use
            } = req.body;

            // Validation
            if (!description || !issue_channel_id || !complaint_id) {
                throw new ValidationError('Required fields: description, issue_channel_id, complaint_id');
            }

            // Employee role and permission check
            if (req.user.role === 'employee') {
                // Check role_id and division_id from JWT token
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    return res.status(403).json({
                        success: false,
                        message: 'Only CXC agents can create tickets'
                    });
                }
                
                // CXC agent must provide customer_id
                if (!customer_id) {
                    return res.status(400).json({
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
            
            // Calculate SLA due date
            const committedDueAt = this.calculateSLADueDate(policy?.sla || 1);
            
            // Get default statuses
            const defaultCustomerStatus = this.db.get('customer_status')
                .find({ customer_status_code: 'ACC' })
                .value();
            
            const defaultEmployeeStatus = this.db.get('employee_status')
                .find({ employee_status_code: 'OPEN' })
                .value();
            
            const defaultPriority = this.db.get('priority')
                .find({ priority_code: 'REGULAR' })
                .value();

            // Create ticket
            const newTicket = {
                ticket_id: this.getNextId('ticket'),
                ticket_number: ticketNumber,
                description: description,
                record: "", // Initialize empty record field
                customer_id: targetCustomerId,
                customer_status_id: defaultCustomerStatus?.customer_status_id || 1,
                employee_status_id: defaultEmployeeStatus?.employee_status_id || 1,
                priority_id: defaultPriority?.priority_id || 3,
                issue_channel_id: parseInt(issue_channel_id),
                intake_source_id: req.user.role === 'customer' ? 2 : intake_source_id,
                related_account_id: related_account_id ? parseInt(related_account_id) : null,
                related_card_id: related_card_id ? parseInt(related_card_id) : null,
                complaint_id: parseInt(complaint_id),
                responsible_employee_id: null, // Will be assigned later
                policy_id: policy?.policy_id || null,
                committed_due_at: committedDueAt,
                transaction_date: transaction_date || null,
                amount: amount || null,
                terminal_id: terminal_id ? parseInt(terminal_id) : null,
                created_time: new Date().toISOString(),
                closed_time: null,
                division_notes: null,
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

            // Return created ticket with enriched data
            const enrichedTicket = this.enrichTicketData(newTicket, 'customer');

            res.status(201).json({
                success: true,
                message: 'Ticket created successfully',
                data: {
                    ...enrichedTicket,
                    ticket_id: newTicket.ticket_id,
                    record: newTicket.record,
                    sla_info: {
                        committed_due_at: committedDueAt,
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
        // Find policy based on complaint and channel
        const policy = this.db.get('complaint_policy')
            .find(p => p.complaint_id === complaintId && p.channel_id === channelId)
            .value();
        
        if (policy) return policy;
        
        // Fallback: find policy by complaint only
        return this.db.get('complaint_policy')
            .find({ complaint_id: complaintId })
            .value();
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
                description,
                record,
                customer_status,
                employee_status,
                priority,
                responsible_employee_id,
                division_notes,
                transaction_date,
                amount,
                related_account_id,
                related_card_id,
                terminal_id
            } = req.body;

            const ticket = this.db.get('ticket')
                .find({ ticket_id: parseInt(id) })
                .value();

            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            // Role-based access control - Only employees can update tickets
            if (req.user.role === 'customer') {
                return res.status(403).json({
                    success: false,
                    message: 'Customers cannot update tickets'
                });
            } else if (req.user.role === 'employee') {
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    if (ticket.responsible_employee_id !== req.user.id) {
                        return res.status(403).json({
                            success: false,
                            message: 'Access denied - you can only update tickets assigned to you'
                        });
                    }
                    
                    // Non-CXC employees can only update limited fields
                    const allowedFields = ['customer_status', 'employee_status', 'division_notes'];
                    const providedFields = Object.keys(req.body);
                    const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
                    
                    if (invalidFields.length > 0) {
                        return res.status(403).json({
                            success: false,
                            message: `Non-CXC employees can only update: ${allowedFields.join(', ')}`
                        });
                    }
                }
            }

            // Validate status codes if provided
            let customerStatusId = ticket.customer_status_id;
            let employeeStatusId = ticket.employee_status_id;
            let priorityId = ticket.priority_id;

            if (customer_status) {
                const customerStatusData = this.db.get('customer_status')
                    .find({ customer_status_code: customer_status.toUpperCase() })
                    .value();
                if (!customerStatusData) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid customer_status code'
                    });
                }
                customerStatusId = customerStatusData.customer_status_id;
            }

            if (employee_status) {
                const employeeStatusData = this.db.get('employee_status')
                    .find({ employee_status_code: employee_status.toUpperCase() })
                    .value();
                if (!employeeStatusData) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid employee_status code'
                    });
                }
                employeeStatusId = employeeStatusData.employee_status_id;
            }

            if (priority) {
                const priorityData = this.db.get('priority')
                    .find({ priority_code: priority.toUpperCase() })
                    .value();
                if (!priorityData) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid priority code'
                    });
                }
                priorityId = priorityData.priority_id;
            }

            // Validate responsible employee if provided
            if (responsible_employee_id) {
                const employee = this.db.get('employee')
                    .find({ employee_id: parseInt(responsible_employee_id) })
                    .value();
                if (!employee) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid responsible_employee_id'
                    });
                }
            }

            // Prepare update data
            const updateData = {};
            const isCXCAgent = req.user.role_id === 1 && req.user.division_id === 1;
            
            // Fields available for all employees
            if (customer_status !== undefined) updateData.customer_status_id = customerStatusId;
            if (employee_status !== undefined) updateData.employee_status_id = employeeStatusId;
            if (division_notes !== undefined) updateData.division_notes = division_notes;
            
            // Fields only available for CXC agents
            if (isCXCAgent) {
                if (description !== undefined) updateData.description = description;
                if (record !== undefined) updateData.record = record;
                if (transaction_date !== undefined) updateData.transaction_date = transaction_date;
                if (amount !== undefined) updateData.amount = amount;
                if (related_account_id !== undefined) updateData.related_account_id = related_account_id ? parseInt(related_account_id) : null;
                if (related_card_id !== undefined) updateData.related_card_id = related_card_id ? parseInt(related_card_id) : null;
                if (terminal_id !== undefined) updateData.terminal_id = terminal_id ? parseInt(terminal_id) : null;
                if (priority !== undefined) updateData.priority_id = priorityId;
                if (responsible_employee_id !== undefined) updateData.responsible_employee_id = responsible_employee_id ? parseInt(responsible_employee_id) : null;
            }
            
            // Auto-close ticket if status is resolved
            if (employee_status && ['RESOLVED', 'CLOSED'].includes(employee_status.toUpperCase())) {
                updateData.closed_time = new Date().toISOString();
            }

            // Update ticket
            this.db.get('ticket')
                .find({ ticket_id: parseInt(id) })
                .assign(updateData)
                .write();

            // Create activity log
            const activityContent = this.generateUpdateActivityContent(req.body, req.user.role);
            const updateActivity = {
                ticket_activity_id: this.getNextId('ticket_activity'),
                ticket_id: parseInt(id),
                ticket_activity_type_id: 2,
                sender_type_id: req.user.role === 'customer' ? 1 : 2,
                sender_id: req.user.id,
                content: activityContent,
                ticket_activity_time: new Date().toISOString()
            };

            this.db.get('ticket_activity').push(updateActivity).write();

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
                return content.includes('status to') || content.includes('Ticket created');
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
                    
                    history.customer_status_history.push({
                        status_code: newStatus,
                        status_name: statusData?.customer_status_name || newStatus,
                        changed_by: changedBy,
                        changed_at: timestamp,
                        activity_id: activity.ticket_activity_id
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
                    
                    history.employee_status_history.push({
                        status_code: newStatus,
                        status_name: statusData?.employee_status_name || newStatus,
                        changed_by: changedBy,
                        changed_at: timestamp,
                        activity_id: activity.ticket_activity_id
                    });
                }
            }

            // Handle initial ticket creation - set default initial statuses
            if (content.includes('Ticket created') && history.customer_status_history.length === 0 && history.employee_status_history.length === 0) {
                // Add default initial statuses (ACC for customer, OPEN for employee)
                const accStatus = this.db.get('customer_status')
                    .find({ customer_status_code: 'ACC' })
                    .value();
                
                const openStatus = this.db.get('employee_status')
                    .find({ employee_status_code: 'OPEN' })
                    .value();
                
                if (accStatus) {
                    history.customer_status_history.push({
                        status_code: accStatus.customer_status_code,
                        status_name: accStatus.customer_status_name,
                        changed_by: changedBy,
                        changed_at: timestamp,
                        activity_id: activity.ticket_activity_id,
                        is_initial: true
                    });
                }
                
                if (openStatus) {
                    history.employee_status_history.push({
                        status_code: openStatus.employee_status_code,
                        status_name: openStatus.employee_status_name,
                        changed_by: changedBy,
                        changed_at: timestamp,
                        activity_id: activity.ticket_activity_id,
                        is_initial: true
                    });
                }
            }
        });

        return history;
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