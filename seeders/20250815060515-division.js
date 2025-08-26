'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('division', [
      { division_id: 1, division_code: 'CXC', division_name: 'CX Communication', created_at: new Date(), updated_at: new Date() },
      { division_id: 2, division_code: 'BCC', division_name: 'BCC Customer Care', created_at: new Date(), updated_at: new Date() },
      { division_id: 3, division_code: 'OPR', division_name: 'Divisi OPR', created_at: new Date(), updated_at: new Date() },
      { division_id: 4, division_code: 'TBS', division_name: 'Divisi TBS', created_at: new Date(), updated_at: new Date() },
      { division_id: 5, division_code: 'UIC1', division_name: 'DGO USER 1', created_at: new Date(), updated_at: new Date() }, 
      { division_id: 6, division_code: 'UIC3', division_name: 'DGO USER 3', created_at: new Date(), updated_at: new Date() }, 
      { division_id: 7, division_code: 'UIC6', division_name: 'DGO USER 6', created_at: new Date(), updated_at: new Date() }, 
      { division_id: 8, division_code: 'UIC7', division_name: 'DGO USER 7', created_at: new Date(), updated_at: new Date() }, 
      { division_id: 9, division_code: 'UIC8', division_name: 'DGO USER 8', created_at: new Date(), updated_at: new Date() }, 
      { division_id: 10, division_code: 'UIC10', division_name: 'DGO USER 10', created_at: new Date(), updated_at: new Date() }
    ],{});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('division', null, {});
  }
};
