'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('call_status_type', {
      call_status_type_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      call_status_code: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true
      },
      call_status_name: {
        type: Sequelize.STRING(100),
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

    await queryInterface.addIndex('call_status_type', ['call_status_code']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('call_status_type');
  }
};
