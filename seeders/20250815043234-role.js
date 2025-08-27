'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('role', [
      { role_id: 1, role_code: 'AGENT_CXC', role_name: 'CX Communication Agent', created_at: new Date(), updated_at: new Date() },
      { role_id: 2, role_code: 'ASST_DGO', role_name: 'Assistant DGO', created_at: new Date(), updated_at: new Date() },
      { role_id: 3, role_code: 'ASST_TBS', role_name: 'Assistant TBS', created_at: new Date(), updated_at: new Date() },
      { role_id: 4, role_code: 'ASST_BCC', role_name: 'Assistant BCC', created_at: new Date(), updated_at: new Date() },
      { role_id: 5, role_code: 'ASST_OPR', role_name: 'Assistant OPR', created_at: new Date(), updated_at: new Date() },
    ], {});

    // Fix sequence
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('role', 'role_id'), COALESCE(MAX(role_id), 1)) FROM role;"
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role', null, {});
  }
};