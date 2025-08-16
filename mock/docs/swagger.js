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
                example: 'bud1'
            }
            }
        },
        LoginResponse: {
            type: 'object',
            properties: {
            message: {
                type: 'string',
                example: 'Login Success'
            },
            access_token: {
                type: 'string',
                example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            data: {
                type: 'object'
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
        description: 'Authenticate customer with email and password',
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
                    $ref: '#/components/schemas/LoginResponse'
                }
                }
            }
            },
            400: {
            description: 'Bad request - Invalid input',
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
        description: 'Authenticate employee with NPP and password',
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
                    $ref: '#/components/schemas/LoginResponse'
                }
                }
            }
            },
            400: {
            description: 'Bad request',
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
