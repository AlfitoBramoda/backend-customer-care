const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');

class AuthController {
    constructor(db) {
        this.db = db;
    }

    static createInstance(db) {
        return new AuthController(db);
    }

    getCustomerFullData(customerId) {
        const customer = this.db.get('customer').find({ customer_id: customerId }).value();
        if (!customer) return null;

        const accounts = this.db.get('account')
            .filter({ customer_id: customerId })
            .value();

        const enrichedAccounts = accounts.map(account => {
            const accountType = this.db.get('account_type')
                .find({ account_type_id: account.account_type_id })
                .value();

            const cards = this.db.get('card')
                .filter({ account_id: account.account_id })
                .value();

            const enrichedCards = cards.map(card => {
                const cardStatus = this.db.get('card_status')
                    .find({ card_status_id: card.card_status_id })
                    .value();

                return {
                    ...card,
                    card_status: cardStatus
                };
            });

            return {
                ...account,
                account_type: accountType,
                cards: enrichedCards
            };
        });

        // Get tickets for this customer
        const tickets = this.db.get('ticket')
            .filter({ customer_id: customerId })
            .value();

        const enrichedTickets = tickets.map(ticket => {
            const customerStatus = this.db.get('customer_status')
                .find({ customer_status_id: ticket.customer_status_id })
                .value();

            const issueChannel = this.db.get('channel')
                .find({ channel_id: ticket.issue_channel_id })
                .value();

            const relatedAccount = this.db.get('account')
                .find({ account_id: ticket.related_account_id })
                .value();

            const relatedCard = this.db.get('card')
                .find({ card_id: ticket.related_card_id })
                .value();

            const complaint = this.db.get('complaint_category')
                .find({ complaint_id: ticket.complaint_id })
                .value();

            return {
                ticket_id: ticket.ticket_id,
                ticket_number: ticket.ticket_number,
                customer_status: customerStatus?.customer_status_name || null,
                issue_channel: issueChannel?.channel_name || null,
                related_account: relatedAccount ? {
                    account_id: relatedAccount.account_id,
                    account_number: relatedAccount.account_number
                } : null,
                related_card: relatedCard ? {
                    card_id: relatedCard.card_id,
                    card_number: relatedCard.card_number,
                    card_type: relatedCard.card_type
                } : null,
                complaint: complaint?.complaint_name || null,
                created_time: ticket.created_time,
            };
        });

        // Return only specific customer fields
        return {
            full_name: customer.full_name,
            email: customer.email,
            address: customer.address,
            phone_number: customer.phone_number,
            gender_type: customer.gender_type,
            place_of_birth: customer.place_of_birth,
            accounts: enrichedAccounts,
            tickets: enrichedTickets
        };
    }


    async loginCustomer(req, res, next) {
        try {
            const { email, password } = req.body;

            // Validation
            if (!email || !password) {
                throw {
                    status: 400,
                    message: "Bad Request: Email and password are required"
                };
            }

            if (!validator.isEmail(email)) {
                throw {
                    status: 400,
                    message: "Bad Request: Invalid email format"
                };
            }

            // Find customer
            const customer = this.db.get('customer').find({ email }).value();

            if (!customer) {
                throw {
                    status: 404,
                    message: "Customer not found"
                };
            }

            // Check password (demo format: hash$plaintext)
            const isValidPassword = customer.password_hash === `hash$${password}`;

            if (!isValidPassword) {
                throw {
                    status: 401,
                    message: "Email or password incorrect"
                };
            }

            // Get full customer data
            const customerFullData = this.getCustomerFullData(customer.customer_id);

            // Generate token
            const secret = process.env.JWT_SECRET || 'your-secret-key';
            const access_token = jwt.sign({
                id: customer.customer_id,
                email: customer.email,
                role: 'customer',
                cif: customer.cif,
                nik: customer.nik
            }, secret);

            res.status(200).json({
                message: "Login Success",
                access_token: "Bearer " + access_token,
                data: customerFullData
            });

        } catch (error) {
            next(error);
        }
    }

    getEmployeeFullData(employeeId) {
        const employee = this.db.get('employee').find({ employee_id: employeeId }).value();
        if (!employee) return null;

        // Get role and division
        const role = this.db.get('role').find({ role_id: employee.role_id }).value();
        const division = this.db.get('division').find({ division_id: employee.division_id }).value();

        // Get tickets handled by this employee
        const tickets = this.db.get('ticket')
            .filter({ responsible_employee_id: employeeId })
            .value();

        // Remove sensitive data
        const { password_hash, ...safeEmployee } = employee;

        return {
            ...safeEmployee,
            role_details: role,
            division_details: division,
            handled_tickets: tickets
        };
    }

    async loginEmployee(req, res, next) {
        try {
            const { npp, password } = req.body;

            // Validation
            if (!npp || !password) {
                throw {
                    status: 400,
                    message: "Bad Request: NPP and password are required"
                };
            }

            // Find employee
            const employee = this.db.get('employee').find({ npp }).value();

            if (!employee) {
                throw {
                    status: 404,
                    message: "Employee not found"
                };
            }

            if (!employee.is_active) {
                throw {
                    status: 403,
                    message: "Employee account is inactive"
                };
            }

            // Check password
            const isValidPassword = employee.password_hash === `hash$${password}`;

            if (!isValidPassword) {
                throw {
                    status: 401,
                    message: "NPP or password incorrect"
                };
            }

            // Get full employee data
            const employeeFullData = this.getEmployeeFullData(employee.employee_id);

            // Generate token
            const secret = process.env.JWT_SECRET || 'your-secret-key';
            const access_token = jwt.sign({
                id: employee.employee_id,
                email: employee.email,
                npp: employee.npp,
                role: 'employee',
                role_code: employeeFullData.role_details?.role_code,
                division_code: employeeFullData.division_details?.division_code
            }, secret);

            res.status(200).json({
                message: "Login Success",
                access_token: "Bearer " + access_token,
                data: employeeFullData
            });

        } catch (error) {
            next(error);
        }
    }

    async getAllCustomers(req, res, next) {
        try {
            const customers = this.db.get('customer')
                .map(customer => {
                    const { password_hash, ...safeCustomer } = customer;
                    return safeCustomer;
                })
                .value();

            res.status(200).json({
                message: 'Success get all customers',
                data: customers
            });

        } catch (error) {
            next(error);
        }
    }

    async getAllEmployees(req, res, next) {
        try {
            const employees = this.db.get('employee')
                .filter({ is_active: true })
                .map(employee => {
                    const { password_hash, ...safeEmployee } = employee;
                    return safeEmployee;
                })
                .value();

            res.status(200).json({
                message: 'Success get all employees',
                data: employees
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;
