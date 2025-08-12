'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('accounts', [
      {
        customer_id: 1,
        account_number: '1234567890123',
        account_type: 'Tabungan',
        is_primary: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        customer_id: 1,
        account_number: '1234567890124',
        account_type: 'Kartu Kredit',
        is_primary: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        customer_id: 2,
        account_number: '1234567890125',
        account_type: 'Giro',
        is_primary: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        customer_id: 3,
        account_number: '1234567890126',
        account_type: 'Tabungan',
        is_primary: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        customer_id: 4,
        account_number: '1234567890127',
        account_type: 'Tabungan',
        is_primary: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        customer_id: 4,
        account_number: '1234567890128',
        account_type: 'Giro',
        is_primary: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        customer_id: 5,
        account_number: '1234567890129',
        account_type: 'Tabungan',
        is_primary: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        customer_id: 5,
        account_number: '1234567890130',
        account_type: 'Kartu Kredit',
        is_primary: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        customer_id: 6,
        account_number: '1234567890131',
        account_type: 'Lainnya',
        is_primary: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        customer_id: 7,
        account_number: '1234567890132',
        account_type: 'Tabungan',
        is_primary: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        customer_id: 8,
        account_number: '1234567890133',
        account_type: 'Giro',
        is_primary: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('accounts', null, {});
  }
};