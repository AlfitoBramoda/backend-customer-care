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
        content: 'Halo, kartu saya tertelan',
        message_time: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        chat_id: 2,
        ticket_id: 2,
        sender_id: 2,
        sender_type_id: 1,
        content: 'Tarik tunai gagal tapi saldo berkurang',
        message_time: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        chat_id: 3,
        ticket_id: 3,
        sender_id: 3,
        sender_type_id: 1,
        content: 'Transfer gagal di MBANK',
        message_time: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
    ],{});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('chat_message', null, {});
  }
};
