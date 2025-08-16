'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('attachment', [
      {
        attachment_id: 1,
        ticket_activity_id: 1,
        file_name: 'bukti_transfer.png',
        file_path: '/uploads/bukti_transfer.png',
        file_type: 'image/png',
        file_size: 345678,
        upload_time: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        attachment_id: 2,
        ticket_activity_id: 1,
        file_name: 'foto_atm.jpg',
        file_path: '/uploads/foto_atm.jpg',
        file_type: 'image/jpeg',
        file_size: 245678, 
        upload_time: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        attachment_id: 3,
        ticket_activity_id: 2,
        file_name: 'log_atm.txt',
        file_path: '/uploads/log_atm.txt',
        file_type: 'text/plain',
        file_size: 56789,
        upload_time: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ],{});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('attachment', null, {});
  }
};
