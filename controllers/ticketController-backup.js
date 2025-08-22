const { NotFoundError, ForbiddenError, ValidationError, ConflictError } = require('../middlewares/error_handler');
const { Op } = require('sequelize');

const db = require('../models');

const { 
    ticket: Ticket,
    customer: Customer,
    employee: Employee,
    account: Account,
    card: Card,
    customer_status: CustomerStatus,
    employee_status: EmployeeStatus,
    channel: Channel,
    complaint_category: ComplaintCategory,
    priority: Priority,
    terminal: Terminal,
    source: Source,
    complaint_policy: ComplaintPolicy,
    ticket_activity: TicketActivity,
    ticket_activity_type: TicketActivityType,
    sender_type: SenderType,
    attachment: Attachment,
    feedback: Feedback,
    division: Division,
    role: Role
} = db;

class TicketController {
    constructor() {
        // No longer need db instance
    }

    static createInstance() {
        return new TicketController();
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

            // Build where clause based on role
            let whereClause = {};
            
            // Role-based access control
            if (req.user.role === 'customer') {
                whereClause.customer_id = req.user.id;
            } else if (req.user.role === 'employee') {
                // Check role_id and division_id from JWT token
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    // Other employees can only see tickets assigned to them
                    whereClause.responsible_employee_id = req.user.id;
                }
                // CXC Agent can see all tickets - no additional filter
            }

            // Additional filters for employees
            if (req.user.role === 'employee') {
                if (customer_id) {
                    whereClause.customer_id = customer_id;
                }
                if (employee_id) {
                    whereClause.responsible_employee_id = employee_id;
                }
            }

            if (channel_id) {
                whereClause.issue_channel_id = channel_id;
            }

            if (complaint_id) {
                whereClause.complaint_id = complaint_id;
            }

            // Date range filter
            if (date_from || date_to) {
                whereClause.created_time = {};
                if (date_from) {
                    whereClause.created_time[Op.gte] = new Date(date_from);
                }
                if (date_to) {
                    whereClause.created_time[Op.lte] = new Date(date_to);
                }
            }

            // Search filter
            if (search) {
                whereClause[Op.or] = [
                    { description: { [Op.iLike]: `%${search}%` } },
                    { ticket_number: { [Op.iLike]: `%${search}%` } }
                ];
            }

            // Include related models
            const includeOptions = [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['customer_id', 'full_name', 'email']
                },
                {
                    model: CustomerStatus,
                    as: 'customer_status'
                },
                {
                    model: EmployeeStatus,
                    as: 'employee_status'
                },
                {
                    model: Channel,
                    as: 'issue_channel'
                },
                {
                    model: ComplaintCategory,
                    as: 'complaint_category'
                },
                {
                    model: Account,
                    as: 'related_account',
                    required: false
                },
                {
                    model: Card,
                    as: 'related_card',
                    required: false
                }
            ];

            // Add employee-specific includes
            if (req.user.role === 'employee') {
                includeOptions.push(
                    {
                        model: Employee,
                        as: 'responsible_employee',
                        attributes: ['employee_id', 'full_name', 'npp', 'email'],
                        required: false
                    },
                    {
                        model: Priority,
                        as: 'priority'
                    },
                    {
                        model: Terminal,
                        as: 'terminal',
                        required: false
                    },
                    {
                        model: Source,
                        as: 'intake_source',
                        required: false
                    },
                    {
                        model: ComplaintPolicy,
                        as: 'policy',
                        required: false
                    }
                );
            }

            // Status filter (more complex due to multiple status types)
            if (status) {
                const statusWhere = {
                    [Op.or]: [
                        { '$customer_status.customer_status_code$': status.toUpperCase() },
                        { '$employee_status.employee_status_code$': status.toUpperCase() }
                    ]
                };
                whereClause = { ...whereClause, ...statusWhere };
            }

            // Priority filter
            if (priority) {
                whereClause['$priority.priority_code$'] = priority.toUpperCase();
            }

            const { count, rows: tickets } = await Ticket.findAndCountAll({
                where: whereClause,
                include: includeOptions,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['created_time', 'DESC']],
                distinct: true
            });

            // Transform data based on role
            const enrichedTickets = tickets.map(ticket => 
                this.enrichTicketData(ticket.toJSON(), req.user.role)
            );

            res.status(200).json({
                success: true,
                message: 'Tickets retrieved successfully',
                data: enrichedTickets,
                pagination: {
                    total: count,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    pages: Math.ceil(count / parseInt(limit))
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
            record: ticket.record || "",
            created_time: ticket.created_time,
            closed_time: ticket.closed_time
        };

        // Common data for both roles
        const commonData = {
            ...baseData,
            customer_status: ticket.customer_status ? {
                customer_status_id: ticket.customer_status.customer_status_id,
                customer_status_name: ticket.customer_status.customer_status_name,
                customer_status_code: ticket.customer_status.customer_status_code
            } : null,
            
            issue_channel: ticket.issue_channel ? {
                channel_id: ticket.issue_channel.channel_id,
                channel_name: ticket.issue_channel.channel_name,
                channel_code: ticket.issue_channel.channel_code
            } : null,
            
            customer: ticket.customer ? {
                customer_id: ticket.customer.customer_id,
                full_name: ticket.customer.full_name,
                email: ticket.customer.email
            } : null,
            
            related_account: ticket.related_account ? {
                account_id: ticket.related_account.account_id,
                account_number: ticket.related_account.account_number
            } : null,
            
            related_card: ticket.related_card ? {
                card_id: ticket.related_card.card_id,
                card_number: ticket.related_card.card_number,
                card_type: ticket.related_card.card_type
            } : null,
            
            complaint: ticket.complaint_category ? {
                complaint_id: ticket.complaint_category.complaint_id,
                complaint_name: ticket.complaint_category.complaint_name,
                complaint_code: ticket.complaint_category.complaint_code
            } : null
        };

        // Customer role: return limited data
        if (userRole === 'customer') {
            return commonData;
        }

        // Employee role: return full data
        if (userRole === 'employee') {
            return {
                ...commonData,
                ticket_id: ticket.ticket_id,
                
                employee: ticket.responsible_employee ? {
                    employee_id: ticket.responsible_employee.employee_id,
                    full_name: ticket.responsible_employee.full_name,
                    npp: ticket.responsible_employee.npp,
                    email: ticket.responsible_employee.email
                } : null,
                
                priority: ticket.priority ? {
                    priority_id: ticket.priority.priority_id,
                    priority_name: ticket.priority.priority_name,
                    priority_code: ticket.priority.priority_code
                } : null,
                
                employee_status: ticket.employee_status ? {
                    employee_status_id: ticket.employee_status.employee_status_id,
                    employee_status_name: ticket.employee_status.employee_status_name,
                    employee_status_code: ticket.employee_status.employee_status_code
                } : null,
                
                terminal: ticket.terminal ? {
                    terminal_id: ticket.terminal.terminal_id,
                    terminal_code: ticket.terminal.terminal_code,
                    location: ticket.terminal.location
                } : null,
                
                intake_source: ticket.intake_source ? {
                    source_id: ticket.intake_source.source_id,
                    source_name: ticket.intake_source.source_name,
                    source_code: ticket.intake_source.source_code
                } : null,
                
                policy: ticket.policy ? {
                    policy_id: ticket.policy.policy_id,
                    sla_days: ticket.policy.sla,
                    sla_hours: ticket.policy.sla * 24,
                    uic_id: ticket.policy.uic_id
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
            
            const ticket = await Ticket.findOne({
                where: { ticket_id: parseInt(id) },
                include: [
                    {
                        model: Customer,
                        as: 'customer',
                        attributes: ['customer_id', 'full_name', 'email', 'phone_number']
                    },
                    {
                        model: CustomerStatus,
                        as: 'customer_status'
                    },
                    {
                        model: EmployeeStatus,
                        as: 'employee_status'
                    },
                    {
                        model: Channel,
                        as: 'issue_channel'
                    },
                    {
                        model: ComplaintCategory,
                        as: 'complaint_category'
                    },
                    {
                        model: Account,
                        as: 'related_account',
                        required: false
                    },
                    {
                        model: Card,
                        as: 'related_card',
                        required: false
                    },
                    {
                        model: Employee,
                        as: 'responsible_employee',
                        attributes: ['employee_id', 'full_name', 'npp', 'email'],
                        required: false
                    },
                    {
                        model: Priority,
                        as: 'priority'
                    },
                    {
                        model: Terminal,
                        as: 'terminal',
                        required: false
                    },
                    {
                        model: Source,
                        as: 'intake_source',
                        required: false
                    },
                    {
                        model: ComplaintPolicy,
                        as: 'policy',
                        required: false
                    }
                ]
            });

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

            const detailedTicket = await this.getDetailedTicketData(ticket, req.user.role);

            res.status(200).json({
                success: true,
                message: 'Ticket retrieved successfully',
                data: detailedTicket
            });

        } catch (error) {
            next(error);
        }
    }

    async getDetailedTicketData(ticket, userRole) {
        const ticketData = ticket.toJSON();
        
        const baseData = {
            ticket_number: ticketData.ticket_number,
            description: ticketData.description,
            transaction_date: ticketData.transaction_date,
            amount: ticketData.amount,
            record: ticketData.record || "",
            created_time: ticketData.created_time,
            closed_time: ticketData.closed_time
        };

        // Get status history from activities
        const statusHistory = await this.getStatusHistory(ticketData.ticket_id);

        // Get activities
        const activities = await TicketActivity.findAll({
            where: { ticket_id: ticketData.ticket_id },
            include: [
                {
                    model: TicketActivityType,
                    as: 'activity_type'
                },
                {
                    model: SenderType,
                    as: 'sender_type'
                }
            ],
            order: [['ticket_activity_time', 'DESC']]
        });

        const enrichedActivities = await Promise.all(activities.map(async (activity) => {
            const activityData = activity.toJSON();
            
            // Get sender details based on sender type
            let sender = null;
            if (activityData.sender_type?.sender_type_code === 'CUSTOMER') {
                const customer = await Customer.findByPk(activityData.sender_id, {
                    attributes: ['customer_id', 'full_name', 'email']
                });
                if (customer) {
                    sender = {
                        sender_id: customer.customer_id,
                        full_name: customer.full_name,
                        email: customer.email,
                        type: 'customer'
                    };
                }
            } else if (activityData.sender_type?.sender_type_code === 'EMPLOYEE') {
                const employee = await Employee.findByPk(activityData.sender_id, {
                    attributes: ['employee_id', 'full_name', 'npp', 'email', 'division_id'],
                    include: [{
                        model: Division,
                        as: 'division',
                        attributes: ['division_id', 'division_name', 'division_code']
                    }]
                });
                if (employee) {
                    const empData = employee.toJSON();
                    sender = {
                        sender_id: empData.employee_id,
                        full_name: empData.full_name,
                        npp: empData.npp,
                        email: empData.email,
                        division: empData.division,
                        type: 'employee'
                    };
                }
            }

            return {
                ticket_activity_id: activityData.ticket_activity_id,
                activity_type: activityData.activity_type,
                sender_type: activityData.sender_type,
                sender: sender,
                content: activityData.content,
                ticket_activity_time: activityData.ticket_activity_time
            };
        }));

        // Get attachments
        const attachments = await Attachment.findAll({
            include: [{
                model: TicketActivity,
                as: 'ticket_activity',
                where: { ticket_id: ticketData.ticket_id },
                attributes: ['ticket_activity_id']
            }],
            attributes: ['attachment_id', 'ticket_activity_id', 'file_name', 'file_path', 'file_size', 'file_type', 'upload_time']
        });

        // Get feedback
        const feedback = await Feedback.findOne({
            where: { ticket_id: ticketData.ticket_id }
        });

        const commonData = {
            ...baseData,
            customer: ticketData.customer,
            customer_status: ticketData.customer_status,
            issue_channel: ticketData.issue_channel,
            complaint: ticketData.complaint_category,
            related_account: ticketData.related_account,
            related_card: ticketData.related_card,
            activities: enrichedActivities,
            attachments: attachments.map(a => a.toJSON()),
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
            return {
                ...commonData,
                ticket_id: ticketData.ticket_id,
                employee: ticketData.responsible_employee,
                priority: ticketData.priority,
                employee_status: ticketData.employee_status,
                terminal: ticketData.terminal,
                intake_source: ticketData.intake_source,
                policy: ticketData.policy ? {
                    policy_id: ticketData.policy.policy_id,
                    sla: ticketData.policy.sla,
                    uic_id: ticketData.policy.uic_id
                } : null,
                committed_due_at: ticketData.committed_due_at,
                division_notes: ticketData.division_notes,
                sla_info: this.calculateSLAInfo(ticketData)
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
                record,
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
            const channel = await Channel.findByPk(issue_channel_id);
            if (!channel) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid issue_channel_id'
                });
            }

            const complaint = await ComplaintCategory.findByPk(complaint_id);
            if (!complaint) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid complaint_id'
                });
            }

            // Get customer data (role-based)
            const targetCustomerId = req.user.role === 'customer' ? req.user.id : parseInt(customer_id);
            const customer = await Customer.findByPk(targetCustomerId);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            // Business Logic: Resolve Policy & SLA
            const policy = await this.resolvePolicy(complaint.complaint_id, channel.channel_id);
            
            // Generate ticket number
            const ticketNumber = await this.generateTicketNumber();
            
            // Calculate SLA due date
            const committedDueAt = this.calculateSLADueDate(policy?.sla || 1);
            
            // Get default statuses
            const defaultCustomerStatus = await CustomerStatus.findOne({
                where: { customer_status_code: 'ACC' }
            });
            
            const defaultEmployeeStatus = await EmployeeStatus.findOne({
                where: { employee_status_code: 'OPEN' }
            });
            
            const defaultPriority = await Priority.findOne({
                where: { priority_code: 'REGULAR' }
            });

            // Create ticket
            const newTicket = await Ticket.create({
                ticket_number: ticketNumber,
                customer_id: targetCustomerId,
                description: description,
                transaction_date: transaction_date || null,
                amount: amount || null,
                record: record || "", // Initialize empty record field
                issue_channel_id: parseInt(issue_channel_id),
                complaint_id: parseInt(complaint_id),
                related_account_id: related_account_id ? parseInt(related_account_id) : null,
                related_card_id: related_card_id ? parseInt(related_card_id) : null,
                terminal_id: terminal_id ? parseInt(terminal_id) : null,
                intake_source_id: req.user.role === 'employee' ? 1 : 2, // 1 for employee, 2 for customer
                customer_status_id: defaultCustomerStatus?.customer_status_id || 1,
                employee_status_id: defaultEmployeeStatus?.employee_status_id || 1,
                priority_id: defaultPriority?.priority_id || 3,
                policy_id: policy?.policy_id || null,
                committed_due_at: committedDueAt,
                responsible_employee_id: null, // Will be assigned later
                division_notes: null,
                created_time: new Date().toISOString(),
                closed_time: null
            });

            // Create initial activity
            await TicketActivity.create({
                ticket_id: newTicket.ticket_id,
                ticket_activity_type_id: 1,
                sender_type_id: req.user.role === 'customer' ? 1 : 2,
                sender_id: req.user.id,
                content: req.user.role === 'customer' 
                    ? `Ticket created: ${description}`
                    : `Ticket created by employee for customer ${customer.full_name}: ${description}`,
                ticket_activity_time: new Date().toISOString()
            });

            // Reload ticket with associations for response
            const ticketWithAssociations = await Ticket.findByPk(newTicket.ticket_id, {
                include: [
                    { model: Customer, as: 'customer' },
                    { model: CustomerStatus, as: 'customer_status' },
                    { model: Channel, as: 'issue_channel' },
                    { model: ComplaintCategory, as: 'complaint_category' },
                    { model: Account, as: 'related_account', required: false },
                    { model: Card, as: 'related_card', required: false }
                ]
            });

            // Return created ticket with enriched data
            const enrichedTicket = this.enrichTicketData(ticketWithAssociations.toJSON(), 'customer');

            res.status(201).json({
                success: true,
                message: 'Ticket created successfully',
                data: {
                    ...enrichedTicket,
                    ticket_id: newTicket.ticket_id,
                    sla_info: {
                        committed_due_at: committedDueAt,
                        sla_days: policy?.sla || 1,
                        sla_hours: (policy?.sla || 1) * 24
                    }
                }
            });

        } catch (error) {
            console.error('=== DETAILED ERROR ===');
            console.error('Message:', error.message);
            console.error('Name:', error.name);
            console.error('Original:', error.original);
            console.error('SQL:', error.sql);
            console.error('Parameters:', error.parameters);
            next(error);
        }
    }

    async resolvePolicy(complaintId, channelId) {
        // Find policy based on complaint and channel
        let policy = await ComplaintPolicy.findOne({
            where: { 
                complaint_id: complaintId,
                channel_id: channelId
            }
        });
        
        if (policy) return policy;
        
        // Fallback: find policy by complaint only
        return await ComplaintPolicy.findOne({
            where: { complaint_id: complaintId }
        });
    }

    async generateTicketNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        // Get today's ticket count
        const todayStart = new Date(year, now.getMonth(), now.getDate());
        const todayEnd = new Date(year, now.getMonth(), now.getDate() + 1);
        
        const todayTicketsCount = await Ticket.count({
            where: {
                created_time: {
                    [Op.gte]: todayStart,
                    [Op.lt]: todayEnd
                }
            }
        });
        
        const sequence = String(todayTicketsCount + 1).padStart(4, '0');
        
        return `BNI-${year}${month}${day}${sequence}`;
    }

    calculateSLADueDate(slaDays) {
        const now = new Date();
        const dueDate = new Date(now.getTime() + (slaDays * 24 * 60 * 60 * 1000));
        return dueDate.toISOString();
    }

    async updateTicket(req, res, next) {
        try {
            const { id } = req.params;
            const {
                description,
                customer_status,
                employee_status,
                priority,
                responsible_employee_id,
                division_notes,
                transaction_date,
                amount,
                record,
                related_account_id,
                related_card_id,
                terminal_id
            } = req.body;

            const ticket = await Ticket.findByPk(parseInt(id));

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
            let updateData = {};
            const isCXCAgent = req.user.role_id === 1 && req.user.division_id === 1;

            if (customer_status) {
                const customerStatusData = await CustomerStatus.findOne({
                    where: { customer_status_code: customer_status.toUpperCase() }
                });
                if (!customerStatusData) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid customer_status code'
                    });
                }
                updateData.customer_status_id = customerStatusData.customer_status_id;
            }

            if (employee_status) {
                const employeeStatusData = await EmployeeStatus.findOne({
                    where: { employee_status_code: employee_status.toUpperCase() }
                });
                if (!employeeStatusData) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid employee_status code'
                    });
                }
                updateData.employee_status_id = employeeStatusData.employee_status_id;
                
                // Auto-close ticket if status is resolved
                if (['RESOLVED', 'CLOSED'].includes(employee_status.toUpperCase())) {
                    updateData.closed_time = new Date().toISOString();
                }
            }

            if (priority && isCXCAgent) {
                const priorityData = await Priority.findOne({
                    where: { priority_code: priority.toUpperCase() }
                });
                if (!priorityData) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid priority code'
                    });
                }
                updateData.priority_id = priorityData.priority_id;
            }

            // Validate responsible employee if provided
            if (responsible_employee_id && isCXCAgent) {
                const employee = await Employee.findByPk(parseInt(responsible_employee_id));
                if (!employee) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid responsible_employee_id'
                    });
                }
                updateData.responsible_employee_id = parseInt(responsible_employee_id);
            }

            // Fields available for all employees
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
            }

            // Update ticket
            await ticket.update(updateData);

            // Create activity log
            const activityContent = this.generateUpdateActivityContent(req.body, req.user.role);
            await TicketActivity.create({
                ticket_id: parseInt(id),
                ticket_activity_type_id: 2,
                sender_type_id: req.user.role === 'customer' ? 1 : 2,
                sender_id: req.user.id,
                content: activityContent,
                ticket_activity_time: new Date().toISOString()
            });

            // Get updated ticket with associations
            const updatedTicket = await Ticket.findByPk(parseInt(id), {
                include: [
                    { model: Customer, as: 'customer' },
                    { model: CustomerStatus, as: 'customer_status' },
                    { model: EmployeeStatus, as: 'employee_status' },
                    { model: Channel, as: 'issue_channel' },
                    { model: ComplaintCategory, as: 'complaint_category' },
                    { model: Account, as: 'related_account', required: false },
                    { model: Card, as: 'related_card', required: false },
                    { model: Employee, as: 'responsible_employee', required: false },
                    { model: Priority, as: 'priority' },
                    { model: Terminal, as: 'terminal', required: false },
                    { model: Source, as: 'intake_source', required: false },
                    { model: ComplaintPolicy, as: 'policy', required: false }
                ]
            });

            const enrichedTicket = this.enrichTicketData(updatedTicket.toJSON(), req.user.role);

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
        if (updateData.customer_status) changes.push(`customer status to ${updateData.customer_status}`);
        if (updateData.employee_status) changes.push(`employee status to ${updateData.employee_status}`);
        if (updateData.priority) changes.push(`priority to ${updateData.priority}`);
        if (updateData.responsible_employee_id) changes.push('responsible employee');
        if (updateData.division_notes) changes.push('division notes');
        if (updateData.transaction_date) changes.push('transaction date');
        if (updateData.amount) changes.push('amount');
        if (updateData.record) changes.push('record');
        if (updateData.related_account_id) changes.push('related account');
        if (updateData.related_card_id) changes.push('related card');
        if (updateData.terminal_id) changes.push('terminal');
        
        return `Employee updated: ${changes.join(', ')}`;
    }

    async deleteTicket(req, res, next) {
        try {
            const { id } = req.params;

            const ticket = await Ticket.findByPk(parseInt(id));

            if (!ticket) {
                throw new NotFoundError('Ticket');
            }

            // Check if already delete
            if (ticket.delete_at) {
                throw new ConflictError('Ticket already delete');
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
            const employeeStatus = await EmployeeStatus.findByPk(ticket.employee_status_id);

            if (employeeStatus && ['CLOSED', 'RESOLVED'].includes(employeeStatus.employee_status_code)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete closed or resolved tickets'
                });
            }

            // Soft delete - add delete_at timestamp and delete_by
            await ticket.update({
                delete_at: new Date().toISOString(),
                delete_by: req.user.id
            });

            // Create activity log for deletion
            await TicketActivity.create({
                ticket_id: parseInt(id),
                ticket_activity_type_id: 4, // Assuming 4 = delete activity
                sender_type_id: 2, // Employee
                sender_id: req.user.id,
                content: `Ticket delete by ${req.user.full_name || req.user.npp}`,
                ticket_activity_time: new Date().toISOString()
            });

            res.status(200).json({
                success: true,
                message: 'Ticket delete successfully',
                data: {
                    ticket_id: ticket.ticket_id,
                    ticket_number: ticket.ticket_number,
                    delete_at: ticket.delete_at,
                    delete_by: ticket.delete_by
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

            const ticket = await Ticket.findByPk(parseInt(id));

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

            // Build where clause
            let whereClause = { ticket_id: parseInt(id) };

            // Filter by activity type if provided
            if (activity_type) {
                const activityTypeData = await TicketActivityType.findOne({
                    where: { ticket_activity_code: activity_type.toUpperCase() }
                });
                
                if (activityTypeData) {
                    whereClause.ticket_activity_type_id = activityTypeData.ticket_activity_type_id;
                }
            }

            // Get activities
            const { count, rows: activities } = await TicketActivity.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: TicketActivityType,
                        as: 'activity_type'
                    },
                    {
                        model: SenderType,
                        as: 'sender_type'
                    }
                ],
                order: [['ticket_activity_time', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            // Enrich activities with related data
            const enrichedActivities = await Promise.all(activities.map(async (activity) => {
                const activityData = activity.toJSON();
                
                // Get sender details based on sender type
                let sender = null;
                if (activityData.sender_type?.sender_type_code === 'CUSTOMER') {
                    const customer = await Customer.findByPk(activityData.sender_id, {
                        attributes: ['customer_id', 'full_name', 'email']
                    });
                    if (customer) {
                        sender = {
                            sender_id: customer.customer_id,
                            full_name: customer.full_name,
                            email: customer.email,
                            type: 'customer'
                        };
                    }
                } else if (activityData.sender_type?.sender_type_code === 'EMPLOYEE') {
                    const employee = await Employee.findByPk(activityData.sender_id, {
                        attributes: ['employee_id', 'full_name', 'npp', 'email', 'division_id'],
                        include: [{
                            model: Division,
                            as: 'division',
                            attributes: ['division_id', 'division_name', 'division_code']
                        }]
                    });
                    if (employee) {
                        const empData = employee.toJSON();
                        sender = {
                            sender_id: empData.employee_id,
                            full_name: empData.full_name,
                            npp: empData.npp,
                            email: empData.email,
                            division: empData.division,
                            type: 'employee'
                        };
                    }
                }

                // Get attachments for this activity
                const attachments = await Attachment.findAll({
                    where: { ticket_activity_id: activityData.ticket_activity_id },
                    attributes: ['attachment_id', 'file_name', 'file_path', 'file_size', 'file_type', 'upload_time']
                });

                return {
                    ticket_activity_id: activityData.ticket_activity_id,
                    activity_type: activityData.activity_type,
                    sender_type: activityData.sender_type,
                    sender: sender,
                    content: activityData.content,
                    ticket_activity_time: activityData.ticket_activity_time,
                    attachments: attachments.map(a => a.toJSON())
                };
            }));

            res.status(200).json({
                success: true,
                message: 'Ticket activities retrieved successfully',
                data: {
                    ticket_id: parseInt(id),
                    ticket_number: ticket.ticket_number,
                    activities: enrichedActivities
                },
                pagination: {
                    total: count,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    pages: Math.ceil(count / parseInt(limit))
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

            const ticket = await Ticket.findByPk(parseInt(id));

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
            const activities = await TicketActivity.findAll({
                where: { ticket_id: parseInt(id) },
                attributes: ['ticket_activity_id']
            });

            const activityIds = activities.map(activity => activity.ticket_activity_id);

            // Build where clause for attachments
            let whereClause = {
                ticket_activity_id: {
                    [Op.in]: activityIds
                }
            };

            // Filter by file type if provided
            if (file_type) {
                whereClause.file_type = {
                    [Op.iLike]: `%${file_type}%`
                };
            }

            // Get attachments
            const { count, rows: attachments } = await Attachment.findAndCountAll({
                where: whereClause,
                include: [{
                    model: TicketActivity,
                    as: 'ticket_activity',
                    include: [
                        {
                            model: TicketActivityType,
                            as: 'activity_type'
                        },
                        {
                            model: SenderType,
                            as: 'sender_type'
                        }
                    ]
                }],
                order: [['upload_time', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            // Enrich attachments with activity and sender info
            const enrichedAttachments = await Promise.all(attachments.map(async (attachment) => {
                const attachmentData = attachment.toJSON();
                const activity = attachmentData.ticket_activity;

                // Get sender details
                let sender = null;
                if (activity && activity.sender_type?.sender_type_code === 'CUSTOMER') {
                    const customer = await Customer.findByPk(activity.sender_id, {
                        attributes: ['customer_id', 'full_name']
                    });
                    if (customer) {
                        sender = {
                            sender_id: customer.customer_id,
                            full_name: customer.full_name,
                            type: 'customer'
                        };
                    }
                } else if (activity && activity.sender_type?.sender_type_code === 'EMPLOYEE') {
                    const employee = await Employee.findByPk(activity.sender_id, {
                        attributes: ['employee_id', 'full_name', 'npp']
                    });
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
                    attachment_id: attachmentData.attachment_id,
                    file_name: attachmentData.file_name,
                    file_path: attachmentData.file_path,
                    file_size: attachmentData.file_size,
                    file_type: attachmentData.file_type,
                    upload_time: attachmentData.upload_time,
                    activity: activity ? {
                        ticket_activity_id: activity.ticket_activity_id,
                        activity_type: activity.activity_type,
                        content: activity.content,
                        ticket_activity_time: activity.ticket_activity_time
                    } : null,
                    uploaded_by: sender
                };
            }));

            res.status(200).json({
                success: true,
                message: 'Ticket attachments retrieved successfully',
                data: {
                    ticket_id: parseInt(id),
                    ticket_number: ticket.ticket_number,
                    attachments: enrichedAttachments
                },
                pagination: {
                    total: count,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    pages: Math.ceil(count / parseInt(limit))
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async getTicketFeedback(req, res, next) {
        try {
            const { id } = req.params;

            const ticket = await Ticket.findByPk(parseInt(id));

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
            const feedback = await Feedback.findOne({
                where: { ticket_id: parseInt(id) }
            });

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
            const customer = await Customer.findByPk(ticket.customer_id, {
                attributes: ['customer_id', 'full_name', 'email']
            });

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

    async getStatusHistory(ticketId) {
        const activities = await TicketActivity.findAll({
            where: { 
                ticket_id: ticketId,
                content: {
                    [Op.or]: [
                        { [Op.iLike]: '%status to%' },
                        { [Op.iLike]: '%Ticket created%' }
                    ]
                }
            },
            include: [
                {
                    model: SenderType,
                    as: 'sender_type'
                }
            ],
            order: [['ticket_activity_time', 'ASC']]
        });

        const history = {
            customer_status_history: [],
            employee_status_history: []
        };

        for (const activity of activities) {
            const content = activity.content || '';
            const timestamp = activity.ticket_activity_time;
            
            // Get sender info
            let changedBy = 'System';
            if (activity.sender_type?.sender_type_code === 'EMPLOYEE') {
                const employee = await Employee.findByPk(activity.sender_id, {
                    attributes: ['full_name', 'npp']
                });
                changedBy = employee?.full_name || employee?.npp || 'Employee';
            } else if (activity.sender_type?.sender_type_code === 'CUSTOMER') {
                const customer = await Customer.findByPk(activity.sender_id, {
                    attributes: ['full_name']
                });
                changedBy = customer?.full_name || 'Customer';
            }

            // Parse customer status changes
            if (content.includes('customer status to')) {
                const match = content.match(/customer status to (\w+)/);
                if (match) {
                    const newStatus = match[1];
                    const statusData = await CustomerStatus.findOne({
                        where: { customer_status_code: newStatus }
                    });
                    
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
                    const statusData = await EmployeeStatus.findOne({
                        where: { employee_status_code: newStatus }
                    });
                    
                    history.employee_status_history.push({
                        status_code: newStatus,
                        status_name: statusData?.employee_status_name || newStatus,
                        changed_by: changedBy,
                        changed_at: timestamp,
                        activity_id: activity.ticket_activity_id
                    });
                }
            }

            // Handle initial ticket creation
            if (content.includes('Ticket created')) {
                // Add initial statuses
                const ticket = await Ticket.findByPk(ticketId, {
                    include: [
                        { model: CustomerStatus, as: 'customer_status' },
                        { model: EmployeeStatus, as: 'employee_status' }
                    ]
                });
                
                if (ticket && history.customer_status_history.length === 0) {
                    history.customer_status_history.push({
                        status_code: ticket.customer_status.customer_status_code,
                        status_name: ticket.customer_status.customer_status_name,
                        changed_by: changedBy,
                        changed_at: timestamp,
                        activity_id: activity.ticket_activity_id,
                        is_initial: true
                    });
                }
                
                if (ticket && history.employee_status_history.length === 0) {
                    history.employee_status_history.push({
                        status_code: ticket.employee_status.employee_status_code,
                        status_name: ticket.employee_status.employee_status_name,
                        changed_by: changedBy,
                        changed_at: timestamp,
                        activity_id: activity.ticket_activity_id,
                        is_initial: true
                    });
                }
            }
        }

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

            const ticket = await Ticket.findByPk(parseInt(id));

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
            const activityType = await TicketActivityType.findOne({
                where: { ticket_activity_code: activity_type.toUpperCase() }
            });

            if (!activityType) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid activity_type. Valid types: COMMENT, STATUS_CHANGE, ATTACHMENT'
                });
            }

            // Create activity
            const newActivity = await TicketActivity.create({
                ticket_id: parseInt(id),
                ticket_activity_type_id: activityType.ticket_activity_type_id,
                sender_type_id: req.user.role === 'customer' ? 1 : 2,
                sender_id: req.user.id,
                content: content,
                ticket_activity_time: new Date().toISOString()
            });

            // Get sender details for response
            let sender = null;
            if (req.user.role === 'customer') {
                const customer = await Customer.findByPk(req.user.id, {
                    attributes: ['customer_id', 'full_name', 'email']
                });
                if (customer) {
                    sender = {
                        sender_id: customer.customer_id,
                        full_name: customer.full_name,
                        email: customer.email,
                        type: 'customer'
                    };
                }
            } else {
                const employee = await Employee.findByPk(req.user.id, {
                    attributes: ['employee_id', 'full_name', 'npp', 'email', 'division_id'],
                    include: [{
                        model: Division,
                        as: 'division',
                        attributes: ['division_id', 'division_name', 'division_code']
                    }]
                });
                if (employee) {
                    const empData = employee.toJSON();
                    sender = {
                        sender_id: empData.employee_id,
                        full_name: empData.full_name,
                        npp: empData.npp,
                        email: empData.email,
                        division: empData.division,
                        type: 'employee'
                    };
                }
            }

            const senderType = await SenderType.findByPk(newActivity.sender_type_id);

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
}

module.exports = TicketController;