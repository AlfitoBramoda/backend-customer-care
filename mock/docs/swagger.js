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
    { url: 'https://275232686ea9.ngrok-free.app/v1', description: 'Ngrok tunnel (Primary)' },
    { url: 'https://bcare.my.id/v1', description: 'GCP Server' },
    { url: 'http://localhost:3001/v1', description: 'Development server' },
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

      // Customer Schemas
      CustomerListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Customers retrieved successfully' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                customer_id: { type: 'integer', example: 1 },
                full_name: { type: 'string', example: 'Andi Saputra' },
                email: { type: 'string', example: 'andi.saputra@example.com' },
                address: { type: 'string', example: 'Jl. Merdeka No. 10, Jakarta' },
                phone_number: { type: 'string', example: '081234567890' },
                cif: { type: 'string', example: 'CIF001' },
                nik: { type: 'string', example: '3201234567890123' },
                gender_type: { type: 'string', enum: ['Male', 'Female'], example: 'Male' },
                place_of_birth: { type: 'string', example: 'Jakarta' },
                created_at: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00.000Z' },
                accounts_count: { type: 'integer', example: 2 },
                tickets_count: { type: 'integer', example: 5 },
              },
            },
          },
          search_info: {
            type: 'object',
            nullable: true,
            description: 'Search information (only present when search is performed)',
            properties: {
              type: { type: 'string', enum: ['customer', 'account', 'card'], example: 'account' },
              query: { type: 'string', example: '1234567890' },
              matched_accounts: { type: 'integer', example: 1, description: 'Number of matched accounts (for account search)' },
              matched_cards: { type: 'integer', example: 1, description: 'Number of matched cards (for card search)' },
            },
          },
          pagination: {
            type: 'object',
            properties: {
              current_page: { type: 'integer', example: 1 },
              per_page: { type: 'integer', example: 10 },
              total_items: { type: 'integer', example: 150 },
              total_pages: { type: 'integer', example: 15 },
              has_next: { type: 'boolean', example: true },
              has_prev: { type: 'boolean', example: false },
            },
          },
        },
      },
      CustomerDetailResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Customer detail retrieved successfully' },
          data: {
            type: 'object',
            properties: {
              customer_id: { type: 'integer', example: 1 },
              full_name: { type: 'string', example: 'Andi Saputra' },
              email: { type: 'string', example: 'andi.saputra@example.com' },
              address: { type: 'string', example: 'Jl. Merdeka No. 10, Jakarta' },
              phone_number: { type: 'string', example: '081234567890' },
              cif: { type: 'string', example: 'CIF001' },
              nik: { type: 'string', example: '3201234567890123' },
              gender_type: { type: 'string', enum: ['Male', 'Female'], example: 'Male' },
              place_of_birth: { type: 'string', example: 'Jakarta' },
              date_of_birth: { type: 'string', format: 'date', example: '1990-05-15' },
              created_at: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00.000Z' },
              accounts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    account_id: { type: 'integer', example: 1 },
                    account_number: { type: 'string', example: '1234567890' },
                    account_status: { type: 'string', example: 'ACTIVE' },
                    account_type: {
                      type: 'object',
                      properties: {
                        account_type_name: { type: 'string', example: 'Savings Account' },
                        account_type_code: { type: 'string', example: 'SAV' },
                      },
                    },
                  },
                },
              },
              cards: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    card_id: { type: 'integer', example: 1 },
                    card_number: { type: 'string', example: '****1234' },
                    card_status: {
                      type: 'object',
                      properties: {
                        status_name: { type: 'string', example: 'ACTIVE' },
                        status_code: { type: 'string', example: 'ACT' },
                      },
                    },
                  },
                },
              },
              tickets: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ticket_id: { type: 'integer', example: 1 },
                    ticket_number: { type: 'string', example: 'BNI-20250115001' },
                    description: { type: 'string', example: 'Kartu ATM tertelan' },
                    customer_status: { type: 'string', example: 'ACC' },
                    employee_status: { type: 'string', example: 'OPEN' },
                    priority: { type: 'object' },
                    channel: { type: 'object' },
                    complaint_category: { type: 'object' },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
              summary: {
                type: 'object',
                properties: {
                  total_accounts: { type: 'integer', example: 2 },
                  total_cards: { type: 'integer', example: 3 },
                  total_tickets: { type: 'integer', example: 5 },
                  active_accounts: { type: 'integer', example: 2 },
                  active_cards: { type: 'integer', example: 2 },
                  open_tickets: { type: 'integer', example: 1 },
                },
              },
            },
          },
        },
      },

      // Activity Schemas
      CreateActivityRequest: {
        type: 'object',
        required: ['activity_type', 'content'],
        properties: {
          activity_type: {
            type: 'string',
            enum: ['COMMENT', 'STATUS_CHANGE', 'ATTACHMENT'],
            example: 'COMMENT',
            description: 'Type of activity to create'
          },
          content: {
            type: 'string',
            example: 'Customer provided additional information about the issue',
            description: 'Content of the activity'
          }
        }
      },
      CreateActivityResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Activity created successfully' },
          data: {
            type: 'object',
            properties: {
              ticket_activity_id: { type: 'integer', example: 123 },
              ticket_id: { type: 'integer', example: 45 },
              activity_type: {
                type: 'object',
                properties: {
                  ticket_activity_type_id: { type: 'integer', example: 1 },
                  ticket_activity_code: { type: 'string', example: 'COMMENT' },
                  ticket_activity_name: { type: 'string', example: 'Comment' }
                }
              },
              sender_type: {
                type: 'object',
                properties: {
                  sender_type_id: { type: 'integer', example: 1 },
                  sender_type_code: { type: 'string', example: 'CUSTOMER' },
                  sender_type_name: { type: 'string', example: 'Customer' }
                }
              },
              sender: {
                type: 'object',
                properties: {
                  sender_id: { type: 'integer', example: 67 },
                  full_name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@example.com' },
                  type: { type: 'string', enum: ['customer', 'employee'], example: 'customer' }
                }
              },
              content: { type: 'string', example: 'Customer provided additional information about the issue' },
              ticket_activity_time: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000Z' }
            }
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
            format: 'float',
            example: 500000,
            description: 'Transaction amount if applicable (optional)',
          },
          record: {
            type: 'string',
            example: '',
            description: 'Additional record information (optional)',
          },
          issue_channel_id: { type: 'integer', example: 1, description: 'Channel where issue occurred' },
          complaint_id: { type: 'integer', example: 1, description: 'Complaint category ID' },
          related_account_id: { type: 'integer', example: 1, description: 'Related account ID (optional)' },
          related_card_id: { type: 'integer', example: 1, description: 'Related card ID (optional)' },
          terminal_id: { type: 'integer', example: 1, description: 'Terminal ID (optional)' },
          intake_source_id: { type: 'integer', example: 1, description: 'Source of ticket intake (optional)' },
          customer_id: { type: 'integer', example: 1, description: 'Customer ID (for employee flows)' },
          initial_employee_status: {
            type: 'string',
            enum: ['OPEN', 'HANDLEDCXC', 'ESCALATED', 'CLOSED', 'RESOLVED'],
            example: 'ESCALATED',
            description: 'Initial employee status (Employee only - defaults to OPEN if not provided)'
          },
          initial_customer_status: {
            type: 'string', 
            enum: ['ACC', 'VERIF', 'PROCESS', 'CLOSED', 'DECLINED', 'RESOLVED'],
            example: 'PROCESS',
            description: 'Initial customer status (Employee only - defaults to ACC if not provided)'
          },
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
              record: { type: 'string', example: '' },
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
              closed_time: { 
                type: 'string', 
                format: 'date-time', 
                nullable: true,
                example: null,
                description: 'Auto-set if initial_employee_status is CLOSED or RESOLVED'
              },
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
      LoginRequiredResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Login required - No authorization token provided' },
          code: { type: 'string', example: 'LOGIN_REQUIRED' },
        },
      },
      TokenExpiredResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Token expired - Please refresh your session' },
          code: { type: 'string', example: 'TOKEN_EXPIRED' },
        },
      },
      InvalidTokenResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Invalid token - Authentication failed' },
          code: { type: 'string', example: 'INVALID_TOKEN' },
        },
      },

      // Feedback Schemas
      SubmitFeedbackRequest: {
        type: 'object',
        required: ['score'],
        properties: {
          score: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            example: 5,
            description: 'Rating score from 1 to 5'
          },
          comment: {
            type: 'string',
            example: 'Pelayanan sangat memuaskan dan cepat',
            description: 'Optional feedback comment'
          }
        }
      },
      SubmitFeedbackResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Feedback berhasil dikirim' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              ticket: {
                type: 'object',
                properties: {
                  id: { type: 'integer', example: 1 },
                  ticket_number: { type: 'string', example: 'BNI-20250115001' },
                  description: { type: 'string', example: 'Kartu ATM tertelan' },
                  status: { type: 'string', example: 'CLOSED' }
                }
              },
              customer: {
                type: 'object',
                properties: {
                  id: { type: 'integer', example: 1 },
                  full_name: { type: 'string', example: 'Andi Saputra' },
                  email: { type: 'string', example: 'andi.saputra@example.com' },
                  phone_number: { type: 'string', example: '081234567890' }
                }
              },
              score: { type: 'integer', example: 5 },
              comment: { type: 'string', example: 'Pelayanan sangat memuaskan dan cepat' },
              submit_time: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00.000Z' }
            }
          }
        }
      },
      FeedbackDetailResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              ticket: {
                type: 'object',
                properties: {
                  id: { type: 'integer', example: 1 },
                  ticket_number: { type: 'string', example: 'BNI-20250115001' },
                  description: { type: 'string', example: 'Kartu ATM tertelan' },
                  status: { type: 'string', example: 'CLOSED' }
                }
              },
              customer: {
                type: 'object',
                properties: {
                  id: { type: 'integer', example: 1 },
                  full_name: { type: 'string', example: 'Andi Saputra' },
                  email: { type: 'string', example: 'andi.saputra@example.com' },
                  phone_number: { type: 'string', example: '081234567890' }
                }
              },
              score: { type: 'integer', example: 5 },
              comment: { type: 'string', example: 'Pelayanan sangat memuaskan dan cepat' },
              submit_time: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00.000Z' }
            }
          }
        }
      },
      UpdateFeedbackRequest: {
        type: 'object',
        properties: {
          comment: {
            type: 'string',
            example: 'Update: Terima kasih atas penanganan yang cepat',
            description: 'Updated feedback comment'
          }
        }
      },
      AllFeedbackResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Data feedback berhasil diambil' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                ticket: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer', example: 1 },
                    ticket_number: { type: 'string', example: 'BNI-20250115001' },
                    description: { type: 'string', example: 'Kartu ATM tertelan' },
                    status: { type: 'string', example: 'CLOSED' }
                  }
                },
                customer: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer', example: 1 },
                    full_name: { type: 'string', example: 'Andi Saputra' },
                    email: { type: 'string', example: 'andi.saputra@example.com' },
                    phone_number: { type: 'string', example: '081234567890' }
                  }
                },
                score: { type: 'integer', example: 5 },
                comment: { type: 'string', example: 'Pelayanan sangat memuaskan dan cepat' },
                submit_time: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00.000Z' }
              }
            }
          },
          pagination: {
            type: 'object',
            properties: {
              current_page: { type: 'integer', example: 1 },
              per_page: { type: 'integer', example: 10 },
              total_items: { type: 'integer', example: 150 },
              total_pages: { type: 'integer', example: 15 },
              has_next: { type: 'boolean', example: true },
              has_prev: { type: 'boolean', example: false }
            }
          }
        }
      },

      // Attachment Schemas
      UploadAttachmentResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Successfully uploaded 2 file(s)' },
          data: {
            type: 'object',
            properties: {
              ticket_id: { type: 'integer', example: 1 },
              activity_id: { type: 'integer', example: 123 },
              attachments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    attachment_id: { type: 'integer', example: 1 },
                    file_name: { type: 'string', example: 'document.pdf' },
                    file_size: { type: 'integer', example: 245678 },
                    file_type: { type: 'string', example: 'application/pdf' },
                    upload_time: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00.000Z' },
                    gcs_path: { type: 'string', example: 'tickets/ticket-1/uuid-filename.pdf' }
                  }
                }
              }
            }
          }
        }
      },
      AttachmentDetailResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Attachment retrieved successfully' },
          data: {
            type: 'object',
            properties: {
              attachment_id: { type: 'integer', example: 1 },
              file_name: { type: 'string', example: 'document.pdf' },
              file_size: { type: 'integer', example: 245678 },
              file_type: { type: 'string', example: 'application/pdf' },
              upload_time: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00.000Z' },
              download_url: { type: 'string', example: 'https://storage.googleapis.com/bucket/signed-url...' },
              ticket: {
                type: 'object',
                properties: {
                  ticket_id: { type: 'integer', example: 1 },
                  ticket_number: { type: 'string', example: 'BNI-20250115001' }
                }
              }
            }
          }
        }
      },
      DeleteAttachmentResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Attachment deleted successfully' },
          data: {
            type: 'object',
            properties: {
              attachment_id: { type: 'integer', example: 1 },
              file_name: { type: 'string', example: 'document.pdf' },
              deleted_at: { type: 'string', format: 'date-time', example: '2025-01-15T15:30:00.000Z' }
            }
          }
        }
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'User authentication endpoints' },
    { name: 'Tickets', description: 'Ticket management endpoints' },
    { name: 'Customers', description: 'Customer management endpoints' },
    { name: 'Reference Data', description: 'Reference data endpoints for channels, categories, SLAs, UICs, and policies' },
    { name: 'Feedback', description: 'Feedback management endpoints' },
    { name: 'Attachments', description: 'File attachment management endpoints' },
    { name: 'FAQ', description: 'Frequently Asked Questions management endpoints' },
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
        '401': { description: 'Login required - No token provided', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequiredResponse' } } } },
        '419': { description: 'Token expired - Please refresh', content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenExpiredResponse' } } } },
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
        '200': { description: 'User data retrieved successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/CurrentUserResponse' } } } },
        '401': { description: 'Login required - No token provided', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequiredResponse' } } } },
        '404': { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '419': { description: 'Token expired - Please refresh', content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenExpiredResponse' } } } },
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

  '/customers': {
    get: {
      tags: ['Customers'],
      summary: 'Get customers list with filters and search',
      description: 'List all customers with filtering, search by customer data/account/card, and pagination. Employee access only.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 }, description: 'Page number' },
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }, description: 'Items per page' },
        { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search term - behavior depends on search_type parameter', example: '1234567890' },
        { in: 'query', name: 'search_type', schema: { type: 'string', enum: ['customer', 'account', 'card'], default: 'customer' }, description: 'Search type: customer (name/email/phone/CIF/NIK), account (account number), or card (card number)' },
        { in: 'query', name: 'gender_type', schema: { type: 'string', enum: ['Male', 'Female'] }, description: 'Filter by gender' },
        { in: 'query', name: 'sort_by', schema: { type: 'string', enum: ['created_at', 'full_name', 'email'], default: 'created_at' }, description: 'Sort field' },
        { in: 'query', name: 'sort_order', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }, description: 'Sort order' },
      ],
      responses: {
        '200': { description: 'Customers retrieved successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerListResponse' } } } },
        '401': { description: 'Login required - No token provided', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequiredResponse' } } } },
        '403': { description: 'Forbidden - Employee access only', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '419': { description: 'Token expired - Please refresh', content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenExpiredResponse' } } } },
      },
    },
  },

  '/customers/{id}': {
    get: {
      tags: ['Customers'],
      summary: 'Get customer detail by ID',
      description: 'Get detailed customer information including accounts, cards, tickets, and summary statistics. Employee access only.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Customer ID' },
      ],
      responses: {
        '200': { description: 'Customer detail retrieved successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerDetailResponse' } } } },
        '401': { description: 'Login required - No token provided', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequiredResponse' } } } },
        '403': { description: 'Forbidden - Employee access only', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '404': { description: 'Customer not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '419': { description: 'Token expired - Please refresh', content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenExpiredResponse' } } } },
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
        '200': { description: 'Tickets retrieved successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/TicketListResponse' } } } },
        '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '401': { description: 'Login required - No token provided', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequiredResponse' } } } },
        '419': { description: 'Token expired - Please refresh', content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenExpiredResponse' } } } },
      },
    },
    post: {
      tags: ['Tickets'],
      summary: 'Create new ticket',
      description: 'Create new ticket with role-based constraints. Employees can set initial status to ESCALATED or CLOSED for immediate handling.',
      security: [{ bearerAuth: [] }],
      requestBody: { 
        required: true, 
        content: { 
          'application/json': { 
            schema: { $ref: '#/components/schemas/CreateTicketRequest' },
            examples: {
              customer_ticket: {
                summary: 'Customer creates ticket (default status)',
                value: {
                  description: 'Kartu ATM saya tertelan di mesin ATM BNI Sudirman',
                  issue_channel_id: 1,
                  complaint_id: 1,
                  transaction_date: '2025-01-15T14:30:00Z',
                  amount: 500000,
                  related_account_id: 1,
                  terminal_id: 1
                }
              },
              employee_default: {
                summary: 'Employee creates ticket (default status)',
                value: {
                  description: 'Customer complaint via phone call',
                  issue_channel_id: 2,
                  complaint_id: 3,
                  customer_id: 5,
                  intake_source_id: 1
                }
              },
              employee_escalated: {
                summary: 'Employee creates ticket (immediately escalated)',
                value: {
                  description: 'Complex technical issue requiring specialist attention',
                  issue_channel_id: 1,
                  complaint_id: 2,
                  customer_id: 5,
                  initial_employee_status: 'ESCALATED',
                  initial_customer_status: 'PROCESS'
                }
              },
              employee_closed: {
                summary: 'Employee creates ticket (already resolved)',
                value: {
                  description: 'Issue resolved during phone call',
                  issue_channel_id: 2,
                  complaint_id: 1,
                  customer_id: 5,
                  initial_employee_status: 'CLOSED',
                  initial_customer_status: 'RESOLVED'
                }
              }
            }
          } 
        } 
      },
      responses: {
        '201': { description: 'Ticket created successfully (may be immediately closed if initial_employee_status is CLOSED/RESOLVED)', content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTicketResponse' } } } },
        '400': { description: 'Bad request - Missing required fields or invalid data', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '401': { description: 'Login required - No token provided', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequiredResponse' } } } },
        '403': { description: 'Forbidden - Access denied or insufficient permissions', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '404': { description: 'Customer not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '419': { description: 'Token expired - Please refresh', content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenExpiredResponse' } } } },
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
            record: { type: 'string', example: 'Additional record information' },
            customer_status: { type: 'string', enum: ['ACC', 'VERIF', 'PROCESS', 'CLOSED', 'DECLINED'], example: 'PROCESS' },
            employee_status: { type: 'string', enum: ['OPEN', 'HANDLEDCXC', 'ESCALATED', 'CLOSED', 'DECLINED'], example: 'HANDLEDCXC' },
            priority: { type: 'string', enum: ['CRITICAL', 'HIGH', 'REGULAR'], example: 'HIGH' },
            responsible_employee_id: { type: 'integer', example: 2 },
            division_notes: { type: 'string', example: 'Escalated to technical team for further investigation' },
            transaction_date: { type: 'string', format: 'date-time', example: '2025-01-15T14:30:00Z' },
            amount: { type: 'number', format: 'float', example: 750000 },
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

  '/tickets/{id}/activities': {
    get: {
      tags: ['Tickets'],
      summary: 'Get ticket activities',
      description: 'Get all activities for a specific ticket with pagination and filtering.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Ticket ID' },
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 }, description: 'Items per page' },
        { in: 'query', name: 'offset', schema: { type: 'integer', minimum: 0, default: 0 }, description: 'Offset' },
        { in: 'query', name: 'activity_type', schema: { type: 'string', enum: ['COMMENT', 'STATUS_CHANGE', 'ATTACHMENT'] }, description: 'Filter by activity type' },
      ],
      responses: {
        '200': {
          description: 'Activities retrieved successfully',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Ticket activities retrieved successfully' },
              data: {
                type: 'object',
                properties: {
                  ticket_id: { type: 'integer', example: 1 },
                  ticket_number: { type: 'string', example: 'BNI-00001' },
                  activities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        ticket_activity_id: { type: 'integer', example: 1 },
                        activity_type: {
                          type: 'object',
                          properties: {
                            ticket_activity_code: { type: 'string', example: 'COMMENT' },
                            ticket_activity_name: { type: 'string', example: 'Comment' },
                          },
                        },
                        sender: {
                          type: 'object',
                          properties: {
                            full_name: { type: 'string', example: 'Budi Hartono' },
                            type: { type: 'string', enum: ['customer', 'employee'], example: 'employee' },
                          },
                        },
                        content: { type: 'string', example: 'Ticket created by agent' },
                        ticket_activity_time: { type: 'string', format: 'date-time', example: '2025-08-14T08:16:00Z' },
                        attachments: { type: 'array', items: { type: 'object' } },
                      },
                    },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'integer', example: 25 },
                  limit: { type: 'integer', example: 50 },
                  offset: { type: 'integer', example: 0 },
                  pages: { type: 'integer', example: 1 },
                },
              },
            },
          } } },
        },
        '403': { description: 'Access denied', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '404': { description: 'Ticket not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    post: {
      tags: ['Tickets'],
      summary: 'Add activity to ticket',
      description: 'Create a new activity (comment, status change, or attachment) for a specific ticket. Role-based access control applies.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Ticket ID' }
      ],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateActivityRequest' } } }
      },
      responses: {
        '201': {
          description: 'Activity created successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateActivityResponse' } } }
        },
        '400': {
          description: 'Bad request - Invalid activity type or missing required fields',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '403': {
          description: 'Forbidden - Access denied (customer can only add to own tickets, employees to assigned tickets)',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '404': {
          description: 'Ticket not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/tickets/{id}/attachments': {
    get: {
      tags: ['Tickets'],
      summary: 'Get ticket attachments',
      description: 'Get all attachments for a specific ticket with pagination and filtering.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Ticket ID' },
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }, description: 'Items per page' },
        { in: 'query', name: 'offset', schema: { type: 'integer', minimum: 0, default: 0 }, description: 'Offset' },
        { in: 'query', name: 'file_type', schema: { type: 'string' }, description: 'Filter by file type (e.g., image, pdf)' },
      ],
      responses: {
        '200': {
          description: 'Attachments retrieved successfully',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Ticket attachments retrieved successfully' },
              data: {
                type: 'object',
                properties: {
                  ticket_id: { type: 'integer', example: 1 },
                  ticket_number: { type: 'string', example: 'BNI-00001' },
                  attachments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        attachment_id: { type: 'integer', example: 1 },
                        file_name: { type: 'string', example: 'foto_atm.jpg' },
                        file_path: { type: 'string', example: '/uploads/foto_atm.jpg' },
                        file_size: { type: 'integer', example: 245678 },
                        file_type: { type: 'string', example: 'image/jpeg' },
                        upload_time: { type: 'string', format: 'date-time', example: '2025-08-14T08:16:30Z' },
                        activity: {
                          type: 'object',
                          properties: {
                            ticket_activity_id: { type: 'integer', example: 1 },
                            content: { type: 'string', example: 'Ticket created by agent' },
                          },
                        },
                        uploaded_by: {
                          type: 'object',
                          properties: {
                            full_name: { type: 'string', example: 'Budi Hartono' },
                            type: { type: 'string', enum: ['customer', 'employee'], example: 'employee' },
                          },
                        },
                      },
                    },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'integer', example: 3 },
                  limit: { type: 'integer', example: 20 },
                  offset: { type: 'integer', example: 0 },
                  pages: { type: 'integer', example: 1 },
                },
              },
            },
          } } },
        },
        '403': { description: 'Access denied', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '404': { description: 'Ticket not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    post: {
      tags: ['Attachments'],
      summary: 'Upload attachments to ticket',
      description: 'Upload one or more files to a ticket. Files are stored in Google Cloud Storage. Maximum 5 files, 10MB each. Supported formats: images, PDF, Word, Excel, text files.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Ticket ID' }
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                files: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'binary'
                  },
                  description: 'Files to upload (max 5 files, 10MB each)'
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Files uploaded successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UploadAttachmentResponse' } } }
        },
        '400': {
          description: 'Bad request - No files, file too large, invalid file type, or too many files',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '403': {
          description: 'Forbidden - Access denied (customer can only upload to own tickets)',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '404': {
          description: 'Ticket not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '500': {
          description: 'Upload failed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '503': {
          description: 'Service unavailable - GCS not configured',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/tickets/{id}/feedback': {
    get: {
      tags: ['Tickets'],
      summary: 'Get ticket feedback',
      description: 'Get feedback for a specific ticket if it exists.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Ticket ID' },
      ],
      responses: {
        '200': {
          description: 'Feedback retrieved successfully (or no feedback found)',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Ticket feedback retrieved successfully' },
              data: {
                type: 'object',
                properties: {
                  ticket_id: { type: 'integer', example: 1 },
                  ticket_number: { type: 'string', example: 'BNI-00001' },
                  feedback: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      feedback_id: { type: 'integer', example: 1 },
                      score: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                      comment: { type: 'string', example: 'Pelayanan cepat.' },
                      submit_time: { type: 'string', format: 'date-time', example: '2025-08-14T09:00:00Z' },
                      customer: {
                        type: 'object',
                        properties: {
                          customer_id: { type: 'integer', example: 1 },
                          full_name: { type: 'string', example: 'Andi Saputra' },
                          email: { type: 'string', example: 'andi.saputra@example.com' },
                        },
                      },
                    },
                  },
                },
              },
            },
          } } },
        },
        '403': { description: 'Access denied', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '404': { description: 'Ticket not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  // Reference Data Endpoints
  '/channels': {
    get: {
      tags: ['Reference Data'],
      summary: 'Get all channels',
      description: 'List all available channels with terminal and policy counts. Requires authentication.',
      security: [{ bearerAuth: [] }],
      responses: {
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '200': {
          description: 'Channels retrieved successfully',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Channels retrieved successfully' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    channel_id: { type: 'integer', example: 1 },
                    channel_code: { type: 'string', example: 'ATM' },
                    channel_name: { type: 'string', example: 'Automated Teller Machine' },
                    supports_terminal: { type: 'boolean', example: true },
                    terminals_count: { type: 'integer', example: 150 },
                    policies_count: { type: 'integer', example: 25 },
                  },
                },
              },
            },
          } } },
        },
      },
    },
  },

  '/complaint-categories': {
    get: {
      tags: ['Reference Data'],
      summary: 'Get all complaint categories',
      description: 'List all complaint categories with tickets, FAQs, and policies counts. Requires authentication.',
      security: [{ bearerAuth: [] }],
      responses: {
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '200': {
          description: 'Complaint categories retrieved successfully',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Complaint categories retrieved successfully' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    complaint_id: { type: 'integer', example: 1 },
                    complaint_code: { type: 'string', example: 'CARD_SWALLOWED' },
                    complaint_name: { type: 'string', example: 'Card Swallowed' },
                    tickets_count: { type: 'integer', example: 45 },
                    faqs_count: { type: 'integer', example: 3 },
                    policies_count: { type: 'integer', example: 8 },
                  },
                },
              },
            },
          } } },
        },
      },
    },
  },

  '/slas': {
    get: {
      tags: ['Reference Data'],
      summary: 'Get SLA data from policies',
      description: 'Extract SLA information from complaint policies with filtering options. Requires authentication.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'service', schema: { type: 'string' }, description: 'Filter by service type' },
        { in: 'query', name: 'channel_id', schema: { type: 'integer' }, description: 'Filter by channel ID' },
        { in: 'query', name: 'complaint_id', schema: { type: 'integer' }, description: 'Filter by complaint category ID' },
      ],
      responses: {
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '200': {
          description: 'SLA data retrieved successfully',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'SLA data retrieved successfully' },
              summary: {
                type: 'object',
                properties: {
                  total_policies: { type: 'integer', example: 50 },
                  unique_sla_levels: { type: 'integer', example: 4 },
                  sla_groups: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        sla_hours: { type: 'integer', example: 24 },
                        sla_days: { type: 'integer', example: 1 },
                        policies_count: { type: 'integer', example: 15 },
                      },
                    },
                  },
                },
              },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    policy_id: { type: 'integer', example: 1 },
                    service: { type: 'string', example: 'ATM Service' },
                    sla_hours: { type: 'integer', example: 24 },
                    sla_days: { type: 'integer', example: 1 },
                    channel: { type: 'object' },
                    complaint_category: { type: 'object' },
                    uic: { type: 'object' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          } } },
        },
      },
    },
  },

  '/uics': {
    get: {
      tags: ['Reference Data'],
      summary: 'Get UICs (Units in Charge)',
      description: 'List all divisions mapped as UICs with employee and workload statistics. Requires authentication.',
      security: [{ bearerAuth: [] }],
      responses: {
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '200': {
          description: 'UICs retrieved successfully',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'UICs retrieved successfully' },
              summary: {
                type: 'object',
                properties: {
                  total_uics: { type: 'integer', example: 8 },
                  operational_uics: { type: 'integer', example: 6 },
                  total_employees: { type: 'integer', example: 45 },
                  total_active_employees: { type: 'integer', example: 38 },
                },
              },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    uic_id: { type: 'integer', example: 1 },
                    uic_code: { type: 'string', example: 'CXC' },
                    uic_name: { type: 'string', example: 'Customer Experience Center' },
                    employees_count: { type: 'integer', example: 12 },
                    active_employees_count: { type: 'integer', example: 10 },
                    policies_count: { type: 'integer', example: 25 },
                    tickets_count: { type: 'integer', example: 150 },
                    is_operational: { type: 'boolean', example: true },
                  },
                },
              },
            },
          } } },
        },
      },
    },
  },

  '/priorities': {
    get: {
      tags: ['Reference Data'],
      summary: 'Get all priorities',
      description: 'List all priority levels available for tickets. Requires authentication.',
      security: [{ bearerAuth: [] }],
      responses: {
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '200': {
          description: 'Priorities retrieved successfully',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Priorities retrieved successfully' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    priority_id: { type: 'integer', example: 1 },
                    priority_code: { type: 'string', example: 'HIGH' },
                    priority_name: { type: 'string', example: 'High Priority' },
                  },
                },
              },
            },
          } } },
        },
      },
    },
  },

  '/sources': {
    get: {
      tags: ['Reference Data'],
      summary: 'Get all intake sources',
      description: 'List all available intake sources for ticket creation. Requires authentication.',
      security: [{ bearerAuth: [] }],
      responses: {
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '200': {
          description: 'Sources retrieved successfully',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Sources retrieved successfully' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    source_id: { type: 'integer', example: 1 },
                    source_code: { type: 'string', example: 'EMPLOYEE' },
                    source_name: { type: 'string', example: 'Employee Created' },
                  },
                },
              },
            },
          } } },
        },
      },
    },
  },

  '/policies': {
    get: {
      tags: ['Reference Data'],
      summary: 'Get complaint policies',
      description: 'List all complaint policies with comprehensive filtering and pagination. Requires authentication.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'service', schema: { type: 'string' }, description: 'Filter by service type' },
        { in: 'query', name: 'channel_id', schema: { type: 'integer' }, description: 'Filter by channel ID' },
        { in: 'query', name: 'complaint_id', schema: { type: 'integer' }, description: 'Filter by complaint category ID' },
        { in: 'query', name: 'uic_id', schema: { type: 'integer' }, description: 'Filter by UIC (division) ID' },
        { in: 'query', name: 'sla_min', schema: { type: 'integer' }, description: 'Minimum SLA hours' },
        { in: 'query', name: 'sla_max', schema: { type: 'integer' }, description: 'Maximum SLA hours' },
        { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 }, description: 'Page number' },
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 }, description: 'Items per page' },
        { in: 'query', name: 'sort_by', schema: { type: 'string', enum: ['policy_id', 'service', 'sla'], default: 'policy_id' }, description: 'Sort field' },
        { in: 'query', name: 'sort_order', schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }, description: 'Sort order' },
      ],
      responses: {
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '200': {
          description: 'Policies retrieved successfully',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Policies retrieved successfully' },
              pagination: {
                type: 'object',
                properties: {
                  current_page: { type: 'integer', example: 1 },
                  per_page: { type: 'integer', example: 50 },
                  total_items: { type: 'integer', example: 125 },
                  total_pages: { type: 'integer', example: 3 },
                  has_next: { type: 'boolean', example: true },
                  has_prev: { type: 'boolean', example: false },
                },
              },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    policy_id: { type: 'integer', example: 1 },
                    service: { type: 'string', example: 'ATM Service' },
                    sla_hours: { type: 'integer', example: 24 },
                    sla_days: { type: 'integer', example: 1 },
                    description: { type: 'string', example: 'Standard ATM service policy' },
                    tickets_count: { type: 'integer', example: 45 },
                    channel: {
                      type: 'object',
                      properties: {
                        channel_id: { type: 'integer', example: 1 },
                        channel_code: { type: 'string', example: 'ATM' },
                        channel_name: { type: 'string', example: 'Automated Teller Machine' },
                        supports_terminal: { type: 'boolean', example: true },
                      },
                    },
                    complaint_category: {
                      type: 'object',
                      properties: {
                        complaint_id: { type: 'integer', example: 1 },
                        complaint_code: { type: 'string', example: 'CARD_SWALLOWED' },
                        complaint_name: { type: 'string', example: 'Card Swallowed' },
                      },
                    },
                    uic: {
                      type: 'object',
                      properties: {
                        division_id: { type: 'integer', example: 1 },
                        division_code: { type: 'string', example: 'CXC' },
                        division_name: { type: 'string', example: 'Customer Experience Center' },
                      },
                    },
                  },
                },
              },
            },
          } } },
        },
      },
    },
  },

  '/feedback': {
    get: {
      tags: ['Feedback'],
      summary: 'Get all feedback (Employee only)',
      description: 'Get all feedback data with pagination. Only accessible by employees.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 }, description: 'Page number' },
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }, description: 'Items per page' }
      ],
      responses: {
        '200': {
          description: 'All feedback retrieved successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AllFeedbackResponse' } } }
        },
        '401': {
          description: 'Login required - No token provided',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequiredResponse' } } }
        },
        '403': {
          description: 'Forbidden - Employee access only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '419': {
          description: 'Token expired - Please refresh',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenExpiredResponse' } } }
        }
      }
    }
  },

  '/tickets/{id}/feedback': {
    post: {
      tags: ['Feedback'],
      summary: 'Submit feedback for ticket',
      description: 'Submit feedback with rating and optional comment for a specific ticket. Role-based access control applies.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Ticket ID' }
      ],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitFeedbackRequest' } } }
      },
      responses: {
        '201': {
          description: 'Feedback submitted successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitFeedbackResponse' } } }
        },
        '400': {
          description: 'Bad request - Invalid score or feedback already exists',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '401': {
          description: 'Login required - No token provided',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequiredResponse' } } }
        },
        '403': {
          description: 'Forbidden - Access denied (customers can only submit feedback for own tickets)',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '404': {
          description: 'Ticket not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '419': {
          description: 'Token expired - Please refresh',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenExpiredResponse' } } }
        }
      }
    }
  },

  '/feedback/{id}': {
    get: {
      tags: ['Feedback'],
      summary: 'Get feedback detail',
      description: 'Get detailed feedback information by feedback ID. Role-based access control applies.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Feedback ID' }
      ],
      responses: {
        '200': {
          description: 'Feedback retrieved successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/FeedbackDetailResponse' } } }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '403': {
          description: 'Forbidden - Access denied',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '404': {
          description: 'Feedback not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    },
    patch: {
      tags: ['Feedback'],
      summary: 'Update feedback comment',
      description: 'Update the comment of an existing feedback. Role-based access control applies.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Feedback ID' }
      ],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateFeedbackRequest' } } }
      },
      responses: {
        '200': {
          description: 'Feedback updated successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/FeedbackDetailResponse' } } }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '403': {
          description: 'Forbidden - Access denied',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '404': {
          description: 'Feedback not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/faqs': {
    get: {
      tags: ['FAQ'],
      summary: 'Get FAQs with search and filter',
      description: 'List all FAQs with search functionality, channel filtering, pagination, and sorting. Requires authentication.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search in question, answer, or keywords' },
        { in: 'query', name: 'channel_id', schema: { type: 'integer' }, description: 'Filter by channel ID' },
        { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 }, description: 'Page number' },
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }, description: 'Items per page' },
        { in: 'query', name: 'sort_by', schema: { type: 'string', default: 'faq_id' }, description: 'Sort by field' },
        { in: 'query', name: 'sort_order', schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }, description: 'Sort order' }
      ],
      responses: {
        '200': {
          description: 'FAQs retrieved successfully',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'FAQs retrieved successfully' },
              pagination: {
                type: 'object',
                properties: {
                  current_page: { type: 'integer', example: 1 },
                  per_page: { type: 'integer', example: 10 },
                  total_items: { type: 'integer', example: 25 },
                  total_pages: { type: 'integer', example: 3 },
                  has_next: { type: 'boolean', example: true },
                  has_prev: { type: 'boolean', example: false }
                }
              },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    faq_id: { type: 'integer', example: 1 },
                    question: { type: 'string', example: 'Apa yang harus dilakukan jika transaksi BI-FAST gagal?' },
                    answer: { type: 'string', example: 'Simpan bukti transaksi dan hubungi BNI Call untuk pengecekan.' },
                    keywords: { type: 'string', example: 'dana tidak masuk,bifast,transfer gagal' },
                    created_at: { type: 'string', format: 'date-time', example: '2025-08-14T08:10:00Z' },
                    updated_at: { type: 'string', format: 'date-time', example: '2025-08-14T08:11:00Z' },
                    channel: {
                      type: 'object',
                      properties: {
                        channel_id: { type: 'integer', example: 6 },
                        channel_code: { type: 'string', example: 'MBANK' },
                        channel_name: { type: 'string', example: 'Mobile Banking' },
                        supports_terminal: { type: 'boolean', example: false }
                      }
                    }
                  }
                }
              }
            }
          } } }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '500': {
          description: 'Internal server error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/customers/{id}/accounts': {
    get: {
      tags: ['Customers'],
      summary: 'Get customer accounts',
      description: 'Get all accounts belonging to a specific customer. Employee access only.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Customer ID' }
      ],
      responses: {
        '200': {
          description: 'Customer accounts retrieved successfully',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Customer accounts retrieved successfully' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    account_id: { type: 'integer', example: 1 },
                    account_number: { type: 'string', example: '1234567890' },
                    account_status: { type: 'string', example: 'ACTIVE' },
                    account_type: {
                      type: 'object',
                      properties: {
                        account_type_id: { type: 'integer', example: 1 },
                        account_type_name: { type: 'string', example: 'Savings Account' },
                        account_type_code: { type: 'string', example: 'SAV' }
                      }
                    },
                    created_at: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00.000Z' }
                  }
                }
              }
            }
          } } }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '403': {
          description: 'Forbidden - Employee access only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '404': {
          description: 'Customer not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/customers/{id}/cards': {
    get: {
      tags: ['Customers'],
      summary: 'Get customer cards',
      description: 'Get all cards belonging to a specific customer. Employee access only.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Customer ID' }
      ],
      responses: {
        '200': {
          description: 'Customer cards retrieved successfully',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Customer cards retrieved successfully' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    card_id: { type: 'integer', example: 1 },
                    card_number: { type: 'string', example: '****1234' },
                    card_type: { type: 'string', example: 'Debit' },
                    card_status: {
                      type: 'object',
                      properties: {
                        card_status_id: { type: 'integer', example: 1 },
                        status_name: { type: 'string', example: 'ACTIVE' },
                        status_code: { type: 'string', example: 'ACT' }
                      }
                    },
                    issue_date: { type: 'string', format: 'date', example: '2023-01-15' },
                    expiry_date: { type: 'string', format: 'date', example: '2028-01-15' }
                  }
                }
              }
            }
          } } }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '403': {
          description: 'Forbidden - Employee access only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '404': {
          description: 'Customer not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/attachments/{id}': {
    get: {
      tags: ['Attachments'],
      summary: 'Get attachment metadata and download URL',
      description: 'Get attachment details including a signed download URL (valid for 1 hour). Role-based access control applies.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Attachment ID' }
      ],
      responses: {
        '200': {
          description: 'Attachment retrieved successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AttachmentDetailResponse' } } }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '403': {
          description: 'Forbidden - Access denied (customer can only access own ticket attachments)',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '404': {
          description: 'Attachment not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '503': {
          description: 'Service unavailable - GCS not configured',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    },
    delete: {
      tags: ['Attachments'],
      summary: 'Delete attachment (CXC Employee only)',
      description: 'Delete an attachment from both Google Cloud Storage and database. Only CXC employees (role_id=1, division_id=1) can delete attachments.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Attachment ID' }
      ],
      responses: {
        '200': {
          description: 'Attachment deleted successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DeleteAttachmentResponse' } } }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '403': {
          description: 'Forbidden - Only CXC employees can delete attachments',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '404': {
          description: 'Attachment not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        '503': {
          description: 'Service unavailable - GCS not configured',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },
};

const swaggerSpec = { ...swaggerDefinition, paths: swaggerPaths };

const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'B-Care API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    requestInterceptor: (req) => {
      req.headers['ngrok-skip-browser-warning'] = 'true';
      return req;
    }
  }
};

module.exports = { swaggerSpec, swaggerUi, swaggerUiOptions };
