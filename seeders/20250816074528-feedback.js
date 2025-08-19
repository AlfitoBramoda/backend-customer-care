'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('feedback', [
      {
        feedback_id: 1,
        ticket_id: 1,
        score: 5,
        comment: 'Pelayanan cepat',
        submit_time: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        feedback_id: 2,
        ticket_id: 2,
        score: 3,
        comment: 'Prosesnya lama',
        submit_time: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        feedback_id: 3,
        ticket_id: 3,
        score: 5,
        comment: 'Informasi jelas dari agent',
        submit_time: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ],{});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('feedback', null, {});
  }
};
