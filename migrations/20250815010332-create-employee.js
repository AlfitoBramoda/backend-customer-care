'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee', {
      employee_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      full_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      npp: {
        type: Sequelize.CHAR(8),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'role',
          key: 'role_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      division_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'division',
          key: 'division_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      fcm_token: {
        type: Sequelize.STRING(225),
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

    // Indexes
    await queryInterface.addIndex('employee', ['email']);
    await queryInterface.addIndex('employee', ['npp']);
    await queryInterface.addIndex('employee', ['role_id']);
    await queryInterface.addIndex('employee', ['division_id']);
    await queryInterface.addIndex('employee', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employee');
  }
};