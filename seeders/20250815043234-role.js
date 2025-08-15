'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('role', [
      { role_id: 1, role_code: 'AGENT_CXC', role_name: 'CX Communication Agent', created_at: new Date(), updated_at: new Date() },
      { role_id: 2, role_code: 'ASST_DGO', role_name: 'Assistant DGO', created_at: new Date(), updated_at: new Date() },
      { role_id: 3, role_code: 'ASST_TBS', role_name: 'Assistant TBS', created_at: new Date(), updated_at: new Date() }
    ], {});
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role', null, {});
  }
};