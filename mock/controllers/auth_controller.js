const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const crypto = require('crypto');
const { HTTP_STATUS } = require('../constants/statusCodes');

class AuthController {
    constructor(db) {
        this.db = db;

        // Load security config from environment
        this.jwtConfig = {
            secret: process.env.JWT_SECRET,
            refreshSecret: process.env.JWT_REFRESH_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN || '60m',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
            issuer: process.env.JWT_ISSUER || 'bcare-api',
            audience: process.env.JWT_AUDIENCE || 'bcare-client'
        };
        
        this.bcryptRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    }

    static createInstance(db) {
        return new AuthController(db);
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
                this.db.get('customer')
                    .find({ customer_id: userId })
                    .assign({ password_hash: bcryptHash })
                    .write();
            }
            else if(userType === 'employee') {
                this.db.get('employee')
                    .find({ employee_id: userId })
                    .assign({ password_hash: bcryptHash })
                    .write();
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
                throw { status: HTTP_STATUS.BAD_REQUEST, message: "Refresh token is required" };
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

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Token refreshed successfully",
                access_token: "Bearer " + accessToken,
                token_type: "Bearer",
                expires_in: this.parseExpirationTime(this.jwtConfig.expiresIn)
            });

        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                error.status = HTTP_STATUS.UNAUTHORIZED;
                error.message = 'Invalid or expired refresh token';
            }
            next(error);
        }
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
                    status: HTTP_STATUS.BAD_REQUEST,
                    message: "Bad Request: Email and password are required"
                };
            }

            if (!validator.isEmail(email)) {
                throw {
                    status: HTTP_STATUS.BAD_REQUEST,
                    message: "Bad Request: Invalid email format"
                };
            }

            // Find customer
            const customer = this.db.get('customer').find({ email }).value();

            if (!customer) {
                throw {
                    status: HTTP_STATUS.NOT_FOUND,
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
                    status: HTTP_STATUS.UNAUTHORIZED,
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

            res.status(HTTP_STATUS.OK).json({
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
                    status: HTTP_STATUS.BAD_REQUEST,
                    message: "Bad Request: NPP and password are required"
                };
            }

            // Find employee
            const employee = this.db.get('employee').find({ npp }).value();

            if (!employee) {
                throw {
                    status: HTTP_STATUS.NOT_FOUND,
                    message: "Employee not found"
                };
            }

            if (!employee.is_active) {
                throw {
                    status: HTTP_STATUS.FORBIDDEN,
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
                    status: HTTP_STATUS.UNAUTHORIZED,
                    message: "NPP or password incorrect"
                };
            }

            // Get role and division data
            const role = this.db.get('role').find({ role_id: employee.role_id }).value();
            const division = this.db.get('division').find({ division_id: employee.division_id }).value();

            // Enhanced token generation with role_id and division_id
            const tokenPayload = {
                id: employee.employee_id,
                email: employee.email,
                npp: employee.npp,
                role: 'employee',
                role_id: employee.role_id,
                division_id: employee.division_id,
                role_code: role?.role_code,
                division_code: division?.division_code,
                iat: Math.floor(Date.now() / 1000)
            };

            const { accessToken, refreshToken } = this.generateToken(tokenPayload);

            // Security logging
            if (process.env.ENABLE_SECURITY_LOGGING === 'true') {
                console.log(`🔐 Employee login successful: ${npp}`);
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Login successful",
                access_token: "Bearer " + accessToken,
                refresh_token: refreshToken,
                token_type: "Bearer",
                expires_in: this.parseExpirationTime(this.jwtConfig.expiresIn),
                data: {
                    full_name: employee.full_name,
                    role: role?.role_name,
                    division_code: division?.division_code,
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
            // Security logging using middleware-provided user data
            if (process.env.ENABLE_SECURITY_LOGGING === 'true') {
                const user = req.user;
                let userIdentifier;
                if (user.role === 'customer') {
                    userIdentifier = user.email;
                } else if (user.role === 'employee') {
                    userIdentifier = `${user.npp} (${user.email})`;
                } else {
                    userIdentifier = user.email || user.id;
                }
                
                console.log(`🔐 User logout: ${userIdentifier} (${user.role})`);
            }

            res.status(HTTP_STATUS.OK).json({
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
            // Use middleware-provided user data
            const user = req.user;

            let userData;
            
            if (user.role === 'customer') {
                userData = this.getCustomerFullData(user.id);
            } else if (user.role === 'employee') {
                userData = this.getEmployeeFullData(user.id);
            }

            if (!userData) {
                throw { status: HTTP_STATUS.NOT_FOUND, message: "User not found" };
            }

            // Enhanced response with proper user identification
            const userInfo = {
                id: user.id,
                role: user.role,
                email: user.email,
                token_info: {
                    issued_at: new Date(user.iat * 1000).toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T') + '.000Z',
                    expires_at: new Date(user.exp * 1000).toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T') + '.000Z'
                }
            };

            // Add role-specific info
            if (user.role === 'employee') {
                userInfo.npp = user.npp;
                userInfo.role_id = user.role_id;
                userInfo.division_id = user.division_id;
                userInfo.role_code = user.role_code;
                userInfo.division_code = user.division_code;
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "User data retrieved successfully",
                data: {
                    ...userInfo,
                    ...userData
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;
