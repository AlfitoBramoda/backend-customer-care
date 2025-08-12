// docs/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'BNI Customer Support API',
      version: '1.0.0',
      description: 'Complete API documentation for BNI Customer Support System - BE1 Identity & Directory',
      contact: {
        name: 'BNI API Team',
        email: 'api-team@bni.co.id'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.bni.co.id/customer-support/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // Success Response Schema
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-08-12T03:34:27.502Z'
            }
          }
        },
        
        // Error Response Schema
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  example: 'Invalid input data'
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-08-12T03:34:27.502Z'
            }
          }
        },

        // Customer Schema
        Customer: {
          type: 'object',
          properties: {
            customer_id: {
              type: 'string',
              example: '1'
            },
            full_name: {
              type: 'string',
              example: 'John Customer'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@email.com'
            },
            phone_number: {
              type: 'string',
              example: '+6281234567890'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            },
            accounts: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Account'
              }
            }
          }
        },

        // Agent Schema
        Agent: {
          type: 'object',
          properties: {
            agent_id: {
              type: 'integer',
              example: 1
            },
            full_name: {
              type: 'string',
              example: 'Agent Smith'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'agent.smith@bni.co.id'
            },
            role: {
              type: 'string',
              enum: ['Frontline', 'Back Office', 'Manajer', 'QA'],
              example: 'Frontline'
            },
            team_id: {
              type: 'integer',
              example: 1
            },
            is_active: {
              type: 'boolean',
              example: true
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            },
            team: {
              $ref: '#/components/schemas/Team'
            }
          }
        },

        // Team Schema
        Team: {
          type: 'object',
          properties: {
            team_id: {
              type: 'integer',
              example: 1
            },
            team_name: {
              type: 'string',
              example: 'Customer Service Team 1'
            },
            description: {
              type: 'string',
              example: 'Primary customer service team for general inquiries'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            },
            agents: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Agent'
              }
            }
          }
        },

        // Account Schema
        Account: {
          type: 'object',
          properties: {
            account_id: {
              type: 'string',
              example: '1'
            },
            customer_id: {
              type: 'string',
              example: '1'
            },
            account_number: {
              type: 'string',
              example: '1234567890123'
            },
            account_type: {
              type: 'string',
              enum: ['Tabungan', 'Giro', 'Kartu Kredit', 'Lainnya'],
              example: 'Tabungan'
            },
            is_primary: {
              type: 'boolean',
              example: true
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            },
            customer: {
              $ref: '#/components/schemas/Customer'
            }
          }
        },

        // Login Request Schema
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@email.com',
              description: 'User email address'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123',
              description: 'User password'
            }
          }
        },

        // Login Response Schema
        LoginResponse: {
          type: 'object',
          properties: {
            access_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            token_type: {
              type: 'string',
              example: 'Bearer'
            },
            expires_in: {
              type: 'integer',
              example: 3600
            },
            role: {
              type: 'string',
              enum: ['customer', 'agent'],
              example: 'customer'
            },
            user: {
              oneOf: [
                { $ref: '#/components/schemas/Customer' },
                { $ref: '#/components/schemas/Agent' }
              ]
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication endpoints for customers and agents'
      },
      {
        name: 'Customers',
        description: 'Customer management endpoints'
      },
      {
        name: 'Agents',
        description: 'Agent management endpoints'
      },
      {
        name: 'Teams',
        description: 'Team management endpoints'
      },
      {
        name: 'Accounts',
        description: 'Account management endpoints'
      },
      {
        name: 'Health',
        description: 'API health check endpoints'
      }
    ],
    paths: {
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'User login authentication',
          description: 'Authenticate users (customers or agents) and return JWT token. Role is automatically detected based on email domain (@bni.co.id for agents).',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginRequest'
                },
                examples: {
                  customer: {
                    summary: 'Customer login',
                    value: {
                      email: 'john@email.com',
                      password: 'password123'
                    }
                  },
                  agent: {
                    summary: 'Agent login',
                    value: {
                      email: 'agent.smith@bni.co.id',
                      password: 'password123'
                    }
                  }
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
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            $ref: '#/components/schemas/LoginResponse'
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            400: {
              description: 'Missing credentials',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            500: {
              description: 'Authentication failed',
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

      '/customers/test': {
        get: {
          tags: ['Customers'],
          summary: 'Test customer routes',
          description: 'Simple test endpoint to verify customer routes are working',
          responses: {
            200: {
              description: 'Test successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Customer routes working'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },

      '/customers/{id}': {
        get: {
          tags: ['Customers'],
          summary: 'Get customer by ID',
          description: 'Retrieve customer details including related accounts',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              },
              description: 'Customer ID',
              example: '1'
            }
          ],
          responses: {
            200: {
              description: 'Customer retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            $ref: '#/components/schemas/Customer'
                          }
                        }
                      }
                    ]
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

      '/agents': {
        get: {
          tags: ['Agents'],
          summary: 'List agents',
          description: 'Retrieve list of agents with optional team filtering',
          parameters: [
            {
              name: 'team_id',
              in: 'query',
              required: false,
              schema: {
                type: 'integer'
              },
              description: 'Filter agents by team ID',
              example: 1
            }
          ],
          responses: {
            200: {
              description: 'Agents retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: {
                              $ref: '#/components/schemas/Agent'
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },

      '/agents/{id}': {
        get: {
          tags: ['Agents'],
          summary: 'Get agent by ID',
          description: 'Retrieve agent details including team information',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'integer'
              },
              description: 'Agent ID',
              example: 1
            }
          ],
          responses: {
            200: {
              description: 'Agent retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            $ref: '#/components/schemas/Agent'
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            404: {
              description: 'Agent not found',
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

      '/teams': {
        get: {
          tags: ['Teams'],
          summary: 'List all teams',
          description: 'Retrieve list of all teams including their agents',
          responses: {
            200: {
              description: 'Teams retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: {
                              $ref: '#/components/schemas/Team'
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },

      '/teams/{id}': {
        get: {
          tags: ['Teams'],
          summary: 'Get team by ID',
          description: 'Retrieve team details including all team members',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'integer'
              },
              description: 'Team ID',
              example: 1
            }
          ],
          responses: {
            200: {
              description: 'Team retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            $ref: '#/components/schemas/Team'
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            404: {
              description: 'Team not found',
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

      '/accounts': {
        get: {
          tags: ['Accounts'],
          summary: 'Get customer accounts',
          description: 'Retrieve accounts for a specific customer',
          parameters: [
            {
              name: 'customer_id',
              in: 'query',
              required: true,
              schema: {
                type: 'string'
              },
              description: 'Customer ID (required)',
              example: '1'
            }
          ],
          responses: {
            200: {
              description: 'Accounts retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: {
                              $ref: '#/components/schemas/Account'
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            400: {
              description: 'Missing customer_id parameter',
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
    }
  },
  apis: [] // We define paths manually above
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = {
  swaggerSpec,
  swaggerOptions
};