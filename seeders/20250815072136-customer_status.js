'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('customer_status', [
      { customer_status_id: 1, customer_status_code: 'ACC', customer_status_name: 'Accepted', created_at: new Date(), updated_at: new Date() },
      { customer_status_id: 2, customer_status_code: 'VERIF', customer_status_name: 'Verification', created_at: new Date(), updated_at: new Date() },
      { customer_status_id: 3, customer_status_code: 'PROCESS', customer_status_name: 'Processing', created_at: new Date(), updated_at: new Date() },
      { customer_status_id: 4, customer_status_code: 'CLOSED', customer_status_name: 'Closed', created_at: new Date(), updated_at: new Date() },
      { customer_status_id: 5, customer_status_code: 'DECLINED', customer_status_name: 'Declined', created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('customer_status', null, {});
  }
};
