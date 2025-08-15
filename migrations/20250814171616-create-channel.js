'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('channel', {
      channel_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      channel_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      channel_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      supports_terminal: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    await queryInterface.addIndex('channel', ['channel_code']);
    await queryInterface.addIndex('channel', ['supports_terminal']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('channel');
  }
};