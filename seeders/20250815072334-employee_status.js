'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('employee_status', [
      { employee_status_id: 1, employee_status_code: 'OPEN', employee_status_name: 'Open', description: 'Belum dikonfirmasi', created_at: new Date(), updated_at: new Date() },
      { employee_status_id: 2, employee_status_code: 'HANDLEDCXC', employee_status_name: 'Handled by CxC', description: 'Ditangani Agent', created_at: new Date(), updated_at: new Date() },
      { employee_status_id: 3, employee_status_code: 'ESCALATED', employee_status_name: 'Escalated', description: 'Eskalasi ke divisi terkait', created_at: new Date(), updated_at: new Date() },
      { employee_status_id: 4, employee_status_code: 'CLOSED', employee_status_name: 'Closed', description: 'Ticket sudah selesai', created_at: new Date(), updated_at: new Date() },
      { employee_status_id: 5, employee_status_code: 'DECLINED', employee_status_name: 'Declined', description: 'Ditolak atau tidak valid', created_at: new Date(), updated_at: new Date() },
      { employee_status_id: 6, employee_status_code: 'DONE_BY_UIC', employee_status_name: 'Done by UIC', description: 'UIC done ticket', created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('employee_status', null, {});
  }
};
