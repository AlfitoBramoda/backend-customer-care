'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('call_log', {
      call_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      ticket_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'ticket',
          key: 'ticket_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'employee',
          key: 'employee_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      customer_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'customer',
          key: 'customer_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      call_start: {
        type: Sequelize.DATE,
        allowNull: false
      },
      call_end: {
        type: Sequelize.DATE,
        allowNull: true
      },
      call_status_type_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'call_status_type',
          key: 'call_status_type_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
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

    // Indexes from ERD
    await queryInterface.addIndex('call_log', ['ticket_id']);
    await queryInterface.addIndex('call_log', ['employee_id']);
    await queryInterface.addIndex('call_log', ['customer_id']);
    await queryInterface.addIndex('call_log', ['call_start']);
    await queryInterface.addIndex('call_log', ['call_status_type_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('call_log');
  }
};