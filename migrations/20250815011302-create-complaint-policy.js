'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('complaint_policy', {
      policy_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      service: {
        type: Sequelize.STRING(30),
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
      complaint_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'complaint_category',
          key: 'complaint_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sla: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      uic_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'division',
          key: 'division_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      description: {
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

    // Indexes from ERD
    await queryInterface.addIndex('complaint_policy', ['channel_id', 'complaint_id', 'uic_id']);
    await queryInterface.addIndex('complaint_policy', ['service']);
    await queryInterface.addIndex('complaint_policy', ['sla']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('complaint_policy');
  }
};
