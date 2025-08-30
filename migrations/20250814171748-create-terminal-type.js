'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('terminal_type', {
      terminal_type_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      terminal_type_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      terminal_type_name: {
        type: Sequelize.STRING(50),
        allowNull: false
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

    await queryInterface.addIndex('terminal_type', ['terminal_type_code']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('terminal_type');
  }
};