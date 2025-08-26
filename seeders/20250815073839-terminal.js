'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('terminal', [
      {
        terminal_id: 1,
        terminal_code: 'ATM001',
        terminal_type_id: 1,
        location: 'Jakarta Pusat',
        channel_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        terminal_id: 2,
        terminal_code: 'ATM002',
        terminal_type_id: 1,
        location: 'Bandung Dago',
        channel_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        terminal_id: 3,
        terminal_code: 'CRM101',
        terminal_type_id: 2,
        location: 'Surabaya Darmo',
        channel_id: 3,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('terminal', null, {});
  }
};
