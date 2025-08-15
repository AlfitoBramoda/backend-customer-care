'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('complaint_policy', [
      {
        policy_id: 1,
        service: 'COMPLAINT',
        channel_id: 6,
        complaint_id: 5,
        sla: 1,
        uic_id: 9,
        description: 'Kendala yang dialami nasabah saat melakukan Hapus akun di menu Pengaturan  BI-FAST',
        created_at: new Date(),
        updated_at: new Date()
      },
      
    ], {});         
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('complaint_policy', null, {});
  }
};
