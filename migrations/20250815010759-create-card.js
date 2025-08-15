'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('card', {
      card_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      account_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'account',
          key: 'account_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      card_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      card_status_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'card_status',
          key: 'card_status_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      card_type: {
        type: Sequelize.ENUM('DEBIT', 'KREDIT'),
        allowNull: true
      },
      exp_date: {
        type: Sequelize.STRING(5),
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
    await queryInterface.addIndex('card', ['card_number']);
    await queryInterface.addIndex('card', ['account_id', 'card_status_id']);
    await queryInterface.addIndex('card', ['card_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('card');
  }
};
