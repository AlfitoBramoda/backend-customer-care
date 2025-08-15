'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('account', {
      account_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      customer_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'customer',
          key: 'customer_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      account_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      account_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'account_type',
          key: 'account_type_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      is_primary: {
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

    // Indexes from ERD
    await queryInterface.addIndex('account', ['account_number']);
    await queryInterface.addIndex('account', ['customer_id', 'is_primary']);
    await queryInterface.addIndex('account', ['account_type_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('account');
  }
};