'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('card_status', [
      { card_status_id: 1, card_status_code: 'ACTIVE', card_status_name: 'Active', created_at: new Date(), updated_at: new Date() },
      { card_status_id: 2, card_status_code: 'BLOCKED', card_status_name: 'Blocked', created_at: new Date(), updated_at: new Date() },
      { card_status_id: 3, card_status_code: 'CLOSED', card_status_name: 'Closed', created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('card_status', null, {});
  }
};
