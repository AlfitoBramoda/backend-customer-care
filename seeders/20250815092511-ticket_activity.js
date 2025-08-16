'use strict';

const { create } = require('json-server');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ticket_activity', [
      {
        ticket_activity_id: 1,
        ticket_id: 1,
        sender_id: 1,
        sender_type_id: 1,
        ticket_activity_type_id: 1,
        content: 'Ticket dibuat oleh agent',
        ticket_activity_time: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        ticket_activity_id: 2,
        ticket_id: 2,
        sender_id: 2,
        sender_type_id: 2,
        ticket_activity_type_id: 2,
        content: 'Status diubah ke HANDLEDCXC',
        ticket_activity_time: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        ticket_activity_id: 3,
        ticket_id: 3,
        sender_id: 3,
        sender_type_id: 3,
        ticket_activity_type_id: 3,
        content: 'Lampiran bukti transaksi ditambahkan',
        ticket_activity_time: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
    ])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ticket_activity', null, {});
  }
};
