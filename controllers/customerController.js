const { NotFoundError, ForbiddenError, ValidationError } = require('../middlewares/error_handler');
const { Op } = require('sequelize');

const db = require('../models');

const { 
    customer: Customer,
    account: Account,
    card: Card,
    ticket: Ticket,
    account_type: AccountType,
    card_status: CardStatus,
    priority: Priority,
    channel: Channel,
    complaint_category: ComplaintCategory,
    customer_status: CustomerStatus,
    employee_status: EmployeeStatus
} = db;

class CustomerController {
    constructor() {
        // No longer need db instance
    }

    static createInstance() {
        return new CustomerController();
    }

    async getCustomers(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                gender_type,
                sort_by = 'created_at',
                sort_order = 'desc'
            } = req.query;

            // Convert to numbers
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;

            // Build where clause
            let whereClause = {};

            // Apply search filter
            if (search) {
                whereClause[Op.or] = [
                    { full_name: { [Op.iLike]: `%${search}%` } },
                    { email: { [Op.iLike]: `%${search}%` } },
                    { phone_number: { [Op.like]: `%${search}%` } },
                    { cif: { [Op.like]: `%${search}%` } },
                    { nik: { [Op.like]: `%${search}%` } }
                ];
            }

            // Apply gender filter
            if (gender_type) {
                whereClause.gender_type = gender_type;
            }

            // Build order clause
            const orderClause = [[sort_by, sort_order.toUpperCase()]];

            // Get customers with pagination
            const { count, rows: customers } = await Customer.findAndCountAll({
                where: whereClause,
                order: orderClause,
                limit: limitNum,
                offset: offset,
                attributes: {
                    exclude: ['password_hash'] // Exclude sensitive data
                }
            });

            // Enrich customer data with counts
            const enrichedCustomers = await Promise.all(customers.map(async (customer) => {
                const customerData = customer.toJSON();

                // Get accounts count
                const accountsCount = await Account.count({
                    where: { customer_id: customer.customer_id }
                });

                // Get tickets count
                const ticketsCount = await Ticket.count({
                    where: { customer_id: customer.customer_id }
                });

                return {
                    ...customerData,
                    accounts_count: accountsCount,
                    tickets_count: ticketsCount
                };
            }));

            // Calculate pagination metadata
            const totalPages = Math.ceil(count / limitNum);
            const hasNext = pageNum < totalPages;
            const hasPrev = pageNum > 1;

            res.status(200).json({
                success: true,
                message: "Customers retrieved successfully",
                data: enrichedCustomers,
                pagination: {
                    current_page: pageNum,
                    per_page: limitNum,
                    total_items: count,
                    total_pages: totalPages,
                    has_next: hasNext,
                    has_prev: hasPrev
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async getCustomerById(req, res, next) {
        try {
            const { id } = req.params;
            const customerId = parseInt(id);

            // Find customer with basic info
            const customer = await Customer.findByPk(customerId, {
                attributes: {
                    exclude: ['password_hash'] // Exclude sensitive data
                }
            });

            if (!customer) {
                throw new NotFoundError('Customer');
            }

            // Get customer accounts with details
            const accounts = await Account.findAll({
                where: { customer_id: customerId },
                include: [{
                    model: AccountType,
                    as: 'account_type'
                }]
            });

            // Get customer cards through accounts
            let cards = [];
            const customerAccounts = await Account.findAll({
                where: { customer_id: customerId },
                attributes: ['account_id']
            });

            const accountIds = customerAccounts.map(acc => acc.account_id);

            if (accountIds.length > 0) {
                cards = await Card.findAll({
                    where: { 
                        account_id: { [Op.in]: accountIds }
                    },
                    include: [{
                        model: CardStatus,
                        as: 'card_status'
                    }]
                });
            }

            // Get customer tickets with basic info
            const tickets = await Ticket.findAll({
                where: { customer_id: customerId },
                include: [
                    {
                        model: Priority,
                        as: 'priority'
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
                        model: CustomerStatus,
                        as: 'customer_status'
                    },
                    {
                        model: EmployeeStatus,
                        as: 'employee_status'
                    }
                ],
                attributes: [
                    'ticket_id',
                    'ticket_number', 
                    'description',
                    'created_time',
                    'closed_time'
                ],
                order: [['created_time', 'DESC']]
            });

            // Transform tickets data
            const transformedTickets = tickets.map(ticket => {
                const ticketData = ticket.toJSON();
                return {
                    ticket_id: ticketData.ticket_id,
                    ticket_number: ticketData.ticket_number,
                    description: ticketData.description,
                    customer_status: ticketData.customer_status ? {
                        customer_status_id: ticketData.customer_status.customer_status_id,
                        customer_status_name: ticketData.customer_status.customer_status_name,
                        customer_status_code: ticketData.customer_status.customer_status_code
                    } : null,
                    employee_status: ticketData.employee_status ? {
                        employee_status_id: ticketData.employee_status.employee_status_id,
                        employee_status_name: ticketData.employee_status.employee_status_name,
                        employee_status_code: ticketData.employee_status.employee_status_code
                    } : null,
                    priority: ticketData.priority,
                    channel: ticketData.issue_channel,
                    complaint_category: ticketData.complaint_category,
                    created_at: ticketData.created_time,
                    updated_at: ticketData.updated_at
                };
            });

            // Transform accounts data
            const transformedAccounts = accounts.map(account => account.toJSON());

            // Transform cards data
            const transformedCards = cards.map(card => card.toJSON());

            // Calculate summary statistics
            const activeAccounts = transformedAccounts.filter(acc => 
                acc.account_status === 'ACTIVE'
            ).length;

            const activeCards = transformedCards.filter(card => 
                card.card_status?.status_name === 'ACTIVE'
            ).length;

            const openTickets = transformedTickets.filter(ticket => 
                ticket.employee_status && 
                !['CLOSED', 'RESOLVED'].includes(ticket.employee_status.employee_status_code)
            ).length;

            // Build response
            const customerDetail = {
                ...customer.toJSON(),
                accounts: transformedAccounts,
                cards: transformedCards,
                tickets: transformedTickets,
                summary: {
                    total_accounts: transformedAccounts.length,
                    total_cards: transformedCards.length,
                    total_tickets: transformedTickets.length,
                    active_accounts: activeAccounts,
                    active_cards: activeCards,
                    open_tickets: openTickets
                }
            };

            res.status(200).json({
                success: true,
                message: "Customer detail retrieved successfully",
                data: customerDetail
            });

        } catch (error) {
            next(error);
        }
    }


}

module.exports = CustomerController;