'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('account', [
      {
        account_id: 1,
        customer_id: 1,
        account_number: '1234567890',
        account_type_id: 1,
        is_primary: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        account_id: 2,
        customer_id: 2,
        account_number: '2234567890',
        account_type_id: 2,
        is_primary: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        account_id: 3,
        customer_id: 1,
        account_number: '3234567890',
        account_type_id: 3,
        is_primary: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        account_id: 4,
        customer_id: 3,
        account_number: '5496512384',
        account_type_id: 1,
        is_primary: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});            

    // Fix sequence
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('account', 'account_id'), COALESCE(MAX(account_id), 1)) FROM account;"
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('account', null, {});
  }
};
