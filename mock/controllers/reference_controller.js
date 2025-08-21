const { Op } = require('sequelize');
const { HTTP_STATUS } = require('../constants/statusCodes');

class ReferenceController {
    constructor(db) {
        this.db = db;
    }

    static createInstance(db) {
        return new ReferenceController(db);
    }

    // GET /v1/channels - List all channels
    async getChannels(req, res, next) {
        try {
            const channels = this.db.get('channel').value();

            const enrichedChannels = channels.map(channel => {
                // Count terminals for each channel
                const terminalsCount = this.db.get('terminal')
                    .filter({ channel_id: channel.channel_id })
                    .size()
                    .value();

                // Count policies for each channel
                const policiesCount = this.db.get('complaint_policy')
                    .filter({ channel_id: channel.channel_id })
                    .size()
                    .value();

                return {
                    channel_id: channel.channel_id,
                    channel_code: channel.channel_code,
                    channel_name: channel.channel_name,
                    supports_terminal: channel.supports_terminal,
                    terminals_count: terminalsCount,
                    policies_count: policiesCount
                };
            });

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
            const categories = this.db.get('complaint_category').value();

            const enrichedCategories = categories.map(category => {
                // Count tickets for each category
                const ticketsCount = this.db.get('ticket')
                    .filter({ complaint_id: category.complaint_id })
                    .size()
                    .value();

                // Count FAQs for each category
                const faqsCount = this.db.get('faq')
                    .filter({ complaint_id: category.complaint_id })
                    .size()
                    .value();

                // Count policies for each category
                const policiesCount = this.db.get('complaint_policy')
                    .filter({ complaint_id: category.complaint_id })
                    .size()
                    .value();

                return {
                    complaint_id: category.complaint_id,
                    complaint_code: category.complaint_code,
                    complaint_name: category.complaint_name,
                    tickets_count: ticketsCount,
                    faqs_count: faqsCount,
                    policies_count: policiesCount
                };
            });

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

            let policies = this.db.get('complaint_policy').value();

            // Apply filters
            if (service) {
                policies = policies.filter(p => 
                    p.service && p.service.toLowerCase().includes(service.toLowerCase())
                );
            }

            if (channel_id) {
                policies = policies.filter(p => p.channel_id == channel_id);
            }

            if (complaint_id) {
                policies = policies.filter(p => p.complaint_id == complaint_id);
            }

            const slaData = policies.map(policy => {
                // Get related data
                const channel = this.db.get('channel')
                    .find({ channel_id: policy.channel_id })
                    .value();

                const complaint = this.db.get('complaint_category')
                    .find({ complaint_id: policy.complaint_id })
                    .value();

                const uic = this.db.get('division')
                    .find({ division_id: policy.uic_id })
                    .value();

                return {
                    policy_id: policy.policy_id,
                    service: policy.service,
                    sla_days: policy.sla,
                    sla_hours: policy.sla ? policy.sla * 24 : null,
                    channel: channel ? {
                        channel_id: channel.channel_id,
                        channel_code: channel.channel_code,
                        channel_name: channel.channel_name
                    } : null,
                    complaint_category: complaint ? {
                        complaint_id: complaint.complaint_id,
                        complaint_code: complaint.complaint_code,
                        complaint_name: complaint.complaint_name
                    } : null,
                    uic: uic ? {
                        division_id: uic.division_id,
                        division_code: uic.division_code,
                        division_name: uic.division_name
                    } : null,
                    description: policy.description
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
            const divisions = this.db.get('division').value();

            const uicData = divisions.map(division => {
                // Count employees in this division
                const employeesCount = this.db.get('employee')
                    .filter({ division_id: division.division_id })
                    .size()
                    .value();

                // Count active employees in this division
                const activeEmployeesCount = this.db.get('employee')
                    .filter({ division_id: division.division_id, is_active: true })
                    .size()
                    .value();

                // Count policies handled by this UIC
                const policiesCount = this.db.get('complaint_policy')
                    .filter({ uic_id: division.division_id })
                    .size()
                    .value();

                // Count tickets assigned to this UIC
                const ticketsCount = this.db.get('ticket')
                    .filter(ticket => {
                        const policy = this.db.get('complaint_policy')
                            .find({ policy_id: ticket.policy_id })
                            .value();
                        return policy && policy.uic_id === division.division_id;
                    })
                    .size()
                    .value();

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
            });

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
            const priorities = this.db.get('priority').value();

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
            const sources = this.db.get('source').value();

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

            let policies = this.db.get('complaint_policy').value();

            // Apply filters
            if (service) {
                policies = policies.filter(p => 
                    p.service && p.service.toLowerCase().includes(service.toLowerCase())
                );
            }

            if (channel_id) {
                policies = policies.filter(p => p.channel_id == channel_id);
            }

            if (complaint_id) {
                policies = policies.filter(p => p.complaint_id == complaint_id);
            }

            if (uic_id) {
                policies = policies.filter(p => p.uic_id == uic_id);
            }

            if (sla_min) {
                policies = policies.filter(p => p.sla >= parseInt(sla_min));
            }

            if (sla_max) {
                policies = policies.filter(p => p.sla <= parseInt(sla_max));
            }

            // Sorting
            policies.sort((a, b) => {
                let aVal = a[sort_by];
                let bVal = b[sort_by];
                
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }
                
                if (sort_order === 'desc') {
                    return bVal > aVal ? 1 : -1;
                } else {
                    return aVal > bVal ? 1 : -1;
                }
            });

            // Pagination
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;
            const totalPolicies = policies.length;
            const paginatedPolicies = policies.slice(offset, offset + limitNum);

            // Enrich with related data
            const enrichedPolicies = paginatedPolicies.map(policy => {
                const channel = this.db.get('channel')
                    .find({ channel_id: policy.channel_id })
                    .value();

                const complaint = this.db.get('complaint_category')
                    .find({ complaint_id: policy.complaint_id })
                    .value();

                const uic = this.db.get('division')
                    .find({ division_id: policy.uic_id })
                    .value();

                // Count tickets using this policy
                const ticketsCount = this.db.get('ticket')
                    .filter({ policy_id: policy.policy_id })
                    .size()
                    .value();

                return {
                    policy_id: policy.policy_id,
                    service: policy.service,
                    sla_days: policy.sla,
                    sla_hours: policy.sla ? policy.sla * 24 : null,
                    description: policy.description,
                    tickets_count: ticketsCount,
                    channel: channel ? {
                        channel_id: channel.channel_id,
                        channel_code: channel.channel_code,
                        channel_name: channel.channel_name,
                        supports_terminal: channel.supports_terminal
                    } : null,
                    complaint_category: complaint ? {
                        complaint_id: complaint.complaint_id,
                        complaint_code: complaint.complaint_code,
                        complaint_name: complaint.complaint_name
                    } : null,
                    uic: uic ? {
                        division_id: uic.division_id,
                        division_code: uic.division_code,
                        division_name: uic.division_name
                    } : null
                };
            });

            // Pagination metadata
            const totalPages = Math.ceil(totalPolicies / limitNum);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Policies retrieved successfully",
                pagination: {
                    current_page: pageNum,
                    per_page: limitNum,
                    total_items: totalPolicies,
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