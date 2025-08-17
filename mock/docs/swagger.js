const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'B-Care API',
        version: '1.0.0',
        description: 'Contract-first backend for B-Care Customer Care System',
        contact: {
        name: 'Tim Backend B-Care',
        email: 'alfitobramoda@gmail.com'
        }
    },
    servers: [
        {
        url: 'https://4af813bf189d.ngrok-free.app/v1',
        description: 'Development server',
        },
        {
        url: 'https://4af813bf189d.ngrok-free.app/v1',
        description: 'Ngrok tunnel',
        },
    ],
    components: {
        securitySchemes: {
        bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
        },
        },
        schemas: {
        // Auth Schemas
        CustomerLoginRequest: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
            email: {
                type: 'string',
                format: 'email',
                example: 'andi.saputra@example.com'
            },
            password: {
                type: 'string',
                example: 'andi'
            }
            }
        },
        EmployeeLoginRequest: {
            type: 'object',
            required: ['npp', 'password'],
            properties: {
            npp: {
                type: 'string',
                example: 'EMP00001'
            },
            password: {
                type: 'string',
                example: 'budi'
            }
            }
        },
        RefreshTokenRequest: {
            type: 'object',
            required: ['refresh_token'],
            properties: {
            refresh_token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
            }
        },
        CustomerLoginResponse: {
            type: 'object',
            properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'Login successful'
            },
            access_token: {
                type: 'string',
                example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            refresh_token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            token_type: {
                type: 'string',
                example: 'Bearer'
            },
            expires_in: {
                type: 'integer',
                example: 900
            },
            data: {
                type: 'object',
                properties: {
                id: {
                    type: 'integer',
                    example: 1
                },
                full_name: {
                    type: 'string',
                    example: 'Andi Saputra'
                },
                role: {
                    type: 'string',
                    example: 'customer'
                },
                email: {
                    type: 'string',
                    example: 'andi.saputra@example.com'
                }
                }
            }
            }
        },
        EmployeeLoginResponse: {
            type: 'object',
            properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'Login successful'
            },
            access_token: {
                type: 'string',
                example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            refresh_token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            token_type: {
                type: 'string',
                example: 'Bearer'
            },
            expires_in: {
                type: 'integer',
                example: 900
            },
            data: {
                type: 'object',
                properties: {
                id: {
                    type: 'integer',
                    example: 1
                },
                full_name: {
                    type: 'string',
                    example: 'Budi Hartono'
                },
                npp: {
                    type: 'string',
                    example: 'EMP00001'
                },
                role: {
                    type: 'string',
                    example: 'employee'
                },
                email: {
                    type: 'string',
                    example: 'budi.hartono@example.com'
                }
                }
            }
            }
        },
        RefreshTokenResponse: {
            type: 'object',
            properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'Token refreshed successfully'
            },
            access_token: {
                type: 'string',
                example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            token_type: {
                type: 'string',
                example: 'Bearer'
            },
            expires_in: {
                type: 'integer',
                example: 900
            }
            }
        },
        CurrentUserResponse: {
            type: 'object',
            properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'User data retrieved successfully'
            },
            data: {
                type: 'object',
                properties: {
                id: {
                    type: 'integer',
                    example: 1
                },
                role: {
                    type: 'string',
                    example: 'customer'
                },
                email: {
                    type: 'string',
                    example: 'andi.saputra@example.com'
                },
                token_info: {
                    type: 'object',
                    properties: {
                    issued_at: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-01-15T10:30:00.000Z'
                    },
                    expires_at: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-01-15T10:45:00.000Z'
                    }
                    }
                },
                full_name: {
                    type: 'string',
                    example: 'Andi Saputra'
                },
                address: {
                    type: 'string',
                    example: 'Jl. Merdeka No. 10, Jakarta'
                },
                phone_number: {
                    type: 'string',
                    example: '081234567890'
                },
                gender_type: {
                    type: 'string',
                    example: 'Male'
                },
                place_of_birth: {
                    type: 'string',
                    example: 'Jakarta'
                },
                accounts: {
                    type: 'array',
                    items: {
                    type: 'object'
                    }
                },
                tickets: {
                    type: 'array',
                    items: {
                    type: 'object'
                    }
                }
                }
            }
            }
        },
        LogoutResponse: {
            type: 'object',
            properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'Logout successful'
            }
            }
        },
        // Ticket Schemas
        CreateTicketRequest: {
            type: 'object',
            required: ['description', 'issue_channel_id', 'complaint_id'],
            properties: {
            description: {
                type: 'string',
                example: 'Kartu ATM saya tertelan di mesin ATM BNI Sudirman',
                description: 'Detailed description of the issue'
            },
            transaction_date: {
                type: 'string',
                format: 'date-time',
                example: '2025-01-15T14:30:00Z',
                description: 'Date and time when the issue occurred (optional)'
            },
            amount: {
                type: 'number',
                format: 'decimal',
                example: 500000,
                description: 'Transaction amount if applicable (optional)'
            },
            issue_channel_id: {
                type: 'integer',
                example: 1,
                description: 'Channel where issue occurred (1=ATM, 2=Internet Banking, etc.)'
            },
            complaint_id: {
                type: 'integer',
                example: 1,
                description: 'Complaint category ID'
            },
            related_account_id: {
                type: 'integer',
                example: 1,
                description: 'Related account ID (optional)'
            },
            related_card_id: {
                type: 'integer',
                example: 1,
                description: 'Related card ID (optional)'
            },
            terminal_id: {
                type: 'integer',
                example: 1,
                description: 'Terminal ID where issue occurred (optional)'
            },
            intake_source_id: {
                type: 'integer',
                example: 1,
                description: 'Source of ticket intake (optional)'
            }
            }
        },
        CreateTicketResponse: {
            type: 'object',
            properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'Ticket created successfully'
            },
            data: {
                type: 'object',
                properties: {
                ticket_id: {
                    type: 'integer',
                    example: 101
                },
                ticket_number: {
                    type: 'string',
                    example: 'BNI-20250115001'
                },
                description: {
                    type: 'string',
                    example: 'Kartu ATM saya tertelan di mesin ATM BNI Sudirman'
                },
                customer_status: {
                    type: 'object',
                    properties: {
                    customer_status_id: { type: 'integer', example: 1 },
                    customer_status_name: { type: 'string', example: 'Open' },
                    customer_status_code: { type: 'string', example: 'OPEN' }
                    }
                },
                issue_channel: {
                    type: 'object',
                    properties: {
                    channel_id: { type: 'integer', example: 1 },
                    channel_name: { type: 'string', example: 'Automated Teller Machine' },
                    channel_code: { type: 'string', example: 'ATM' }
                    }
                },
                complaint: {
                    type: 'object',
                    properties: {
                    complaint_id: { type: 'integer', example: 1 },
                    complaint_name: { type: 'string', example: 'Card Swallowed' },
                    complaint_code: { type: 'string', example: 'CARD_SWALLOWED' }
                    }
                },
                created_time: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-01-15T10:30:00.000Z'
                },
                sla_info: {
                    type: 'object',
                    properties: {
                    committed_due_at: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-01-16T10:30:00.000Z'
                    },
                    sla_hours: {
                        type: 'integer',
                        example: 24
                    }
                    }
                }
                }
            }
            }
        },
        TicketListResponse: {
            type: 'object',
            properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'Tickets retrieved successfully'
            },
            data: {
                type: 'array',
                items: {
                type: 'object'
                },
                description: 'Array of tickets (structure depends on user role)'
            },
            pagination: {
                type: 'object',
                properties: {
                total: { type: 'integer', example: 150, description: 'Total number of tickets' },
                limit: { type: 'integer', example: 10, description: 'Number of items per page' },
                offset: { type: 'integer', example: 0, description: 'Starting position' },
                pages: { type: 'integer', example: 15, description: 'Total number of pages' }
                },
                description: 'Pagination information'
            }
            }
        },
        TicketCustomerResponse: {
            type: 'object',
            properties: {
            ticket_id: {
                type: 'integer',
                example: 1
            },
            ticket_number: {
                type: 'string',
                example: 'BNI-00001'
            },
            description: {
                type: 'string',
                example: 'Kartu nasabah tertelan di ATM'
            },
            customer_status: {
                type: 'string',
                example: 'Accepted'
            },
            issue_channel: {
                type: 'string',
                example: 'Automated Teller Machine'
            },
            complaint: {
                type: 'string',
                example: '2nd Chargeback'
            },
            created_time: {
                type: 'string',
                format: 'date-time',
                example: '2025-08-14T08:15:00Z'
            }
            }
        },
        // Error Schemas
        ErrorResponse: {
            type: 'object',
            properties: {
            success: {
                type: 'boolean',
                example: false
            },
            message: {
                type: 'string',
                example: 'Error message'
            }
            }
        }
        }
    },
    tags: [
        {
        name: 'Authentication',
        description: 'User authentication endpoints'
        },
        {
        name: 'Tickets',
        description: 'Ticket management endpoints'
        }
    ]
    };

    const swaggerPaths = {
    '/auth/login/customer': {
        post: {
        tags: ['Authentication'],
        summary: 'Customer login',
        description: 'Authenticate customer with email and password. Returns access token, refresh token, and customer data.',
        requestBody: {
            required: true,
            content: {
            'application/json': {
                schema: {
                $ref: '#/components/schemas/CustomerLoginRequest'
                }
            }
            }
        },
        responses: {
            200: {
            description: 'Login successful',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/CustomerLoginResponse'
                }
                }
            }
            },
            400: {
            description: 'Bad request - Invalid input or email format',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            401: {
            description: 'Unauthorized - Invalid credentials',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            404: {
            description: 'Customer not found',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            }
        }
        }
    },
    '/auth/login/employee': {
        post: {
        tags: ['Authentication'],
        summary: 'Employee login',
        description: 'Authenticate employee with NPP and password. Returns access token, refresh token, and employee data.',
        requestBody: {
            required: true,
            content: {
            'application/json': {
                schema: {
                $ref: '#/components/schemas/EmployeeLoginRequest'
                }
            }
            }
        },
        responses: {
            200: {
            description: 'Login successful',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/EmployeeLoginResponse'
                }
                }
            }
            },
            400: {
            description: 'Bad request - NPP and password required',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            401: {
            description: 'Invalid credentials',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            403: {
            description: 'Account inactive',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            404: {
            description: 'Employee not found',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            }
        }
        }
    },
    '/auth/logout': {
        post: {
        tags: ['Authentication'],
        summary: 'User logout',
        description: 'Logout current user (both customer and employee). Invalidates the current session.',
        security: [
            {
            bearerAuth: []
            }
        ],
        responses: {
            200: {
            description: 'Logout successful',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/LogoutResponse'
                }
                }
            }
            },
            401: {
            description: 'Unauthorized - Invalid or missing token',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            }
        }
        }
    },
    '/auth/me': {
        get: {
        tags: ['Authentication'],
        summary: 'Get current user',
        description: 'Get current authenticated user information (customer or employee) with full profile data.',
        security: [
            {
            bearerAuth: []
            }
        ],
        responses: {
            200: {
            description: 'User data retrieved successfully',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/CurrentUserResponse'
                }
                }
            }
            },
            401: {
            description: 'Unauthorized - Invalid or expired token',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            404: {
            description: 'User not found',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            }
        }
        }
    },
    '/auth/refresh': {
        post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description: 'Generate new access token using refresh token. Extends user session without re-login.',
        requestBody: {
            required: true,
            content: {
            'application/json': {
                schema: {
                $ref: '#/components/schemas/RefreshTokenRequest'
                }
            }
            }
        },
        responses: {
            200: {
            description: 'Token refreshed successfully',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/RefreshTokenResponse'
                }
                }
            }
            },
            400: {
            description: 'Bad request - Refresh token required',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            401: {
            description: 'Invalid or expired refresh token',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            }
        }
        }
    },

    '/tickets': {
        get: {
        tags: ['Tickets'],
        summary: 'Get tickets list with filters',
        description: 'Retrieve tickets with comprehensive filtering and pagination. Response structure depends on user role (customer sees limited data, employee sees full data).',
        security: [
            {
            bearerAuth: []
            }
        ],
        parameters: [
            {
            in: 'query',
            name: 'limit',
            schema: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 10
            },
            description: 'Number of tickets per page (1-100)'
            },
            {
            in: 'query',
            name: 'offset',
            schema: {
                type: 'integer',
                minimum: 0,
                default: 0
            },
            description: 'Starting position for pagination (0-based)'
            },
            {
            in: 'query',
            name: 'status',
            schema: {
                type: 'string',
                enum: ['ACC', 'VERIF', 'PROCESS', 'CLOSED', 'DECLINED', 'OPEN', 'HANDLEDCXC', 'ESCALATED']
            },
            description: 'Filter by ticket status code. Customer Status: ACC (Accepted), VERIF (Verification), PROCESS (Processing), CLOSED (Closed), DECLINED (Declined). Employee Status: OPEN (Open), HANDLEDCXC (Handled by CxC), ESCALATED (Escalated), CLOSED (Closed), DECLINED (Declined)'
            },
            {
            in: 'query',
            name: 'customer_id',
            schema: {
                type: 'integer'
            },
            description: 'Filter by customer ID (employee only - customers automatically see only their tickets)'
            },
            {
            in: 'query',
            name: 'employee_id',
            schema: {
                type: 'integer'
            },
            description: 'Filter by assigned employee ID (employee only)'
            },
            {
            in: 'query',
            name: 'priority',
            schema: {
                type: 'string',
                enum: ['CRITICAL', 'HIGH', 'REGULAR']
            },
            description: 'Filter by priority level. Values: CRITICAL (Critical), HIGH (High), REGULAR (Regular)'
            },
            {
            in: 'query',
            name: 'channel_id',
            schema: {
                type: 'integer'
            },
            description: 'Filter by issue channel ID (1=ATM, 2=Internet Banking, 3=Mobile Banking, etc.)'
            },
            {
            in: 'query',
            name: 'complaint_id',
            schema: {
                type: 'integer'
            },
            description: 'Filter by complaint category ID'
            },
            {
            in: 'query',
            name: 'date_from',
            schema: {
                type: 'string',
                format: 'date'
            },
            description: 'Filter tickets created from this date (YYYY-MM-DD format)'
            },
            {
            in: 'query',
            name: 'date_to',
            schema: {
                type: 'string',
                format: 'date'
            },
            description: 'Filter tickets created until this date (YYYY-MM-DD format)'
            },
            {
            in: 'query',
            name: 'search',
            schema: {
                type: 'string'
            },
            description: 'Search in ticket description and ticket number (case-insensitive)'
            }
        ],
        responses: {
            200: {
            description: 'Tickets retrieved successfully',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/TicketListResponse'
                }
                }
            }
            },
            401: {
            description: 'Unauthorized - Valid token required',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            400: {
            description: 'Bad Request - Invalid query parameters',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            }
        }
        },
        post: {
        tags: ['Tickets'],
        summary: 'Create new ticket',
        description: 'Create a new support ticket. Only customers can create tickets. The system automatically resolves SLA and routing based on complaint category and channel.',
        security: [
            {
            bearerAuth: []
            }
        ],
        requestBody: {
            required: true,
            content: {
            'application/json': {
                schema: {
                $ref: '#/components/schemas/CreateTicketRequest'
                }
            }
            }
        },
        responses: {
            201: {
            description: 'Ticket created successfully',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/CreateTicketResponse'
                }
                }
            }
            },
            400: {
            description: 'Bad request - Missing required fields or invalid references',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            401: {
            description: 'Unauthorized - Valid token required',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            403: {
            description: 'Forbidden - Only customers can create tickets',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            404: {
            description: 'Customer not found',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            }
        }
        }
    },
    '/tickets/{id}': {
        get: {
        tags: ['Tickets'],
        summary: 'Get ticket by ID',
        description: 'Retrieve detailed ticket information by ID with all related data (activities, attachments, feedback). Response structure depends on user role.',
        security: [
            {
            bearerAuth: []
            }
        ],
        parameters: [
            {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
                type: 'integer'
            },
            description: 'Ticket ID'
            }
        ],
        responses: {
            200: {
            description: 'Ticket retrieved successfully',
            content: {
                'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                    success: {
                        type: 'boolean',
                        example: true
                    },
                    message: {
                        type: 'string',
                        example: 'Ticket retrieved successfully'
                    },
                    data: {
                        type: 'object',
                        description: 'Detailed ticket data with all relations (structure varies by user role)'
                    }
                    }
                }
                }
            }
            },
            404: {
            description: 'Ticket not found',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            403: {
            description: 'Access denied - Customer can only access their own tickets',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            401: {
            description: 'Unauthorized - Valid token required',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            }
        }
        }
    }
};

const swaggerSpec = {
    ...swaggerDefinition,
    paths: swaggerPaths
};

module.exports = {
    swaggerSpec,
    swaggerUi
};
