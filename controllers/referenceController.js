const { Op } = require('sequelize');
const { HTTP_STATUS } = require('../constants/statusCodes');

const db = require('../models');

const { 
    channel: Channel,
    complaint_category: ComplaintCategory,
    complaint_policy: ComplaintPolicy,
    division: Division,
    terminal: Terminal,
    terminal_type: TerminalType,
    ticket: Ticket,
    employee: Employee,
    faq: FAQ,
    priority: Priority,
    source: Source
} = db;

class ReferenceController {
    constructor() {
        // No longer need db instance
    }

    static createInstance() {
        return new ReferenceController();
    }

    // GET /v1/channels - List all channels
    async getChannels(req, res, next) {
        try {
            const channels = await Channel.findAll({
                order: [['channel_id', 'ASC']]
            });

            const enrichedChannels = await Promise.all(channels.map(async (channel) => {
                // Count terminals for each channel
                const terminalsCount = await Terminal.count({
                    where: { channel_id: channel.channel_id }
                });

                // Count policies for each channel
                const policiesCount = await ComplaintPolicy.count({
                    where: { channel_id: channel.channel_id }
                });

                return {
                    channel_id: channel.channel_id,
                    channel_code: channel.channel_code,
                    channel_name: channel.channel_name,
                    supports_terminal: channel.supports_terminal,
                    terminals_count: terminalsCount,
                    policies_count: policiesCount
                };
            }));

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Channels retrieved successfully",
                data: enrichedChannels
            });

        } catch (error) {
            next(error);
        }
    }

    // GET /v1/complaint-categories - List all complaint categories
    async getComplaintCategories(req, res, next) {
        try {
            const categories = await ComplaintCategory.findAll({
                order: [['complaint_id', 'ASC']]
            });

            const enrichedCategories = await Promise.all(categories.map(async (category) => {
                // Count tickets for each category
                const ticketsCount = await Ticket.count({
                    where: { complaint_id: category.complaint_id }
                });

                // Count FAQs for each category (if FAQ model exists)
                let faqsCount = 0;
                try {
                    faqsCount = await FAQ.count({
                        where: { complaint_id: category.complaint_id }
                    });
                } catch (error) {
                    // FAQ model might not exist
                    faqsCount = 0;
                }

                // Count policies for each category
                const policiesCount = await ComplaintPolicy.count({
                    where: { complaint_id: category.complaint_id }
                });

                return {
                    complaint_id: category.complaint_id,
                    complaint_code: category.complaint_code,
                    complaint_name: category.complaint_name,
                    tickets_count: ticketsCount,
                    faqs_count: faqsCount,
                    policies_count: policiesCount
                };
            }));

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Complaint categories retrieved successfully",
                data: enrichedCategories
            });

        } catch (error) {
            next(error);
        }
    }

    // GET /v1/slas - Extract SLA data from complaint_policy
    async getSLAs(req, res, next) {
        try {
            const { service, channel_id, complaint_id } = req.query;

            // Build where clause
            let whereClause = {};

            if (service) {
                whereClause.service = {
                    [Op.iLike]: `%${service}%`
                };
            }

            if (channel_id) {
                whereClause.channel_id = parseInt(channel_id);
            }

            if (complaint_id) {
                whereClause.complaint_id = parseInt(complaint_id);
            }

            const policies = await ComplaintPolicy.findAll({
                where: whereClause,
                include: [
                    {
                        model: Channel,
                        as: 'channel',
                        attributes: ['channel_id', 'channel_code', 'channel_name']
                    },
                    {
                        model: ComplaintCategory,
                        as: 'complaint_category',
                        attributes: ['complaint_id', 'complaint_code', 'complaint_name']
                    },
                    {
                        model: Division,
                        as: 'uic_division',
                        attributes: ['division_id', 'division_code', 'division_name']
                    }
                ],
                order: [['policy_id', 'ASC']]
            });

            const slaData = policies.map(policy => {
                const policyData = policy.toJSON();
                return {
                    policy_id: policyData.policy_id,
                    service: policyData.service,
                    sla_days: policyData.sla,
                    sla_hours: policyData.sla ? policyData.sla * 24 : null,
                    channel: policyData.channel,
                    complaint_category: policyData.complaint_category,
                    uic: policyData.uic_division,
                    description: policyData.description
                };
            });

            // Group by SLA hours for summary
            const slaGroups = slaData.reduce((acc, item) => {
                const slaKey = item.sla_days || 'undefined';
                if (!acc[slaKey]) {
                    acc[slaKey] = {
                        sla_days: item.sla_days,
                        sla_hours: item.sla_hours,
                        policies_count: 0,
                        policies: []
                    };
                }
                acc[slaKey].policies_count++;
                acc[slaKey].policies.push(item);
                return acc;
            }, {});

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "SLA data retrieved successfully",
                summary: {
                    total_policies: slaData.length,
                    unique_sla_levels: Object.keys(slaGroups).length,
                    sla_groups: Object.values(slaGroups).map(group => ({
                        sla_hours: group.sla_hours,
                        sla_days: group.sla_days,
                        policies_count: group.policies_count
                    }))
                },
                data: slaData
            });

        } catch (error) {
            next(error);
        }
    }

    // GET /v1/uics - Map divisions as UIC (Unit in Charge)
    async getUICs(req, res, next) {
        try {
            const divisions = await Division.findAll({
                order: [['division_id', 'ASC']]
            });

            const uicData = await Promise.all(divisions.map(async (division) => {
                // Count employees in this division
                const employeesCount = await Employee.count({
                    where: { division_id: division.division_id }
                });

                // Count active employees in this division
                const activeEmployeesCount = await Employee.count({
                    where: { 
                        division_id: division.division_id,
                        is_active: true 
                    }
                });

                // Count policies handled by this UIC
                const policiesCount = await ComplaintPolicy.count({
                    where: { uic_id: division.division_id }
                });

                // Count tickets assigned to this UIC
                const ticketsCount = await Ticket.count({
                    include: [{
                        model: ComplaintPolicy,
                        as: 'policy',
                        where: { uic_id: division.division_id },
                        required: true
                    }]
                });

                return {
                    uic_id: division.division_id,
                    uic_code: division.division_code,
                    uic_name: division.division_name,
                    employees_count: employeesCount,
                    active_employees_count: activeEmployeesCount,
                    policies_count: policiesCount,
                    tickets_count: ticketsCount,
                    is_operational: activeEmployeesCount > 0
                };
            }));

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "UICs retrieved successfully",
                summary: {
                    total_uics: uicData.length,
                    operational_uics: uicData.filter(uic => uic.is_operational).length,
                    total_employees: uicData.reduce((sum, uic) => sum + uic.employees_count, 0),
                    total_active_employees: uicData.reduce((sum, uic) => sum + uic.active_employees_count, 0)
                },
                data: uicData
            });

        } catch (error) {
            next(error);
        }
    }

    // GET /v1/priorities - List all priorities
    async getPriorities(req, res, next) {
        try {
            const priorities = await Priority.findAll({
                order: [['priority_id', 'ASC']]
            });

            const enrichedPriorities = priorities.map(priority => ({
                priority_id: priority.priority_id,
                priority_code: priority.priority_code,
                priority_name: priority.priority_name
            }));

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Priorities retrieved successfully",
                data: enrichedPriorities
            });

        } catch (error) {
            next(error);
        }
    }

    // GET /v1/sources - List all intake sources
    async getSources(req, res, next) {
        try {
            const sources = await Source.findAll({
                order: [['source_id', 'ASC']]
            });

            const enrichedSources = sources.map(source => ({
                source_id: source.source_id,
                source_code: source.source_code,
                source_name: source.source_name
            }));

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Sources retrieved successfully",
                data: enrichedSources
            });

        } catch (error) {
            next(error);
        }
    }

    // GET /v1/terminals - List all terminals
    async getTerminals(req, res, next) {
        try {
            const { channel_id, terminal_type_id, location } = req.query;

            let whereClause = {};

            if (channel_id) {
                whereClause.channel_id = parseInt(channel_id);
            }

            if (terminal_type_id) {
                whereClause.terminal_type_id = parseInt(terminal_type_id);
            }

            if (location) {
                whereClause.location = {
                    [Op.iLike]: `%${location}%`
                };
            }

            const terminals = await Terminal.findAll({
                where: whereClause,
                include: [
                    {
                        model: TerminalType,
                        as: 'terminal_type',
                        attributes: ['terminal_type_id', 'terminal_type_code', 'terminal_type_name']
                    },
                    {
                        model: Channel,
                        as: 'channel',
                        attributes: ['channel_id', 'channel_code', 'channel_name', 'supports_terminal']
                    }
                ],
                order: [['terminal_id', 'ASC']]
            });

            const enrichedTerminals = await Promise.all(terminals.map(async (terminal) => {
                const ticketsCount = await Ticket.count({
                    where: { terminal_id: terminal.terminal_id }
                });

                const terminalData = terminal.toJSON();
                return {
                    terminal_id: terminalData.terminal_id,
                    terminal_code: terminalData.terminal_code,
                    location: terminalData.location,
                    tickets_count: ticketsCount,
                    terminal_type: terminalData.terminal_type,
                    channel: terminalData.channel
                };
            }));

            // Get summary data
            const terminalTypes = await TerminalType.findAll();
            const channels = await Channel.findAll({ where: { supports_terminal: true } });

            const byType = await Promise.all(terminalTypes.map(async (type) => {
                const count = await Terminal.count({ where: { terminal_type_id: type.terminal_type_id } });
                return {
                    terminal_type_code: type.terminal_type_code,
                    terminal_type_name: type.terminal_type_name,
                    count
                };
            }));

            const byChannel = await Promise.all(channels.map(async (channel) => {
                const count = await Terminal.count({ where: { channel_id: channel.channel_id } });
                return {
                    channel_code: channel.channel_code,
                    channel_name: channel.channel_name,
                    count
                };
            }));

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Terminals retrieved successfully",
                summary: {
                    total_terminals: enrichedTerminals.length,
                    by_type: byType,
                    by_channel: byChannel
                },
                data: enrichedTerminals
            });

        } catch (error) {
            next(error);
        }
    }

    // GET /v1/policies - List policies with comprehensive filtering
    async getPolicies(req, res, next) {
        try {
            const { 
                service, 
                channel_id, 
                complaint_id, 
                uic_id, 
                sla_min, 
                sla_max,
                page = 1,
                limit = 50,
                sort_by = 'policy_id',
                sort_order = 'asc'
            } = req.query;

            // Convert to numbers
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;

            // Build where clause
            let whereClause = {};

            if (service) {
                whereClause.service = {
                    [Op.iLike]: `%${service}%`
                };
            }

            if (channel_id) {
                whereClause.channel_id = parseInt(channel_id);
            }

            if (complaint_id) {
                whereClause.complaint_id = parseInt(complaint_id);
            }

            if (uic_id) {
                whereClause.uic_id = parseInt(uic_id);
            }

            if (sla_min) {
                whereClause.sla = {
                    ...whereClause.sla,
                    [Op.gte]: parseInt(sla_min)
                };
            }

            if (sla_max) {
                whereClause.sla = {
                    ...whereClause.sla,
                    [Op.lte]: parseInt(sla_max)
                };
            }

            // Build order clause
            const orderClause = [[sort_by, sort_order.toUpperCase()]];

            // Get policies with pagination
            const { count, rows: policies } = await ComplaintPolicy.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: Channel,
                        as: 'channel',
                        attributes: ['channel_id', 'channel_code', 'channel_name', 'supports_terminal']
                    },
                    {
                        model: ComplaintCategory,
                        as: 'complaint_category',
                        attributes: ['complaint_id', 'complaint_code', 'complaint_name']
                    },
                    {
                        model: Division,
                        as: 'uic_division',
                        attributes: ['division_id', 'division_code', 'division_name']
                    }
                ],
                order: orderClause,
                limit: limitNum,
                offset: offset,
                distinct: true
            });

            // Enrich with tickets count
            const enrichedPolicies = await Promise.all(policies.map(async (policy) => {
                const policyData = policy.toJSON();

                // Count tickets using this policy
                const ticketsCount = await Ticket.count({
                    where: { policy_id: policy.policy_id }
                });

                return {
                    policy_id: policyData.policy_id,
                    service: policyData.service,
                    sla_days: policyData.sla,
                    sla_hours: policyData.sla ? policyData.sla * 24 : null,
                    description: policyData.description,
                    tickets_count: ticketsCount,
                    channel: policyData.channel,
                    complaint_category: policyData.complaint_category,
                    uic: policyData.uic_division
                };
            }));

            // Pagination metadata
            const totalPages = Math.ceil(count / limitNum);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Policies retrieved successfully",
                pagination: {
                    current_page: pageNum,
                    per_page: limitNum,
                    total_items: count,
                    total_pages: totalPages,
                    has_next: pageNum < totalPages,
                    has_prev: pageNum > 1
                },
                data: enrichedPolicies
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = ReferenceController;