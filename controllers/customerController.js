const { NotFoundError, ForbiddenError, ValidationError } = require('../middlewares/error_handler');
const { HTTP_STATUS } = require('../constants/statusCodes');
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
                search_type = 'customer',
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
            let searchInfo = null;

            // Apply search filter based on search_type
            if (search) {
                const searchLower = search.toLowerCase();
                
                switch (search_type) {
                    case 'account':
                        // Search by account number
                        const matchedAccounts = await Account.findAll({
                            where: {
                                account_number: { [Op.like]: `%${search}%` }
                            },
                            attributes: ['customer_id']
                        });
                        
                        const accountCustomerIds = matchedAccounts.map(acc => acc.customer_id);
                        if (accountCustomerIds.length > 0) {
                            whereClause.customer_id = { [Op.in]: accountCustomerIds };
                        } else {
                            // No matching accounts found, return empty result
                            whereClause.customer_id = { [Op.in]: [] };
                        }
                        
                        searchInfo = {
                            type: 'account',
                            query: search,
                            matched_accounts: matchedAccounts.length
                        };
                        break;
                        
                    case 'card':
                        // Search by card number
                        const matchedCards = await Card.findAll({
                            where: {
                                card_number: { [Op.like]: `%${search}%` }
                            },
                            include: [{
                                model: Account,
                                as: 'account',
                                attributes: ['customer_id']
                            }]
                        });
                        
                        const cardCustomerIds = matchedCards.map(card => card.account.customer_id);
                        if (cardCustomerIds.length > 0) {
                            whereClause.customer_id = { [Op.in]: cardCustomerIds };
                        } else {
                            // No matching cards found, return empty result
                            whereClause.customer_id = { [Op.in]: [] };
                        }
                        
                        searchInfo = {
                            type: 'card',
                            query: search,
                            matched_cards: matchedCards.length
                        };
                        break;
                        
                    default: // customer
                        whereClause[Op.or] = [
                            { full_name: { [Op.iLike]: `%${search}%` } },
                            { email: { [Op.iLike]: `%${search}%` } },
                            { phone_number: { [Op.like]: `%${search}%` } },
                            { cif: { [Op.like]: `%${search}%` } },
                            { nik: { [Op.like]: `%${search}%` } }
                        ];
                        
                        searchInfo = {
                            type: 'customer',
                            query: search
                        };
                }
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

            const response = {
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
            };
            
            // Add search info if search was performed
            if (searchInfo) {
                response.search_info = searchInfo;
            }

            res.status(HTTP_STATUS.OK).json(response);

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
                }],
                attributes: [
                    'account_id',
                    'account_number',
                    'account_type_id', 
                    'is_primary',
                    'created_at'
                ]
            });

            // Get customer cards through accounts
            const customerAccounts = await Account.findAll({
                where: { customer_id: customerId },
                attributes: ['account_id']
            });

            const accountIds = customerAccounts.map(acc => acc.account_id);
            const cards = accountIds.length > 0 ? await Card.findAll({
                where: { 
                    account_id: { [Op.in]: accountIds }
                },
                include: [{
                    model: CardStatus,
                    as: 'card_status'
                }],
                attributes: [
                    'card_id',
                    'card_number',
                    'card_type', 
                    'exp_date',
                    'created_at'
                ]
            }) : [];

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
            const transformedCards = cards.map(card => {
                const cardData = card.toJSON();
                return {
                    card_id: cardData.card_id,
                    card_number: cardData.card_number,
                    card_type: cardData.card_type,
                    card_status: cardData.card_status ? {
                        card_status_id: cardData.card_status.card_status_id,
                        status_name: cardData.card_status.card_status_name,
                        status_code: cardData.card_status.card_status_code
                    } : null,
                    exp_date: cardData.exp_date,
                    created_at: cardData.created_at
                };
            });

            // Calculate summary statistics
            const activeAccounts = transformedAccounts.filter(acc => 
                acc.is_primary === true
            ).length;

            const activeCards = transformedCards.filter(card => 
                card.card_status?.status_code === 'ACTIVE'
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

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Customer detail retrieved successfully",
                data: customerDetail
            });

        } catch (error) {
            next(error);
        }
    }

    // GET /v1/customers/:id/accounts - Get customer accounts
    async getCustomerAccounts(req, res, next) {
        try {
            const { id } = req.params;
            const customerId = parseInt(id);

            // Verify customer exists
            const customer = await Customer.findByPk(customerId);
            if (!customer) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: "Customer not found"
                });
            }

            // Get customer accounts with account type details
            const accounts = await Account.findAll({
                where: { customer_id: customerId },
                include: [{
                    model: AccountType,
                    as: 'account_type',
                    attributes: ['account_type_id', 'account_type_name', 'account_type_code']
                }],
                attributes: [
                    'account_id',
                    'account_number',
                    'account_type_id', 
                    'is_primary',
                    'created_at'
                ]
            });

            const transformedAccounts = accounts.map(account => {
                const accountData = account.toJSON();
                return {
                    account_id: accountData.account_id,
                    account_number: accountData.account_number,
                    is_primary: accountData.is_primary,
                    account_type: accountData.account_type ? {
                        account_type_id: accountData.account_type.account_type_id,
                        account_type_name: accountData.account_type.account_type_name,
                        account_type_code: accountData.account_type.account_type_code
                    } : null,
                    created_at: accountData.created_at
                };
            });

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Customer accounts retrieved successfully",
                data: transformedAccounts
            });

        } catch (error) {
            next(error);
        }
    }

    // GET /v1/customers/:id/cards - Get customer cards
    async getCustomerCards(req, res, next) {
        try {
            const { id } = req.params;
            const customerId = parseInt(id);

            // Verify customer exists
            const customer = await Customer.findByPk(customerId);
            if (!customer) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: "Customer not found"
                });
            }

            // Get customer cards through accounts
            const customerAccounts = await Account.findAll({
                where: { customer_id: customerId },
                attributes: ['account_id']
            });

            const accountIds = customerAccounts.map(acc => acc.account_id);
            let transformedCards = [];

            if (accountIds.length > 0) {
                const cards = await Card.findAll({
                    where: { 
                        account_id: { [Op.in]: accountIds }
                    },
                    include: [{
                        model: CardStatus,
                        as: 'card_status',
                        attributes: ['card_status_id', 'card_status_name', 'card_status_code']
                    }],
                    attributes: [
                        'card_id',
                        'card_number',
                        'card_type', 
                        'exp_date',
                        'created_at'
                    ]
                });

                transformedCards = cards.map(card => {
                    const cardData = card.toJSON();
                    return {
                        card_id: cardData.card_id,
                        card_number: cardData.card_number,
                        card_type: cardData.card_type,
                        card_status: cardData.card_status ? {
                            card_status_id: cardData.card_status.card_status_id,
                            status_name: cardData.card_status.card_status_name,
                            status_code: cardData.card_status.card_status_code
                        } : null,
                        exp_date: cardData.exp_date,
                        created_at: cardData.created_at
                    };
                });
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Customer cards retrieved successfully",
                data: transformedCards
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = CustomerController;