const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'B-Care Mock API',
        version: '1.0.0',
        description: 'Contract-first mock backend for B-Care Customer Care System',
        contact: {
        name: 'Tim Backend B-Care',
        email: 'backend@bcare.com'
        }
    },
    servers: [
        {
        url: 'https://4af813bf189d.ngrok-free.app/v1',
        description: 'Development server',
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
    '/ticket-detail/customer/{ticketId}': {
        get: {
        tags: ['Tickets'],
        summary: 'Get customer ticket detail',
        description: 'Get simplified ticket details for customer (customer can only access their own tickets)',
        security: [
            {
            bearerAuth: []
            }
        ],
        parameters: [
            {
            in: 'path',
            name: 'ticketId',
            required: true,
            schema: {
                type: 'integer',
                example: 1
            },
            description: 'Ticket ID'
            }
        ],
        responses: {
            200: {
            description: 'Ticket details retrieved successfully',
            content: {
                'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                    message: {
                        type: 'string',
                        example: 'Success get ticket details'
                    },
                    data: {
                        $ref: '#/components/schemas/TicketCustomerResponse'
                    }
                    }
                }
                }
            }
            },
            401: {
            description: 'Unauthorized - Token required',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                }
                }
            }
            },
            403: {
            description: 'Access denied - Can only view own tickets',
            content: {
                'application/json': {
                schema: {
                    $ref: '#/components/schemas/ErrorResponse'
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
