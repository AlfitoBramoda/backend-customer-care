'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('chat_message', [
      {
        chat_id: 1,
        ticket_id: 1,
        sender_id: 1,
        sender_type_id: 1,
        message: 'Halo, kartu saya tertelan',
        sent_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        chat_id: 2,
        ticket_id: 2,
        sender_id: 2,
        sender_type_id: 1,
        message: 'Tarik tunai gagal tapi saldo berkurang',
        sent_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        chat_id: 3,
        ticket_id: 3,
        sender_id: 3,
        sender_type_id: 1,
        message: 'Transfer gagal di MBANK',
        sent_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
    ],{});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('chat_message', null, {});
  }
};
