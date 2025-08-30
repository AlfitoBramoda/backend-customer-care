'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('complaint_category', {
      complaint_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      complaint_code: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      complaint_name: {
        type: Sequelize.STRING(200),
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

    await queryInterface.addIndex('complaint_category', ['complaint_code']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('complaint_category');
  }
};