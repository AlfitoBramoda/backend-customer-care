'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('accounts', { 
      account_id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      customer_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'customers',
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
      account_type: {
        type: Sequelize.ENUM('Tabungan', 'Giro', 'Kartu Kredit', 'Lainnya'),
        allowNull: false
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('accounts', ['customer_id']);
    await queryInterface.addIndex('accounts', ['account_number']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('accounts');
  }
};
