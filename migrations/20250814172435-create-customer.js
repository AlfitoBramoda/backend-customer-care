'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customer', {
      customer_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      full_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      billing_address: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      postal_code: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      phone_number: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true
      },
      home_phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      office_phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      fax_phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      cif: {
        type: Sequelize.STRING(30),
        allowNull: true,
        unique: true
      },
      nik: {
        type: Sequelize.CHAR(16),
        allowNull: true,
        unique: true
      },
      gender_type: {
        type: Sequelize.ENUM('Male', 'Female'),
        allowNull: true
      },
      place_of_birth: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Customer indexes for common searches
    await queryInterface.addIndex('customer', ['email']);
    await queryInterface.addIndex('customer', ['phone_number']);
    await queryInterface.addIndex('customer', ['cif']);
    await queryInterface.addIndex('customer', ['nik']);
    await queryInterface.addIndex('customer', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('customer');
  }
};