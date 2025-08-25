const { NotFoundError, ForbiddenError, ValidationError, ConflictError } = require('../middlewares/error_handler');
const { HTTP_STATUS } = require('../constants/statusCodes');
const { Op } = require('sequelize');

const db = require('../models');

const {
    ticket: Ticket,
    customer: Customer,
    employee: Employee,
    customer_status: CustomerStatus,
    employee_status: EmployeeStatus,
    channel: Channel,
    complaint_category: ComplaintCategory,
    complaint_policy: ComplaintPolicy,
    priority: Priority,
    source: Source,
    terminal: Terminal,
    account: Account,
    card: Card,
    division: Division,
    ticket_activity: TicketActivity,
    ticket_activity_type: TicketActivityType,
    sender_type: SenderType,
    attachment: Attachment,
    feedback: Feedback,
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
            
            console.log(req.user);

            // Build base where clause
            let whereClause = {
                delete_at: null // Only non-deleted tickets
            };

            // Role-based access control
            if (req.user.role === 'customer') {
                whereClause.customer_id = req.user.id;
            } else if (req.user.role === 'employee') {
                if (req.user.role_id === 1 && req.user.division_id === 1) {
                    // CXC Agent can see all tickets - no additional filter
                } else {
                    // Other employees: only see tickets escalated to their division
                    whereClause['$employee_status.employee_status_code$'] = 'ESCALATED';
                    whereClause['$policy.uic_id$'] = req.user.division_id;
                }
            }

            // Apply filters
            if (status) {
                whereClause[Op.or] = [
                    { '$customer_status.customer_status_code$': status.toUpperCase() },
                    { '$employee_status.employee_status_code$': status.toUpperCase() }
                ];
            }

            if (customer_id && req.user.role === 'employee') {
                whereClause.customer_id = customer_id;
            }

            if (employee_id && req.user.role === 'employee') {
                whereClause.responsible_employee_id = employee_id;
            }

            if (priority) {
                whereClause['$priority.priority_code$'] = priority.toUpperCase();
            }

            if (channel_id) {
                whereClause.issue_channel_id = channel_id;
            }

            if (complaint_id) {
                whereClause.complaint_id = complaint_id;
            }

            if (date_from || date_to) {
                const dateFilter = {};
                if (date_from) dateFilter[Op.gte] = new Date(date_from);
                if (date_to) dateFilter[Op.lte] = new Date(date_to);
                whereClause.created_time = dateFilter;
            }

            if (search) {
                whereClause[Op.or] = [
                    { description: { [Op.iLike]: `%${search}%` } },
                    { ticket_number: { [Op.iLike]: `%${search}%` } }
                ];
            }

            // Build includes
            const includes = [
                {
                    model: Channel,
                    as: 'issue_channel',
                    attributes: ['channel_id', 'channel_name', 'channel_code']
                },
                {
                    model: CustomerStatus,
                    as: 'customer_status',
                    attributes: ['customer_status_id', 'customer_status_name', 'customer_status_code']
                }
            ];

            if (req.user.role === 'employee') {
                includes.push(
                    {
                        model: Customer,
                        as: 'customer',
                        attributes: ['customer_id', 'full_name', 'email']
                    },
                    {
                        model: ComplaintCategory,
                        as: 'complaint_category',
                        attributes: ['complaint_id', 'complaint_name', 'complaint_code']
                    },
                    {
                        model: EmployeeStatus,
                        as: 'employee_status',
                        attributes: ['employee_status_id', 'employee_status_name', 'employee_status_code']
                    },
                    {
                        model: ComplaintPolicy,
                        as: 'policy',
                        attributes: ['policy_id', 'sla', 'uic_id'],
                        required: false
                    }
                );

                if (req.user.role_id === 1 && req.user.division_id === 1) {
                    includes.push(
                        {
                            model: Account,
                            as: 'related_account',
                            attributes: ['account_id', 'account_number'],
                            required: false
                        },
                        {
                            model: Card,
                            as: 'related_card',
                            attributes: ['card_id', 'card_number', 'card_type'],
                            required: false
                        },
                        {
                            model: Source,
                            as: 'intake_source',
                            attributes: ['source_id', 'source_name', 'source_code'],
                            required: false
                        },
                        {
                            model: Priority,
                            as: 'priority',
                            attributes: ['priority_id', 'priority_name', 'priority_code'],
                            required: false
                        }
                    );
                }
            }

            // Execute query
            const { count, rows: tickets } = await Ticket.findAndCountAll({
                where: whereClause,
                include: includes,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['created_time', 'DESC']],
                distinct: true,
                logging: console.log // Tambahkan ini untuk melihat SQL query
            });

            // Transform data based on role
            const allTickets = await Promise.all(tickets.map(async (ticket) => {
                const baseTicket = {
                    ticket_id: ticket.ticket_id,
                    ticket_number: ticket.ticket_number,
                    issue_channel: ticket.issue_channel,
                    created_time: ticket.created_time
                };

                if (req.user.role === 'employee') {
                    const customTicket = {
                        ...baseTicket,
                        customer: ticket.customer,
                        complaint: ticket.complaint_category,
                        employee_status: ticket.employee_status
                    };

                    if (req.user.role_id === 1 && req.user.division_id === 1) {
                        const division = await this.calculateDivision(ticket);
                        return {
                            ...customTicket,
                            related_account: ticket.related_account,
                            related_card: ticket.related_card,
                            intake_source: ticket.intake_source,
                            division: division,
                            policy: ticket.policy ? {
                                policy_id: ticket.policy.policy_id,
                                sla_days: ticket.policy.sla,
                                sla_hours: ticket.policy.sla * 24
                            } : null,
                            committed_due_at: ticket.committed_due_at,
                            sla_info: this.calculateSLAInfo(ticket)
                        };
                    } else {
                        return {
                            ...customTicket,
                            policy: ticket.policy ? {
                                policy_id: ticket.policy.policy_id,
                                sla_days: ticket.policy.sla,
                                sla_hours: ticket.policy.sla * 24
                            } : null,
                            committed_due_at: ticket.committed_due_at,
                            sla_info: this.calculateSLAInfo(ticket)
                        };
                    }
                } else {
                    return {
                        ...baseTicket,
                        customer_status: ticket.customer_status
                    };
                }
            }));

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Tickets retrieved successfully',
                data: allTickets,
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

    async enrichTicketData(ticket, userRole) {
        // Load ticket with all necessary relations if not already loaded
        let fullTicket = ticket;
        if (!ticket.customer) {
            fullTicket = await Ticket.findByPk(ticket.ticket_id, {
                include: [
                    { model: Customer, as: 'customer' },
                    { model: CustomerStatus, as: 'customer_status' },
                    { model: Channel, as: 'issue_channel' },
                    { model: ComplaintCategory, as: 'complaint_category' },
                    { model: Account, as: 'related_account', required: false },
                    { model: Card, as: 'related_card', required: false },
                    { model: Employee, as: 'responsible_employee', required: false },
                    { model: Priority, as: 'priority', required: false },
                    { model: EmployeeStatus, as: 'employee_status', required: false },
                    { model: Terminal, as: 'terminal', required: false },
                    { model: Source, as: 'intake_source', required: false },
                    { 
                        model: ComplaintPolicy, 
                        as: 'policy', 
                        required: false,
                        include: [{ model: Division, as: 'uic_division', required: false }]
                    }
                ]
            });
        }

        // Base data
        const baseData = {
            ticket_id: fullTicket.ticket_id,
            ticket_number: fullTicket.ticket_number,
            description: fullTicket.description,
            transaction_date: fullTicket.transaction_date,
            amount: fullTicket.amount,
            reason: fullTicket.reason || "",
            solution: fullTicket.solution || "",
            created_time: fullTicket.created_time,
            closed_time: fullTicket.closed_time
        };

        // Common data for both roles
        const commonData = {
            ...baseData,
            customer_status: fullTicket.customer_status,
            issue_channel: fullTicket.issue_channel,
            customer: fullTicket.customer,
            related_account: fullTicket.related_account,
            related_card: fullTicket.related_card,
            complaint: fullTicket.complaint
        };

        // Customer role: return limited data
        if (userRole === 'customer') {
            return commonData;
        }

        // Employee role: return full data
        if (userRole === 'employee') {
            return {
                ...commonData,
                employee: fullTicket.responsible_employee,
                priority: fullTicket.priority,
                employee_status: fullTicket.employee_status,
                terminal: fullTicket.terminal,
                intake_source: fullTicket.intake_source,
                policy: fullTicket.policy ? {
                    policy_id: fullTicket.policy.policy_id,
                    sla_days: fullTicket.policy.sla,
                    sla_hours: fullTicket.policy.sla * 24,
                    uic_id: fullTicket.policy.uic_id,
                    uic_code: fullTicket.policy.uic_division?.division_code,
                    uic_name: fullTicket.policy.uic_division?.division_name
                } : null,
                committed_due_at: fullTicket.committed_due_at,
                division_notes: this.parseDivisionNotes(fullTicket.division_notes),
                sla_info: this.calculateSLAInfo(fullTicket)
            };
        }

        return commonData;
    }

    async getTicketById(req, res, next) {
        try {
            const { id } = req.params;
            
            const ticket = await Ticket.findOne({
                where: { 
                    ticket_id: parseInt(id),
                    delete_at: null
                },
                include: this.getDetailedIncludes()
            });

            if (!ticket) {
                throw new NotFoundError('Ticket');
            }

            // Role-based access control
            if (req.user.role === 'customer' && ticket.customer_id !== req.user.id) {
                throw new ForbiddenError('Access denied');
            } else if (req.user.role === 'employee') {
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    if (ticket.responsible_employee_id !== req.user.id) {
                        return res.status(HTTP_STATUS.FORBIDDEN).json({
                            success: false,
                            message: 'Access denied - you can only view tickets assigned to you'
                        });
                    }
                }
            }

            const detailedTicket = await this.getDetailedTicketData(ticket, req.user.role);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Ticket retrieved successfully',
                data: detailedTicket
            });

        } catch (error) {
            next(error);
        }
    }

    getDetailedIncludes() {
        return [
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
                model: Channel,
                as: 'issue_channel'
            },
            {
                model: ComplaintCategory,
                as: 'complaint_category',
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
                required: false
            },
            {
                model: Priority,
                as: 'priority',
                required: false
            },
            {
                model: EmployeeStatus,
                as: 'employee_status',
                required: false
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
                required: false,
                include: [{
                    model: Division,
                    as: 'uic_division',
                    required: false
                }]
            },
            {
                model: TicketActivity,
                as: 'activities',
                include: [
                    {
                        model: TicketActivityType,
                        as: 'activity_type'
                    },
                    {
                        model: SenderType,
                        as: 'sender_type'
                    },
                    {
                        model: Attachment,
                        as: 'attachments',
                        required: false
                    }
                ]
            },
            {
                model: Feedback,
                as: 'feedback',
                required: false
            }
        ];
    }

    async getDetailedTicketData(ticket, userRole) {
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

        // Get status history
        const statusHistory = await this.getStatusHistory(ticket.ticket_id);

        // Process activities
        const activities = ticket.activities?.map(activity => ({
            ticket_activity_id: activity.ticket_activity_id,
            activity_type: activity.activity_type,
            sender_type: activity.sender_type,
            sender_id: activity.sender_id,
            content: activity.content,
            ticket_activity_time: activity.ticket_activity_time
        })) || [];

        // Process attachments
        const attachments = [];
        ticket.activities?.forEach(activity => {
            if (activity.attachments) {
                attachments.push(...activity.attachments.map(attachment => ({
                    attachment_id: attachment.attachment_id,
                    ticket_activity_id: attachment.ticket_activity_id,
                    file_name: attachment.file_name,
                    file_path: attachment.file_path,
                    file_size: attachment.file_size,
                    file_type: attachment.file_type,
                    upload_time: attachment.upload_time
                })));
            }
        });

        const commonData = {
            ...baseData,
            customer: ticket.customer,
            customer_status: ticket.customer_status,
            issue_channel: ticket.issue_channel,
            complaint: ticket.complaint_category,
            related_account: ticket.related_account,
            related_card: ticket.related_card,
            activities: activities,
            attachments: attachments,
            status_history: statusHistory,
            feedback: ticket.feedback
        };

        // Customer role: return limited data
        if (userRole === 'customer') {
            return commonData;
        }

        // Employee role: return full data
        if (userRole === 'employee') {
            return {
                ...commonData,
                employee: ticket.responsible_employee,
                priority: ticket.priority,
                employee_status: ticket.employee_status,
                terminal: ticket.terminal,
                intake_source: ticket.intake_source,
                policy: ticket.policy ? {
                    policy_id: ticket.policy.policy_id,
                    sla: ticket.policy.sla,
                    uic_id: ticket.policy.uic_id,
                    uic_code: ticket.policy.uic_division?.division_code,
                    uic_name: ticket.policy.uic_division?.division_name
                } : null,
                committed_due_at: ticket.committed_due_at,
                division_notes: this.parseDivisionNotes(ticket.division_notes),
                sla_info: this.calculateSLAInfo(ticket)
            };
        }

        return commonData;
    }

    async createTicket(req, res, next) {
        const transaction = await db.sequelize.transaction();
        
        try {
            const {
                action,
                customer_id,
                priority_id,
                record,
                issue_channel_id,
                intake_source_id,
                amount,
                complaint_id,
                transaction_date,
                terminal_id,
                description,
                related_account_id,
                related_card_id,
                division_notes,
                reason,
                solution,
            } = req.body;

            // Validation
            if (!description || !issue_channel_id || !complaint_id) {
                throw new ValidationError('Required fields: description, issue_channel_id, complaint_id');
            }

            // Employee role and permission check
            if (req.user.role === 'employee') {
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    return res.status(HTTP_STATUS.FORBIDDEN).json({
                        success: false,
                        message: 'Only CXC agents can create tickets'
                    });
                }
                
                if (!customer_id) {
                    return res.status(HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: 'Employee must provide customer_id'
                    });
                }
            }

            // Validate references
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

            // Get customer
            const targetCustomerId = req.user.role === 'customer' ? req.user.id : parseInt(customer_id);
            const customer = await Customer.findByPk(targetCustomerId);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            // Resolve policy
            const policy = await this.resolvePolicy(complaint.complaint_id, channel.channel_id);
            
            // Generate ticket number
            const ticketNumber = await this.generateTicketNumber();
            
            // Calculate SLA due date
            const committedDueAt = this.calculateSLADueDate(policy?.sla || 1);
            
            // Get statuses
            let customerStatus, employeeStatus;
            
            if (!action) {
                customerStatus = await CustomerStatus.findOne({
                    where: { customer_status_code: "ACC" }
                });
                employeeStatus = await EmployeeStatus.findOne({
                    where: { employee_status_code: "OPEN" }
                });
            }

            if (action === 'ESCALATED') {
                customerStatus = await CustomerStatus.findOne({
                    where: { customer_status_code: "PROCESS" }
                });
                employeeStatus = await EmployeeStatus.findOne({
                    where: { employee_status_code: "ESCALATED" }
                });
            }

            if (action === 'CLOSED') {
                customerStatus = await CustomerStatus.findOne({
                    where: { customer_status_code: "CLOSED" }
                });
                employeeStatus = await EmployeeStatus.findOne({
                    where: { employee_status_code: "CLOSED" }
                });
            }

            // Create ticket
            const newTicket = await Ticket.create({
                ticket_number: ticketNumber,
                description: description,
                record: record || "",
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
                responsible_employee_id: !action ? null : req.user.id,
                policy_id: policy?.policy_id || null,
                committed_due_at: committedDueAt,
                transaction_date: transaction_date || null,
                amount: amount || null,
                terminal_id: terminal_id ? parseInt(terminal_id) : null,
                closed_time: employeeStatus?.employee_status_id === 4 ? new Date() : null,
                division_notes: division_notes ? JSON.stringify(division_notes) : null
            }, { 
                transaction,
                logging: console.log
            });

            // Create initial activity
            await TicketActivity.create({
                ticket_id: newTicket.ticket_id,
                ticket_activity_type_id: 1,
                sender_type_id: req.user.role === 'customer' ? 1 : 2,
                sender_id: req.user.id,
                content: req.user.role === 'customer' 
                    ? `Ticket created: ${description}`
                    : `Ticket created by employee for customer ${customer.full_name}: ${description}`
            }, { transaction });

            // Create status history activities
            await this.createStatusHistoryActivities(newTicket, action, req.user, customerStatus, employeeStatus, transaction);

            await transaction.commit();

            // Return enriched ticket data
            const enrichedTicket = await this.enrichTicketData(newTicket, 'customer');

            res.status(HTTP_STATUS.CREATED).json({
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
            await transaction.rollback();
            next(error);
        }

    }

    async resolvePolicy(complaintId, channelId) {
        // Get all matching policies
        const policies = await ComplaintPolicy.findAll({
            where: {
                complaint_id: complaintId,
                channel_id: channelId
            }
        });
        
        if (policies.length === 0) {
            // Fallback: find by complaint only
            return await ComplaintPolicy.findOne({
                where: { complaint_id: complaintId }
            });
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
            specificKeywords.some(keyword => p.description?.includes(keyword))
        );
        
        if (specificPolicy) return specificPolicy;
        
        // Rule 3: Prioritize by UIC (lower UIC = more specialized)
        candidates.sort((a, b) => a.uic_id - b.uic_id);
        
        // Rule 4: Log for monitoring
        console.warn(`Multiple policies found for channel ${channelId} + complaint ${complaintId}. Selected policy ${candidates[0].policy_id}`);
        
        return candidates[0];
    }

    async generateTicketNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        // Get today's ticket count
        const todayStart = new Date(year, now.getMonth(), now.getDate());
        const todayEnd = new Date(year, now.getMonth(), now.getDate() + 1);
        
        const todayTickets = await Ticket.count({
            where: {
                created_time: {
                    [Op.gte]: todayStart,
                    [Op.lt]: todayEnd
                }
            }
        });
        
        const sequence = String(todayTickets + 1).padStart(4, '0');
        
        return `BNI-${year}${month}${day}${sequence}`;
    }

    calculateSLADueDate(slaDays) {
        const now = new Date();
        const dueDate = new Date(now.getTime() + (slaDays * 24 * 60 * 60 * 1000));
        return dueDate;
    }

    async createStatusHistoryActivities(ticket, action, user, customerStatus, employeeStatus, transaction) {
        const activities = [];

        if (!action) {
            activities.push({
                ticket_id: ticket.ticket_id,
                ticket_activity_type_id: 2, // STATUS_CHANGE
                sender_type_id: user.role === 'customer' ? 1 : 2,
                sender_id: user.id,
                content: `Initial status set: customer status to ${customerStatus.customer_status_code}, employee status to ${employeeStatus.employee_status_code}`
            });
        } else if (action === 'ESCALATED') {
            activities.push({
                ticket_id: ticket.ticket_id,
                ticket_activity_type_id: 2, // STATUS_CHANGE
                sender_type_id: 2, // Employee
                sender_id: user.id,
                content: `Ticket created and escalated: customer status to ${customerStatus.customer_status_code}, employee status to ${employeeStatus.employee_status_code}`
            });
        } else if (action === 'CLOSED') {
            activities.push({
                ticket_id: ticket.ticket_id,
                ticket_activity_type_id: 2, // STATUS_CHANGE
                sender_type_id: 2, // Employee
                sender_id: user.id,
                content: `Ticket created and closed: customer status to ${customerStatus.customer_status_code}, employee status to ${employeeStatus.employee_status_code}`
            });
        }

        // Save all activities
        for (const activity of activities) {
            await TicketActivity.create(activity, { transaction });
        }
    }

    async createUpdateActivity(ticketId, action, user, customerStatus, employeeStatus, transaction) {
        let content = '';

        const actionMessages = {
            'HANDLEDCXC': 'Ticket handled by CXC agent',
            'ESCALATED': 'Ticket escalated to specialist division',
            'CLOSED': 'Ticket closed by CXC agent',
            'DECLINED': 'Ticket declined by CXC agent',
            'DONE_BY_UIC': 'Ticket completed by UIC division'
        };

        content = actionMessages[action] || 'Ticket updated';

        await TicketActivity.create({
            ticket_id: ticketId,
            ticket_activity_type_id: 1, // COMMENT
            sender_type_id: 2, // Employee
            sender_id: user.id,
            content: content
        }, { transaction });
    }

    async createUpdateStatusHistory(ticketId, action, user, customerStatus, employeeStatus, transaction) {
        let content = '';

        if (customerStatus && employeeStatus) {
            content = `Status updated via ${action}: customer status to ${customerStatus.customer_status_code}, employee status to ${employeeStatus.employee_status_code}`;
        } else if (customerStatus) {
            content = `Status updated via ${action}: customer status to ${customerStatus.customer_status_code}`;
        } else if (employeeStatus) {
            content = `Status updated via ${action}: employee status to ${employeeStatus.employee_status_code}`;
        }

        if (content) {
            await TicketActivity.create({
                ticket_id: ticketId,
                ticket_activity_type_id: 2, // STATUS_CHANGE
                sender_type_id: 2, // Employee
                sender_id: user.id,
                content: content
            }, { transaction });
        }
    }

    getNextId(tableName) {
        // This method is not needed in Sequelize as it handles auto-increment automatically
        // Keeping for compatibility but returning null
        return null;
    }

    async updateTicket(req, res, next) {
        const transaction = await db.sequelize.transaction();
        
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

            const ticket = await Ticket.findOne({
                where: { 
                    ticket_id: parseInt(id),
                    delete_at: null
                }
            });

            if (!ticket) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            // Role-based access control
            if (req.user.role === 'customer') {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: 'Customers cannot update tickets'
                });
            }

            let customerStatus, employeeStatus;
            const updateData = {};

            // Handle different actions
            await this.handleTicketAction(action, req.user, updateData, req.body);

            // Get status objects if needed
            if (updateData.customer_status_id) {
                customerStatus = await CustomerStatus.findByPk(updateData.customer_status_id);
            }
            if (updateData.employee_status_id) {
                employeeStatus = await EmployeeStatus.findByPk(updateData.employee_status_id);
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'No valid update data provided'
                });
            }

            // Update ticket
            await ticket.update(updateData, { transaction });

            // Create activity logs
            await this.createUpdateActivity(parseInt(id), action, req.user, customerStatus, employeeStatus, transaction);

            if (customerStatus || employeeStatus) {
                await this.createUpdateStatusHistory(parseInt(id), action, req.user, customerStatus, employeeStatus, transaction);
            }

            await transaction.commit();

            // Get updated ticket with relations
            const updatedTicket = await Ticket.findByPk(parseInt(id), {
                include: this.getDetailedIncludes()
            });

            const enrichedTicket = await this.enrichTicketData(updatedTicket, req.user.role);

            res.status(200).json({
                success: true,
                message: 'Ticket updated successfully',
                data: enrichedTicket
            });

        } catch (error) {
            await transaction.rollback();
            next(error);
        }
    }

    async handleTicketAction(action, user, updateData, body) {
        const {
            priority_id, record, issue_channel_id, intake_source_id,
            complaint_id, amount, transaction_date, terminal_id,
            description, division_notes, reason, solution
        } = body;

        if (!action) {
            if (division_notes) {
                updateData.division_notes = JSON.stringify(division_notes);
            }
            return;
        }

        const actionHandlers = {
            'HANDLEDCXC': async () => {
                if (user.division_id === 1) {
                    const customerStatus = await CustomerStatus.findOne({
                        where: { customer_status_code: "VERIF" }
                    });
                    const employeeStatus = await EmployeeStatus.findOne({
                        where: { employee_status_code: "HANDLEDCXC" }
                    });

                    updateData.customer_status_id = customerStatus.customer_status_id;
                    updateData.employee_status_id = employeeStatus.employee_status_id;
                    updateData.responsible_employee_id = user.id;
                }
            },
            'ESCALATED': async () => {
                if (user.division_id === 1) {
                    const customerStatus = await CustomerStatus.findOne({
                        where: { customer_status_code: "PROCESS" }
                    });
                    const employeeStatus = await EmployeeStatus.findOne({
                        where: { employee_status_code: "ESCALATED" }
                    });

                    updateData.customer_status_id = customerStatus.customer_status_id;
                    updateData.employee_status_id = employeeStatus.employee_status_id;

                    // Update other fields for escalation
                    if (priority_id) updateData.priority_id = priority_id;
                    if (record) updateData.record = record;
                    if (issue_channel_id) updateData.issue_channel_id = issue_channel_id;
                    if (intake_source_id) updateData.intake_source_id = intake_source_id;
                    if (complaint_id) updateData.complaint_id = complaint_id;
                    if (amount) updateData.amount = amount;
                    if (transaction_date) updateData.transaction_date = transaction_date;
                    if (terminal_id) updateData.terminal_id = terminal_id;
                    if (description) updateData.description = description;
                    if (division_notes) updateData.division_notes = JSON.stringify(division_notes);
                }
            },
            'CLOSED': async () => {
                if (user.division_id === 1) {
                    const customerStatus = await CustomerStatus.findOne({
                        where: { customer_status_code: "CLOSED" }
                    });
                    const employeeStatus = await EmployeeStatus.findOne({
                        where: { employee_status_code: "CLOSED" }
                    });

                    updateData.customer_status_id = customerStatus.customer_status_id;
                    updateData.employee_status_id = employeeStatus.employee_status_id;
                    updateData.closed_time = new Date();

                    // Update other fields for closure
                    if (priority_id) updateData.priority_id = priority_id;
                    if (record) updateData.record = record;
                    if (issue_channel_id) updateData.issue_channel_id = issue_channel_id;
                    if (intake_source_id) updateData.intake_source_id = intake_source_id;
                    if (complaint_id) updateData.complaint_id = complaint_id;
                    if (amount) updateData.amount = amount;
                    if (transaction_date) updateData.transaction_date = transaction_date;
                    if (terminal_id) updateData.terminal_id = terminal_id;
                    if (description) updateData.description = description;
                    if (solution) updateData.solution = solution;
                    if (division_notes) updateData.division_notes = JSON.stringify(division_notes);
                }
            },
            'DECLINED': async () => {
                if (user.division_id === 1) {
                    const customerStatus = await CustomerStatus.findOne({
                        where: { customer_status_code: "DECLINED" }
                    });
                    const employeeStatus = await EmployeeStatus.findOne({
                        where: { employee_status_code: "DECLINED" }
                    });

                    updateData.customer_status_id = customerStatus.customer_status_id;
                    updateData.employee_status_id = employeeStatus.employee_status_id;
                    updateData.closed_time = new Date();

                    // Update other fields for decline
                    if (priority_id) updateData.priority_id = priority_id;
                    if (record) updateData.record = record;
                    if (issue_channel_id) updateData.issue_channel_id = issue_channel_id;
                    if (intake_source_id) updateData.intake_source_id = intake_source_id;
                    if (complaint_id) updateData.complaint_id = complaint_id;
                    if (amount) updateData.amount = amount;
                    if (transaction_date) updateData.transaction_date = transaction_date;
                    if (terminal_id) updateData.terminal_id = terminal_id;
                    if (description) updateData.description = description;
                    if (reason) updateData.reason = reason;
                    if (division_notes) updateData.division_notes = JSON.stringify(division_notes);
                }
            },
            'DONE_BY_UIC': async () => {
                if (user.division_id !== 1) {
                    const employeeStatus = await EmployeeStatus.findOne({
                        where: { employee_status_code: "DONE_BY_UIC" }
                    });

                    updateData.employee_status_id = employeeStatus.employee_status_id;

                    if (division_notes) updateData.division_notes = JSON.stringify(division_notes);
                }
            }
        };

        if (actionHandlers[action]) {
            await actionHandlers[action]();
        }
    }

    generateUpdateActivityContent(updateData, userRole) {
        const changes = [];
        
        if (updateData.description) changes.push('description');
        if (updateData.record) changes.push('record');
        if (updateData.customer_status_id) changes.push('customer status');
        if (updateData.employee_status_id) changes.push('employee status');
        if (updateData.priority_id) changes.push('priority');
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
        const transaction = await db.sequelize.transaction();
        
        try {
            const { id } = req.params;

            const ticket = await Ticket.findOne({
                where: { 
                    ticket_id: parseInt(id),
                    delete_at: null
                },
                include: [{
                    model: EmployeeStatus,
                    as: 'employee_status'
                }]
            });

            if (!ticket) {
                throw new NotFoundError('Ticket');
            }

            // Role-based access control
            if (req.user.role !== 'employee') {
                throw new ForbiddenError('Only employees can delete tickets');
            }

            if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                throw new ForbiddenError('Only CXC employees can delete tickets');
            }

            // Business rule: Cannot delete closed tickets
            if (ticket.employee_status && ['CLOSED', 'RESOLVED'].includes(ticket.employee_status.employee_status_code)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete closed or resolved tickets'
                });
            }

            // Soft delete
            await ticket.update({
                delete_at: new Date(),
                delete_by: req.user.id
            }, { transaction });

            // Create activity log
            await TicketActivity.create({
                ticket_id: parseInt(id),
                ticket_activity_type_id: 4, // DELETE activity
                sender_type_id: 2, // Employee
                sender_id: req.user.id,
                content: `Ticket deleted by ${req.user.full_name || req.user.npp}`
            }, { transaction });

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Ticket deleted successfully',
                data: {
                    ticket_id: ticket.ticket_id,
                    ticket_number: ticket.ticket_number,
                    delete_at: ticket.delete_at,
                    delete_by: ticket.delete_by
                }
            });

        } catch (error) {
            await transaction.rollback();
            next(error);
        }
    }

    async getTicketActivities(req, res, next) {
        try {
            const { id } = req.params;
            const { limit = 50, offset = 0, activity_type } = req.query;

            const ticket = await Ticket.findOne({
                where: { 
                    ticket_id: parseInt(id),
                    delete_at: null
                }
            });

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

            // Build where clause for activities
            let activityWhere = { ticket_id: parseInt(id) };

            if (activity_type) {
                const activityTypeData = await TicketActivityType.findOne({
                    where: { ticket_activity_code: activity_type.toUpperCase() }
                });
                
                if (activityTypeData) {
                    activityWhere.ticket_activity_type_id = activityTypeData.ticket_activity_type_id;
                }
            }

            // Get activities with pagination
            const { count, rows: activities } = await TicketActivity.findAndCountAll({
                where: activityWhere,
                include: [
                    {
                        model: TicketActivityType,
                        as: 'activity_type'
                    },
                    {
                        model: SenderType,
                        as: 'sender_type'
                    },
                    {
                        model: Attachment,
                        as: 'attachments',
                        required: false
                    }
                ],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['ticket_activity_time', 'DESC']]
            });

            // Enrich activities with sender details
            const enrichedActivities = await Promise.all(activities.map(async (activity) => {
                let sender = null;
                
                if (activity.sender_type?.sender_type_code === 'CUSTOMER') {
                    const customer = await Customer.findByPk(activity.sender_id, {
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
                } else if (activity.sender_type?.sender_type_code === 'EMPLOYEE') {
                    const employee = await Employee.findByPk(activity.sender_id, {
                        attributes: ['employee_id', 'full_name', 'npp', 'email'],
                        include: [{
                            model: Division,
                            as: 'division',
                            attributes: ['division_id', 'division_name', 'division_code']
                        }]
                    });
                    if (employee) {
                        sender = {
                            sender_id: employee.employee_id,
                            full_name: employee.full_name,
                            npp: employee.npp,
                            email: employee.email,
                            division: employee.division,
                            type: 'employee'
                        };
                    }
                }

                return {
                    ticket_activity_id: activity.ticket_activity_id,
                    activity_type: activity.activity_type,
                    sender_type: activity.sender_type,
                    sender: sender,
                    content: activity.content,
                    ticket_activity_time: activity.ticket_activity_time,
                    attachments: activity.attachments || []
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

            const ticket = await Ticket.findOne({
                where: { 
                    ticket_id: parseInt(id),
                    delete_at: null
                }
            });

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

            // Get activities for this ticket
            const activities = await TicketActivity.findAll({
                where: { ticket_id: parseInt(id) },
                attributes: ['ticket_activity_id']
            });

            const activityIds = activities.map(activity => activity.ticket_activity_id);

            // Build where clause for attachments
            let attachmentWhere = {
                ticket_activity_id: { [Op.in]: activityIds }
            };

            if (file_type) {
                attachmentWhere.file_type = { [Op.iLike]: `%${file_type}%` };
            }

            // Get attachments with pagination
            const { count, rows: attachments } = await Attachment.findAndCountAll({
                where: attachmentWhere,
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
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['upload_time', 'DESC']]
            });

            // Enrich attachments with sender info
            const enrichedAttachments = await Promise.all(attachments.map(async (attachment) => {
                const activity = attachment.ticket_activity;
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
                    attachment_id: attachment.attachment_id,
                    file_name: attachment.file_name,
                    file_path: attachment.file_path,
                    file_size: attachment.file_size,
                    file_type: attachment.file_type,
                    upload_time: attachment.upload_time,
                    activity: activity ? {
                        ticket_activity_id: activity.ticket_activity_id,
                        activity_type: activity.activity_type ? {
                            ticket_activity_code: activity.activity_type.ticket_activity_code,
                            ticket_activity_name: activity.activity_type.ticket_activity_name
                        } : null,
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

            const ticket = await Ticket.findOne({
                where: { 
                    ticket_id: parseInt(id),
                    delete_at: null
                }
            });

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
                        { [Op.like]: '%status to%' },
                        { [Op.like]: '%Initial status set%' },
                        { [Op.like]: '%created and escalated%' },
                        { [Op.like]: '%created and closed%' }
                    ]
                }
            },
            include: [{
                model: SenderType,
                as: 'sender_type'
            }],
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
                    const statusData = await EmployeeStatus.findOne({
                        where: { employee_status_code: newStatus }
                    });
                    
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
        }

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

    async createTicketActivity(req, res, next) {
        try {
            const { id } = req.params;
            const { activity_type, content } = req.body;

            // Validation
            if (!activity_type || !content) {
                throw new ValidationError('Required fields: activity_type, content');
            }

            const ticket = await Ticket.findOne({
                where: { 
                    ticket_id: parseInt(id),
                    delete_at: null
                }
            });

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
                content: content
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
                    attributes: ['employee_id', 'full_name', 'npp', 'email'],
                    include: [{
                        model: Division,
                        as: 'division',
                        attributes: ['division_id', 'division_name', 'division_code']
                    }]
                });
                if (employee) {
                    sender = {
                        sender_id: employee.employee_id,
                        full_name: employee.full_name,
                        npp: employee.npp,
                        email: employee.email,
                        division: employee.division,
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

    async getActivityById(req, res, next) {
        try {
            const { id } = req.params;

            const activity = await TicketActivity.findByPk(parseInt(id), {
                include: [
                    {
                        model: TicketActivityType,
                        as: 'activity_type'
                    },
                    {
                        model: SenderType,
                        as: 'sender_type'
                    },
                    {
                        model: Attachment,
                        as: 'attachments',
                        required: false
                    }
                ]
            });

            if (!activity) {
                throw new NotFoundError('Activity');
            }

            // Get the ticket to check access permissions
            const ticket = await Ticket.findByPk(activity.ticket_id);

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

            // Get sender details based on sender type
            let sender = null;
            if (activity.sender_type?.sender_type_code === 'CUSTOMER') {
                const customer = await Customer.findByPk(activity.sender_id, {
                    attributes: ['customer_id', 'full_name', 'email', 'phone_number']
                });
                if (customer) {
                    sender = {
                        sender_id: customer.customer_id,
                        full_name: customer.full_name,
                        email: customer.email,
                        phone_number: customer.phone_number,
                        type: 'customer'
                    };
                }
            } else if (activity.sender_type?.sender_type_code === 'EMPLOYEE') {
                const employee = await Employee.findByPk(activity.sender_id, {
                    attributes: ['employee_id', 'full_name', 'npp', 'email'],
                    include: [
                        {
                            model: Division,
                            as: 'division',
                            attributes: ['division_id', 'division_name', 'division_code']
                        },
                        {
                            model: Role,
                            as: 'role',
                            attributes: ['role_id', 'role_name', 'role_code']
                        }
                    ]
                });
                if (employee) {
                    sender = {
                        sender_id: employee.employee_id,
                        full_name: employee.full_name,
                        npp: employee.npp,
                        email: employee.email,
                        division: employee.division,
                        role: employee.role,
                        type: 'employee'
                    };
                }
            }

            const enrichedActivity = {
                ticket_activity_id: activity.ticket_activity_id,
                ticket: {
                    ticket_id: ticket.ticket_id,
                    ticket_number: ticket.ticket_number,
                    description: ticket.description
                },
                activity_type: activity.activity_type,
                sender_type: activity.sender_type,
                sender: sender,
                content: activity.content,
                ticket_activity_time: activity.ticket_activity_time,
                attachments: activity.attachments || []
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

    async calculateDivision(ticket) {
        let targetDivisionId;
        
        if (ticket.employee_status?.employee_status_code === 'ESCALATED') {
            targetDivisionId = ticket.policy?.uic_id;
        } else {
            targetDivisionId = 1;
        }

        if (targetDivisionId) {
            const division = await Division.findByPk(targetDivisionId, {
                attributes: ['division_id', 'division_name', 'division_code']
            });
            return division;
        }
        return null;
    }
}

module.exports = TicketController;

