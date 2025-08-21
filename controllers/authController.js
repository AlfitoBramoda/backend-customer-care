// controllers/authController.js - Fix the import
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const db = require('../models');

// Use lowercase model names (as they actually exist)
const { 
    customer: Customer,           // rename to PascalCase
    employee: Employee, 
    account: Account, 
    card: Card, 
    ticket: Ticket, 
    account_type: AccountType, 
    card_status: CardStatus,
    customer_status: CustomerStatus,
    channel: Channel,
    complaint_category: ComplaintCategory,
    role: Role,
    division: Division
} = db;

console.log('Customer after fix:', Customer);
console.log('Customer.findOne method exists:', typeof Customer?.findOne);

class AuthController {
    constructor() {
        // Load security config from environment
        this.jwtConfig = {
            secret: process.env.JWT_SECRET,
            refreshSecret: process.env.JWT_REFRESH_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN || '15m',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
            issuer: process.env.JWT_ISSUER || 'bcare-api',
            audience: process.env.JWT_AUDIENCE || 'bcare-client'
        };
        
        this.bcryptRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    }

    static createInstance() {
        return new AuthController();
    }

    // Enhanced password hashing with environment config
    async hashPassword(password) {
        return await bcrypt.hash(password, this.bcryptRounds);
    }

    async verifyPassword(plainPassword, storedHash, userId, userType) {
        let isValid = false;
        let needsUpgrade = false;

        if(storedHash.startsWith('hash$')) {
            const oldPlainText = storedHash.substring(5);
            isValid = oldPlainText === plainPassword;
            needsUpgrade = true;
        }
        else {
            isValid = await bcrypt.compare(plainPassword, storedHash);
            needsUpgrade = false;
        }

        if(isValid && needsUpgrade) {
            await this.upgradePasswordToBcrypt(userId, plainPassword, userType);
        }

        return isValid;
    }

    async upgradePasswordToBcrypt(userId, plainPassword, userType) {
        try {
            const bcryptHash = await this.hashPassword(plainPassword);

            if(userType === 'customer') {
                await Customer.update(
                    { password_hash: bcryptHash },
                    { where: { customer_id: userId } }
                );
            }
            else if(userType === 'employee') {
                await Employee.update(
                    { password_hash: bcryptHash },
                    { where: { employee_id: userId } }
                );
            }

            if (process.env.ENABLE_SECURITY_LOGGING === 'true') {
                console.log(`🔐 Password upgraded to bcrypt for ${userType} ID: ${userId}`);
            }
        } catch (error) {
            console.error(`❌ Failed to upgrade password for ${userType} ID: ${userId}`, error);
        }
    }

    generateToken(payload) {
        const accessToken = jwt.sign(payload, this.jwtConfig.secret, {
            expiresIn: this.jwtConfig.expiresIn,
            issuer: this.jwtConfig.issuer,
            audience: this.jwtConfig.audience,
            algorithm: 'HS256'
        });

        const refreshToken = jwt.sign(
            { ...payload, type: 'refresh' },
            this.jwtConfig.refreshSecret,
            {
                expiresIn: this.jwtConfig.refreshExpiresIn,
                issuer: this.jwtConfig.issuer,
                audience: this.jwtConfig.audience,
                algorithm: 'HS256'
            }
        );

        return { accessToken, refreshToken };
    }

    verifyToken(token, type = 'access') {
        const secret = type === 'refresh' ? this.jwtConfig.refreshSecret : this.jwtConfig.secret;

        return jwt.verify(token, secret, {
            issuer: this.jwtConfig.issuer,
            audience: this.jwtConfig.audience,
            algorithms: ['HS256']
        });
    }

    // Refresh Token Method
    async refreshToken(req, res, next) {
        try {
            const { refresh_token } = req.body;
            
            if (!refresh_token) {
                throw { status: 400, message: "Refresh token is required" };
            }

            // Remove 'Bearer ' prefix if exists
            const token = refresh_token.startsWith('Bearer ') ? 
                refresh_token.substring(7) : refresh_token;

            // Verify refresh token
            const decoded = this.verifyToken(token, 'refresh');

            // Generate new access token
            const newTokenPayload = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                iat: Math.floor(Date.now() / 1000)
            };

            // Add role-specific data
            if (decoded.role === 'employee') {
                newTokenPayload.npp = decoded.npp;
                newTokenPayload.role_id = decoded.role_id;
                newTokenPayload.division_id = decoded.division_id;
                newTokenPayload.role_code = decoded.role_code;
                newTokenPayload.division_code = decoded.division_code;
            }

            const { accessToken } = this.generateToken(newTokenPayload);

            // Security logging
            if (process.env.ENABLE_SECURITY_LOGGING === 'true') {
                console.log(`🔄 Token refreshed for: ${decoded.email} (${decoded.role})`);
            }

            res.status(200).json({
                success: true,
                message: "Token refreshed successfully",
                access_token: "Bearer " + accessToken,
                token_type: "Bearer",
                expires_in: this.parseExpirationTime(this.jwtConfig.expiresIn)
            });

        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                error.status = 401;
                error.message = 'Invalid or expired refresh token';
            }
            next(error);
        }
    }

    async getCustomerFullData(customerId) {
        const customer = await Customer.findOne({
            where: { customer_id: customerId }
        });

        if (!customer) return null;

        const accounts = await Account.findAll({
            where: { customer_id: customerId },
            include: [
                {
                    model: AccountType,
                    as: 'account_type'
                },
                {
                    model: Card,
                    as: 'cards',
                    include: [
                        {
                            model: CardStatus,
                            as: 'card_status'
                        }
                    ]
                }
            ]
        });

        // Get tickets for this customer
        const tickets = await Ticket.findAll({
            where: { customer_id: customerId },
            include: [
                {
                    model: CustomerStatus,
                    as: 'customer_status'
                },
                {
                    model: Channel,
                    as: 'issue_channel'
                },
                {
                    model: Account,
                    as: 'related_account'
                },
                {
                    model: Card,
                    as: 'related_card'
                },
                {
                    model: ComplaintCategory,
                    as: 'complaint_category'
                }
            ]
        });

        const enrichedTickets = tickets.map(ticket => ({
            ticket_id: ticket.ticket_id,
            ticket_number: ticket.ticket_number,
            customer_status: ticket.customer_status?.customer_status_name || null,
            issue_channel: ticket.issue_channel?.channel_name || null,
            related_account: ticket.related_account ? {
                account_id: ticket.related_account.account_id,
                account_number: ticket.related_account.account_number
            } : null,
            related_card: ticket.related_card ? {
                card_id: ticket.related_card.card_id,
                card_number: ticket.related_card.card_number,
                card_type: ticket.related_card.card_type
            } : null,
            complaint: ticket.complaint_category?.complaint_name || null,
            created_time: ticket.created_time,
        }));

        // Return only specific customer fields
        return {
            full_name: customer.full_name,
            email: customer.email,
            address: customer.address,
            phone_number: customer.phone_number,
            gender_type: customer.gender_type,
            place_of_birth: customer.place_of_birth,
            accounts: accounts || [],
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

            // Find customer using Sequelize
            const customer = await Customer.findOne({
                where: { email: email }
            });

            if (!customer) {
                throw {
                    status: 404,
                    message: "Customer not found"
                };
            }

            // Enhanced password verification with auto-upgrade
            const isValidPassword = await this.verifyPassword(
                password, 
                customer.password_hash, 
                customer.customer_id, 
                'customer'
            );

            if (!isValidPassword) {
                throw {
                    status: 401,
                    message: "Email or password incorrect"
                };
            }

            // Enhanced token generation
            const tokenPayload = {
                id: customer.customer_id,
                email: customer.email,
                role: 'customer',
                iat: Math.floor(Date.now() / 1000)
            };

            const { accessToken, refreshToken } = this.generateToken(tokenPayload);

            // Security logging
            if (process.env.ENABLE_SECURITY_LOGGING === 'true') {
                console.log(`🔐 Customer login successful: ${email}`);
            }

            res.status(200).json({
                success: true,
                message: "Login successful",
                access_token: "Bearer " + accessToken,
                refresh_token: refreshToken,
                token_type: "Bearer",
                expires_in: this.parseExpirationTime(this.jwtConfig.expiresIn),
                data: {
                    full_name: customer.full_name,
                    role: 'customer',
                    email: customer.email,
                }
            });

        } catch (error) {
            // Security logging for failed attempts
            if (process.env.ENABLE_SECURITY_LOGGING === 'true') {
                console.log(`🚨 Customer login failed: ${req.body.email || 'unknown'}`);
            }
            next(error);
        }
    }

    async getEmployeeFullData(employeeId) {
        const employee = await Employee.findOne({
            where: { employee_id: employeeId },
            include: [
                {
                    model: Role,
                    as: 'role'
                },
                {
                    model: Division,
                    as: 'division'
                }
            ]
        });

        if (!employee) return null;

        // Get tickets handled by this employee
        const tickets = await Ticket.findAll({
            where: { responsible_employee_id: employeeId }
        });

        // Remove sensitive data
        const { password_hash, ...safeEmployee } = employee.toJSON();

        return {
            ...safeEmployee,
            role_details: employee.role,
            division_details: employee.division,
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

            // Find employee using Sequelize
            const employee = await Employee.findOne({
                where: { npp: npp },
                include: [
                    {
                        model: Role,
                        as: 'role'
                    },
                    {
                        model: Division,
                        as: 'division'
                    }
                ]
            });

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

            // Enhanced password verification with auto-upgrade
            const isValidPassword = await this.verifyPassword(
                password, 
                employee.password_hash, 
                employee.employee_id, 
                'employee'
            );

            if (!isValidPassword) {
                throw {
                    status: 401,
                    message: "NPP or password incorrect"
                };
            }

            // Enhanced token generation with role_id and division_id
            const tokenPayload = {
                id: employee.employee_id,
                email: employee.email,
                npp: employee.npp,
                role: 'employee',
                role_id: employee.role_id,
                division_id: employee.division_id,
                role_code: employee.role?.role_code,
                division_code: employee.division?.division_code,
                iat: Math.floor(Date.now() / 1000)
            };

            const { accessToken, refreshToken } = this.generateToken(tokenPayload);

            // Security logging
            if (process.env.ENABLE_SECURITY_LOGGING === 'true') {
                console.log(`🔐 Employee login successful: ${npp}`);
            }

            res.status(200).json({
                success: true,
                message: "Login successful",
                access_token: "Bearer " + accessToken,
                refresh_token: refreshToken,
                token_type: "Bearer",
                expires_in: this.parseExpirationTime(this.jwtConfig.expiresIn),
                data: {
                    full_name: employee.full_name,
                    role: employee.role?.role_name,
                    division_code: employee.division?.division_code,
                    email: employee.email
                }
            });

        } catch (error) {
            // Security logging for failed attempts
            if (process.env.ENABLE_SECURITY_LOGGING === 'true') {
                console.log(`🚨 Employee login failed: ${req.body.npp || 'unknown'}`);
            }
            next(error);
        }
    }

    // Helper method to parse expiration time
    parseExpirationTime(expiresIn) {
        const unit = expiresIn.slice(-1);
        const value = parseInt(expiresIn.slice(0, -1));
        
        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 3600;
            case 'd': return value * 86400;
            default: return 900; // 15 minutes default
        }
    }

    // Logout Method - Handle both customer & employee
    async logout(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (authHeader && process.env.ENABLE_SECURITY_LOGGING === 'true') {
                try {
                    const token = authHeader.split(' ')[1];
                    const decoded = this.verifyToken(token);
                    
                    // Smart logging based on role
                    let userIdentifier;
                    if (decoded.role === 'customer') {
                        userIdentifier = decoded.email;
                    } else if (decoded.role === 'employee') {
                        userIdentifier = `${decoded.npp} (${decoded.email})`;
                    } else {
                        userIdentifier = decoded.email || decoded.id;
                    }
                    
                    console.log(`🔐 User logout: ${userIdentifier} (${decoded.role})`);
                } catch (error) {
                    // Token invalid, but logout should still succeed
                    console.log(`🔐 User logout: invalid token`);
                }
            }

            res.status(200).json({
                success: true,
                message: "Logout successful"
            });

        } catch (error) {
            next(error);
        }
    }

    // Get Current User Method - Handle both customer & employee
    async getCurrentUser(req, res, next) {
        try {
            const authHeader = req.headers.authorization;

            console.log(authHeader)
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw { status: 401, message: "Authorization token required" };
            }

            const token = authHeader.split(' ')[1];
            const decoded = this.verifyToken(token);

            let userData;
            
            if (decoded.role === 'customer') {
                userData = await this.getCustomerFullData(decoded.id);
            } else if (decoded.role === 'employee') {
                userData = await this.getEmployeeFullData(decoded.id);
            }

            if (!userData) {
                throw { status: 404, message: "User not found" };
            }

            // Enhanced response with proper user identification
            const userInfo = {
                id: decoded.id,
                role: decoded.role,
                email: decoded.email,
                token_info: {
                    issued_at: new Date(decoded.iat * 1000).toISOString(),
                    expires_at: new Date(decoded.exp * 1000).toISOString()
                }
            };

            // Add role-specific info
            if (decoded.role === 'employee') {
                userInfo.npp = decoded.npp;
                userInfo.role_id = decoded.role_id;
                userInfo.division_id = decoded.division_id;
                userInfo.role_code = decoded.role_code;
                userInfo.division_code = decoded.division_code;
            }

            res.status(200).json({
                success: true,
                message: "User data retrieved successfully",
                data: {
                    ...userInfo,
                    ...userData
                }
            });

        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                error.status = 401;
                error.message = 'Invalid or expired token';
            }
            next(error);
        }
    }
}

module.exports = AuthController;