'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('division', [
      { channel_id: 1, channel_code: 'ATM', channel_name: 'Automated Teller Machine', supports_terminal: true, created_at: new Date(), updated_at: new Date() },
      { channel_id: 2, channel_code: 'TAPCASH', channel_name: 'BNI Tapcash', supports_terminal: false, created_at: new Date(), updated_at: new Date() },
      { channel_id: 3, channel_code: 'CRM', channel_name: 'Cash Recycling Machine', supports_terminal: true, created_at: new Date(), updated_at: new Date() },
      { channel_id: 4, channel_code: 'DISPUTE_DEBIT', channel_name: 'DISPUTE KARTU DEBIT', supports_terminal: false, created_at: new Date(), updated_at: new Date() },
      { channel_id: 5, channel_code: 'IBANK', channel_name: 'Internet Banking', supports_terminal: false, created_at: new Date(), updated_at: new Date() },
      { channel_id: 6, channel_code: 'MBANK', channel_name: 'Mobile Banking', supports_terminal: false, created_at: new Date(), updated_at: new Date() },
      { channel_id: 7, channel_code: 'MTUNAI', channel_name: 'Mobile Tunai', supports_terminal: false, created_at: new Date(), updated_at: new Date() },
      { channel_id: 8, channel_code: 'MTUNAI_ALFAMART', channel_name: 'Mobile Tunai Alfamart', supports_terminal: false, created_at: new Date(), updated_at: new Date() },
      { channel_id: 9, channel_code: 'QRIS_DEBIT', channel_name: 'QRIS Kartu Debit', supports_terminal: false, created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('channel', null, {});
  }
};
