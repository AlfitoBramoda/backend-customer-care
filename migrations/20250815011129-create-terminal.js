'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('terminal', {
      terminal_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      terminal_code: {
        type: Sequelize.STRING(32),
        allowNull: false,
        unique: true
      },
      terminal_type_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'terminal_type',
          key: 'terminal_type_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      location: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Indexes
    await queryInterface.addIndex('terminal', ['terminal_code']);
    await queryInterface.addIndex('terminal', ['terminal_type_id']);
    await queryInterface.addIndex('terminal', ['channel_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('terminal');
  }
};