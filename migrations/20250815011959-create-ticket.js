'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ticket', {
      ticket_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      ticket_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      // Tracking statuses (per UI spec)
      customer_status_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        references: {
          model: 'customer_status',
          key: 'customer_status_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      employee_status_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        references: {
          model: 'employee_status',
          key: 'employee_status_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      priority_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'priority',
          key: 'priority_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      // Channel & Source
      issue_channel_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'channel',
          key: 'channel_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      intake_source_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'source',
          key: 'source_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      // Customer & Related Entities
      customer_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'customer',
          key: 'customer_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      related_account_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'account',
          key: 'account_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      related_card_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'card',
          key: 'card_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      // Complaint & Policy
      complaint_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'complaint_category',
          key: 'complaint_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      responsible_employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'employee',
          key: 'employee_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      policy_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'complaint_policy',
          key: 'policy_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      committed_due_at: {
        type: Sequelize.DATE,
        allowNull: true
      },

      // Transaction Details
      transaction_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      terminal_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'terminal',
          key: 'terminal_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      // Timestamps & Notes
      created_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      closed_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      division_notes: {
        type: Sequelize.JSON, // Array stored as JSON in most DBs
        allowNull: true
      },
      delete_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Soft delete timestamp'
      },
      delete_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'employee',
          key: 'employee_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Employee who performed soft delete'
      },
      
      // Sequelize timestamps
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Indexes from ERD - Critical for performance
    await queryInterface.addIndex('ticket', ['ticket_number']);
    await queryInterface.addIndex('ticket', ['responsible_employee_id', 'employee_status_id']);
    await queryInterface.addIndex('ticket', ['issue_channel_id', 'complaint_id']);
    await queryInterface.addIndex('ticket', ['customer_id', 'created_time']);
    await queryInterface.addIndex('ticket', ['priority_id', 'created_time']);
    await queryInterface.addIndex('ticket', ['customer_status_id', 'created_time']);
    await queryInterface.addIndex('ticket', ['employee_status_id', 'created_time']);
    
    // Additional performance indexes
    await queryInterface.addIndex('ticket', ['created_time']);
    await queryInterface.addIndex('ticket', ['closed_time']);
    await queryInterface.addIndex('ticket', ['committed_due_at']);
    await queryInterface.addIndex('ticket', ['transaction_date']);
    await queryInterface.addIndex('ticket', ['delete_at']);
    await queryInterface.addIndex('ticket', ['delete_by']); 
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ticket');
  }
};