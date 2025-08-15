'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('call_status_type', [
      { call_status_type_id: 1, call_status_code: 'CONNECTED', call_status_name: 'Connected', created_at: new Date(), updated_at: new Date() },
      { call_status_type_id: 2, call_status_code: 'MISSED', call_status_name: 'Missed', created_at: new Date(), updated_at: new Date() },
      { call_status_type_id: 3, call_status_code: 'FAILED', call_status_name: 'Failed', created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('call_status_type', null, {});
  }
};
