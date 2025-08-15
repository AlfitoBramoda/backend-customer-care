'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ticket_activity', {
      ticket_activity_id: {
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
      sender_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      sender_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sender_type',
          key: 'sender_type_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      ticket_activity_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ticket_activity_type',
          key: 'ticket_activity_type_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ticket_activity_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
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

    // Indexes for activity queries
    await queryInterface.addIndex('ticket_activity', ['ticket_id']);
    await queryInterface.addIndex('ticket_activity', ['sender_id', 'sender_type_id']);
    await queryInterface.addIndex('ticket_activity', ['ticket_activity_type_id']);
    await queryInterface.addIndex('ticket_activity', ['ticket_activity_time']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ticket_activity');
  }
};