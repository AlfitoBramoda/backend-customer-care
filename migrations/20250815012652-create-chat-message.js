'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_message', {
      chat_id: {
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
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      sent_at: {
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

    // Indexes for chat queries
    await queryInterface.addIndex('chat_message', ['ticket_id']);
    await queryInterface.addIndex('chat_message', ['sender_id', 'sender_type_id']);
    await queryInterface.addIndex('chat_message', ['sent_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('chat_message');
  }
};