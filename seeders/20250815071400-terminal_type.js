'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('terminal_type', [
      { terminal_type_id: 1, terminal_type_code: 'ATM', terminal_type_name: 'ATM', created_at: new Date(), updated_at: new Date() },
      { terminal_type_id: 2, terminal_type_code: 'CRM', terminal_type_name: 'CRM', created_at: new Date(), updated_at: new Date() },
    ], {});

    // Fix sequence
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('terminal_type', 'terminal_type_id'), COALESCE(MAX(terminal_type_id), 1)) FROM terminal_type;"
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('terminal_type', null, {});
  }
};
