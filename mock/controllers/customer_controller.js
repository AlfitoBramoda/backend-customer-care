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
}

module.exports = CustomerController;