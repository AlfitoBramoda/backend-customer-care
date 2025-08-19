'use strict';

const account = require('../models/account');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('card', [
      {
        card_id: 1,
        account_id: 1,
        card_number: '4111111111111111',
        card_status_id: 1,
        card_type: 'DEBIT',
        exp_date: '12/27',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        card_id: 2,
        account_id: 3,
        card_number: '5500000000000004',
        card_status_id: 1,
        card_type: 'KREDIT',
        exp_date: '06/28',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        card_id: 3,
        account_id: 2,
        card_number: '4000000000000028',
        card_status_id: 2,
        card_type: 'DEBIT',
        exp_date: '09/26',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('card', null, {});
  }
};
