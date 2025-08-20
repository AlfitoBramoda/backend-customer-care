class CustomerController {
    constructor(db) {
        this.db = db;
    }

    static createInstance(db) {
        return new CustomerController(db);
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

            // Get all customers
            let customers = this.db.get('customer').value();

            // Apply search filter
            if (search) {
                const searchLower = search.toLowerCase();
                customers = customers.filter(customer => 
                    customer.full_name?.toLowerCase().includes(searchLower) ||
                    customer.email?.toLowerCase().includes(searchLower) ||
                    customer.phone_number?.includes(search) ||
                    customer.cif?.includes(search) ||
                    customer.nik?.includes(search)
                );
            }

            // Apply gender filter
            if (gender_type) {
                customers = customers.filter(customer => 
                    customer.gender_type === gender_type
                );
            }

            // Sort customers
            customers.sort((a, b) => {
                let aVal = a[sort_by];
                let bVal = b[sort_by];
                
                if (sort_by === 'created_at') {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                }
                
                if (sort_order === 'desc') {
                    return bVal > aVal ? 1 : -1;
                } else {
                    return aVal > bVal ? 1 : -1;
                }
            });

            // Calculate total
            const total = customers.length;

            // Apply pagination
            const paginatedCustomers = customers.slice(offset, offset + limitNum);

            // Enrich customer data
            const enrichedCustomers = paginatedCustomers.map(customer => {
                // Get accounts count
                const accountsCount = this.db.get('account')
                    .filter({ customer_id: customer.customer_id })
                    .size()
                    .value();

                // Get tickets count
                const ticketsCount = this.db.get('ticket')
                    .filter({ customer_id: customer.customer_id })
                    .size()
                    .value();

                // Remove sensitive data
                const { password_hash, ...safeCustomer } = customer;

                return {
                    ...safeCustomer,
                    accounts_count: accountsCount,
                    tickets_count: ticketsCount
                };
            });

            // Calculate pagination metadata
            const totalPages = Math.ceil(total / limitNum);
            const hasNext = pageNum < totalPages;
            const hasPrev = pageNum > 1;

            res.status(200).json({
                success: true,
                message: "Customers retrieved successfully",
                data: enrichedCustomers,
                pagination: {
                    current_page: pageNum,
                    per_page: limitNum,
                    total_items: total,
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

            // Find customer
            const customer = this.db.get('customer')
                .find({ customer_id: customerId })
                .value();

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: "Customer not found",
                    error_code: "CUSTOMER_NOT_FOUND"
                });
            }

            // Get customer accounts with details
            const accounts = this.db.get('account')
                .filter({ customer_id: customerId })
                .map(account => {
                    const accountType = this.db.get('account_type')
                        .find({ account_type_id: account.account_type_id })
                        .value();
                    
                    return {
                        ...account,
                        account_type: accountType
                    };
                })
                .value();

            // Get customer cards with details
            const cards = this.db.get('card')
                .filter({ customer_id: customerId })
                .map(card => {
                    const cardStatus = this.db.get('card_status')
                        .find({ card_status_id: card.card_status_id })
                        .value();
                    
                    return {
                        ...card,
                        card_status: cardStatus
                    };
                })
                .value();

            // Get customer tickets with basic info
            const tickets = this.db.get('ticket')
                .filter({ customer_id: customerId })
                .map(ticket => {
                    const priority = this.db.get('priority')
                        .find({ priority_id: ticket.priority_id })
                        .value();
                    
                    const channel = this.db.get('channel')
                        .find({ channel_id: ticket.issue_channel_id })
                        .value();
                    
                    const complaint = this.db.get('complaint_category')
                        .find({ complaint_id: ticket.complaint_id })
                        .value();

                    return {
                        ticket_id: ticket.ticket_id,
                        ticket_number: ticket.ticket_number,
                        description: ticket.description,
                        customer_status: ticket.customer_status,
                        employee_status: ticket.employee_status,
                        priority: priority,
                        channel: channel,
                        complaint_category: complaint,
                        created_at: ticket.created_at,
                        updated_at: ticket.updated_at
                    };
                })
                .value();

            // Remove sensitive data
            const { password_hash, ...safeCustomer } = customer;

            // Build response
            const customerDetail = {
                ...safeCustomer,
                accounts: accounts,
                cards: cards,
                tickets: tickets,
                summary: {
                    total_accounts: accounts.length,
                    total_cards: cards.length,
                    total_tickets: tickets.length,
                    active_accounts: accounts.filter(acc => acc.account_status === 'ACTIVE').length,
                    active_cards: cards.filter(card => card.card_status?.status_name === 'ACTIVE').length,
                    open_tickets: tickets.filter(ticket => 
                        !['CLOSED', 'RESOLVED'].includes(ticket.employee_status)
                    ).length
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

    // GET /v1/customers/:id/accounts - Get customer accounts
    async getCustomerAccounts(req, res, next) {
        try {
            const { id } = req.params;
            const customerId = parseInt(id);

            // Verify customer exists
            const customer = this.db.get('customer')
                .find({ customer_id: customerId })
                .value();

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: "Customer not found"
                });
            }

            // Get customer accounts with account type details
            const accounts = this.db.get('account')
                .filter({ customer_id: customerId })
                .map(account => {
                    const accountType = this.db.get('account_type')
                        .find({ account_type_id: account.account_type_id })
                        .value();
                    
                    return {
                        account_id: account.account_id,
                        account_number: account.account_number,
                        account_status: account.account_status,
                        account_type: accountType ? {
                            account_type_id: accountType.account_type_id,
                            account_type_name: accountType.account_type_name,
                            account_type_code: accountType.account_type_code
                        } : null,
                        created_at: account.created_at
                    };
                })
                .value();

            res.status(200).json({
                success: true,
                message: "Customer accounts retrieved successfully",
                data: accounts
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
            const customer = this.db.get('customer')
                .find({ customer_id: customerId })
                .value();

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: "Customer not found"
                });
            }

            // Get customer cards with card status details
            const cards = this.db.get('card')
                .filter({ customer_id: customerId })
                .map(card => {
                    const cardStatus = this.db.get('card_status')
                        .find({ card_status_id: card.card_status_id })
                        .value();
                    
                    return {
                        card_id: card.card_id,
                        card_number: card.card_number,
                        card_type: card.card_type,
                        card_status: cardStatus ? {
                            card_status_id: cardStatus.card_status_id,
                            status_name: cardStatus.status_name,
                            status_code: cardStatus.status_code
                        } : null,
                        issue_date: card.issue_date,
                        expiry_date: card.expiry_date
                    };
                })
                .value();

            res.status(200).json({
                success: true,
                message: "Customer cards retrieved successfully",
                data: cards
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = CustomerController;