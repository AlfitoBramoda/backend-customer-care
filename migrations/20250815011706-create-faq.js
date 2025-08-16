'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('faq', {
      faq_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      channel_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'channel',
          key: 'channel_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      question: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      answer: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      keywords: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Indexes for FAQ search functionality
    await queryInterface.addIndex('faq', ['channel_id']);
    await queryInterface.addIndex('faq', ['keywords']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('faq');
  }
};