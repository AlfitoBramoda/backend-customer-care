'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('sender_type', [
      { sender_type_id: 1, sender_type_code: 'CUSTOMER', sender_type_name: 'Customer', created_at: new Date(), updated_at: new Date() },
      { sender_type_id: 2, sender_type_code: 'EMPLOYEE', sender_type_name: 'Employee', created_at: new Date(), updated_at: new Date() },
    ], {});

    // Fix sequence
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('sender_type', 'sender_type_id'), COALESCE(MAX(sender_type_id), 1)) FROM sender_type;"
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('sender_type', null, {});
  }
};
