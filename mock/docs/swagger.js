const swaggerUi = require('swagger-ui-express');

// === OpenAPI definition (no swagger-jsdoc runtime needed) ===
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'B-Care API',
    version: '1.0.0',
    description: 'Contract-first backend for B-Care Customer Care System',
    contact: { name: 'Tim Backend B-Care', email: 'alfitobramoda@gmail.com' }
  },
  servers: [
    { url: 'https://4af813bf189d.ngrok-free.app/v1', description: 'Development server' },
    { url: 'https://4af813bf189d.ngrok-free.app/v1', description: 'Ngrok tunnel' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      // Auth Schemas
      CustomerLoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'andi.saputra@example.com' },
          password: { type: 'string', example: 'andi' },
        },
      },
      EmployeeLoginRequest: {
        type: 'object',
        required: ['npp', 'password'],
        properties: {
          npp: { type: 'string', example: 'EMP00001' },
          password: { type: 'string', example: 'budi' },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        },
      },
      CustomerLoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          access_token: { type: 'string', example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          token_type: { type: 'string', example: 'Bearer' },
          expires_in: { type: 'integer', example: 900 },
          data: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              full_name: { type: 'string', example: 'Andi Saputra' },
              role: { type: 'string', example: 'customer' },
              email: { type: 'string', example: 'andi.saputra@example.com' },
            },
          },
        },
      },
      EmployeeLoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          access_token: { type: 'string', example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          token_type: { type: 'string', example: 'Bearer' },
          expires_in: { type: 'integer', example: 900 },
          data: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              full_name: { type: 'string', example: 'Budi Hartono' },
              npp: { type: 'string', example: 'EMP00001' },
              role: { type: 'string', example: 'employee' },
              email: { type: 'string', example: 'budi.hartono@example.com' },
            },
          },
        },
      },
      RefreshTokenResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Token refreshed successfully' },
          access_token: { type: 'string', example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          token_type: { type: 'string', example: 'Bearer' },
          expires_in: { type: 'integer', example: 900 },
        },
      },
      CurrentUserResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'User data retrieved successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              role: { type: 'string', example: 'customer' },
              email: { type: 'string', example: 'andi.saputra@example.com' },
              token_info: {
                type: 'object',
                properties: {
                  issued_at: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00.000Z' },
                  expires_at: { type: 'string', format: 'date-time', example: '2025-01-15T10:45:00.000Z' },
                },
              },
              full_name: { type: 'string', example: 'Andi Saputra' },
              address: { type: 'string', example: 'Jl. Merdeka No. 10, Jakarta' },
              phone_number: { type: 'string', example: '081234567890' },
              gender_type: { type: 'string', example: 'Male' },
              place_of_birth: { type: 'string', example: 'Jakarta' },
              accounts: { type: 'array', items: { type: 'object' } },
              tickets: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      LogoutResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Logout successful' },
        },
      },

      // Ticket Schemas
      CreateTicketRequest: {
        type: 'object',
        required: ['description', 'issue_channel_id', 'complaint_id'],
        properties: {
          description: {
            type: 'string',
            example: 'Kartu ATM saya tertelan di mesin ATM BNI Sudirman',
            description: 'Detailed description of the issue',
          },
          transaction_date: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-15T14:30:00Z',
            description: 'Date and time when the issue occurred (optional)',
          },
          amount: {
            type: 'number',
            format: 'float', // <— FIXED (decimal -> float)
            example: 500000,
            description: 'Transaction amount if applicable (optional)',
          },
          issue_channel_id: { type: 'integer', example: 1, description: 'Channel where issue occurred' },
          complaint_id: { type: 'integer', example: 1, description: 'Complaint category ID' },
          related_account_id: { type: 'integer', example: 1, description: 'Related account ID (optional)' },
          related_card_id: { type: 'integer', example: 1, description: 'Related card ID (optional)' },
          terminal_id: { type: 'integer', example: 1, description: 'Terminal ID (optional)' },
          intake_source_id: { type: 'integer', example: 1, description: 'Source of ticket intake (optional)' },
          customer_id: { type: 'integer', example: 1, description: 'Customer ID (for employee flows)' },
        },
      },
      CreateTicketResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Ticket created successfully' },
          data: {
            type: 'object',
            properties: {
              ticket_id: { type: 'integer', example: 101 },
              ticket_number: { type: 'string', example: 'BNI-20250115001' },
              description: { type: 'string', example: 'Kartu ATM saya tertelan di mesin ATM BNI Sudirman' },
              customer_status: {
                type: 'object',
                properties: {
                  customer_status_id: { type: 'integer', example: 1 },
                  customer_status_name: { type: 'string', example: 'Open' },
                  customer_status_code: { type: 'string', example: 'OPEN' },
                },
              },
              issue_channel: {
                type: 'object',
                properties: {
                  channel_id: { type: 'integer', example: 1 },
                  channel_name: { type: 'string', example: 'Automated Teller Machine' },
                  channel_code: { type: 'string', example: 'ATM' },
                },
              },
              complaint: {
                type: 'object',
                properties: {
                  complaint_id: { type: 'integer', example: 1 },
                  complaint_name: { type: 'string', example: 'Card Swallowed' },
                  complaint_code: { type: 'string', example: 'CARD_SWALLOWED' },
                },
              },
              created_time: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00.000Z' },
              sla_info: {
                type: 'object',
                properties: {
                  committed_due_at: { type: 'string', format: 'date-time', example: '2025-01-16T10:30:00.000Z' },
                  sla_hours: { type: 'integer', example: 24 },
                },
              },
            },
          },
        },
      },
      TicketListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Tickets retrieved successfully' },
          data: { type: 'array', items: { type: 'object' }, description: 'Array of tickets' },
          pagination: {
            type: 'object',
            properties: {
              total: { type: 'integer', example: 150 },
              limit: { type: 'integer', example: 10 },
              offset: { type: 'integer', example: 0 },
              pages: { type: 'integer', example: 15 },
            },
            description: 'Pagination information',
          },
        },
      },
      TicketCustomerResponse: {
        type: 'object',
        properties: {
          ticket_id: { type: 'integer', example: 1 },
          ticket_number: { type: 'string', example: 'BNI-00001' },
          description: { type: 'string', example: 'Kartu nasabah tertelan di ATM' },
          customer_status: { type: 'string', example: 'Accepted' },
          issue_channel: { type: 'string', example: 'Automated Teller Machine' },
          complaint: { type: 'string', example: '2nd Chargeback' },
          created_time: { type: 'string', format: 'date-time', example: '2025-08-14T08:15:00Z' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message' },
        },
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'User authentication endpoints' },
    { name: 'Tickets', description: 'Ticket management endpoints' },
  ],
};

const swaggerPaths = {
  '/auth/login/customer': {
    post: {
      tags: ['Authentication'],
      summary: 'Customer login',
      description: 'Authenticate customer with email and password.',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerLoginRequest' } } },
      },
      responses: {
        '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerLoginResponse' } } } },
        '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '404': { description: 'Customer not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/auth/login/employee': {
    post: {
      tags: ['Authentication'],
      summary: 'Employee login',
      description: 'Authenticate employee with NPP and password.',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/EmployeeLoginRequest' } } },
      },
      responses: {
        '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/EmployeeLoginResponse' } } } },
        '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '403': { description: 'Account inactive', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '404': { description: 'Employee not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'User logout',
      description: 'Invalidate current session.',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Logout successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/LogoutResponse' } } } },
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/auth/me': {
    get: {
      tags: ['Authentication'],
      summary: 'Get current user',
      description: 'Return current authenticated user.',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/CurrentUserResponse' } } } },
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '404': { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/auth/refresh': {
    post: {
      tags: ['Authentication'],
      summary: 'Refresh access token',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshTokenRequest' } } },
      },
      responses: {
        '200': { description: 'Token refreshed', content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshTokenResponse' } } } },
        '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '401': { description: 'Invalid/expired refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/tickets': {
    get: {
      tags: ['Tickets'],
      summary: 'Get tickets list with filters',
      description: 'Comprehensive filtering and pagination.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }, description: 'Items per page' },
        { in: 'query', name: 'offset', schema: { type: 'integer', minimum: 0, default: 0 }, description: 'Offset' },
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['ACC', 'VERIF', 'PROCESS', 'CLOSED', 'DECLINED', 'OPEN', 'HANDLEDCXC', 'ESCALATED'] } },
        { in: 'query', name: 'customer_id', schema: { type: 'integer' } },
        { in: 'query', name: 'employee_id', schema: { type: 'integer' } },
        { in: 'query', name: 'priority', schema: { type: 'string', enum: ['CRITICAL', 'HIGH', 'REGULAR'] } },
        { in: 'query', name: 'channel_id', schema: { type: 'integer' } },
        { in: 'query', name: 'complaint_id', schema: { type: 'integer' } },
        { in: 'query', name: 'date_from', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'date_to', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'search', schema: { type: 'string' } },
      ],
      responses: {
        '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/TicketListResponse' } } } },
        '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    post: {
      tags: ['Tickets'],
      summary: 'Create new ticket',
      description: 'Role-based constraints applied.',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTicketRequest' } } } },
      responses: {
        '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTicketResponse' } } } },
        '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '404': { description: 'Customer not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/tickets/{id}': {
    get: {
      tags: ['Tickets'],
      summary: 'Get ticket by ID',
      description: 'Detailed ticket with relations.',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Ticket ID' }],
      responses: {
        '200': {
          description: 'OK',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Ticket retrieved successfully' },
              data: { type: 'object', description: 'Detailed ticket data' },
            },
          } } },
        },
        '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '403': { description: 'Access denied', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    patch: {
      tags: ['Tickets'],
      summary: 'Update ticket (Employee only)',
      description: 'Role-based updatability.',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Ticket ID' }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: {
          type: 'object',
          description: 'Fields vary by employee role',
          properties: {
            description: { type: 'string', example: 'Updated ticket description' },
            customer_status: { type: 'string', enum: ['ACC', 'VERIF', 'PROCESS', 'CLOSED', 'DECLINED'], example: 'PROCESS' },
            employee_status: { type: 'string', enum: ['OPEN', 'HANDLEDCXC', 'ESCALATED', 'CLOSED', 'DECLINED'], example: 'HANDLEDCXC' },
            priority: { type: 'string', enum: ['CRITICAL', 'HIGH', 'REGULAR'], example: 'HIGH' },
            responsible_employee_id: { type: 'integer', example: 2 },
            division_notes: { type: 'string', example: 'Escalated to technical team for further investigation' },
            transaction_date: { type: 'string', format: 'date-time', example: '2025-01-15T14:30:00Z' },
            amount: { type: 'number', format: 'float', example: 750000 }, // <— FIXED
            related_account_id: { type: 'integer', example: 2 },
            related_card_id: { type: 'integer', example: 2 },
            terminal_id: { type: 'integer', example: 2 },
          },
        } } },
      },
      responses: {
        '200': {
          description: 'Updated',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Ticket updated successfully' },
              data: { type: 'object', description: 'Updated ticket data' },
            },
          } } },
        },
        '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    delete: {
      tags: ['Tickets'],
      summary: 'Delete ticket (CXC Employee only)',
      description: 'Soft delete ticket - only CXC employees (role_id=1, division_id=1) can delete tickets.',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Ticket ID' }],
      responses: {
        '200': {
          description: 'Ticket deleted successfully',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Ticket deleted successfully' },
              data: {
                type: 'object',
                properties: {
                  ticket_id: { type: 'integer', example: 1 },
                  ticket_number: { type: 'string', example: 'BNI-20250115001' },
                  deleted_at: { type: 'string', format: 'date-time', example: '2025-01-15T15:30:00Z' },
                  deleted_by: { type: 'integer', example: 2 },
                },
              },
            },
          } } },
        },
        '400': { description: 'Bad request - Cannot delete closed ticket', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '403': { description: 'Forbidden - Only CXC employees allowed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '404': { description: 'Ticket not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '409': { description: 'Conflict - Ticket already deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },
};

const swaggerSpec = { ...swaggerDefinition, paths: swaggerPaths };

module.exports = { swaggerSpec, swaggerUi };
