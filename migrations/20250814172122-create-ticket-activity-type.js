'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ticket_activity_type', {
      ticket_activity_type_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ticket_activity_code: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true
      },
      ticket_activity_name: {
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

    await queryInterface.addIndex('ticket_activity_type', ['ticket_activity_code']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ticket_activity_type');
  }
};
