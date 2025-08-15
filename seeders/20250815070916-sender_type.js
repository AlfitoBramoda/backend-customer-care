'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('sender_type', [
      { sender_type_id: 1, sender_type_code: 'CUSTOMER', sender_type_name: 'Customer', created_at: new Date(), updated_at: new Date() },
      { sender_type_id: 2, sender_type_code: 'EMPLOYEE', sender_type_name: 'Employee', created_at: new Date(), updated_at: new Date() },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('sender_type', null, {});
  }
};
