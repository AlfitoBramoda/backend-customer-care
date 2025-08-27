'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('account_type', [
      { account_type_id: 1, account_type_code: 'TABUNGAN', account_type_name: 'Tabungan', created_at: new Date(), updated_at: new Date() },
      { account_type_id: 2, account_type_code: 'GIRO', account_type_name: 'Giro', created_at: new Date(), updated_at: new Date() },
      { account_type_id: 3, account_type_code: 'CREDIT', account_type_name: 'Kartu Kredit', created_at: new Date(), updated_at: new Date() }
    ], {});

    // Fix sequence
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('account_type', 'account_type_id'), COALESCE(MAX(account_type_id), 1)) FROM account_type;"
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('account_type', null, {});
  }
};
