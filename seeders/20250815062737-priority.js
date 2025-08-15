'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('priority', [
      { priority_id: 1, priority_code: 'CRITICAL', priority_name: 'Critical', created_at: new Date(), updated_at: new Date() },
      { priority_id: 2, priority_code: 'HIGH', priority_name: 'High', created_at: new Date(), updated_at: new Date() },
      { priority_id: 3, priority_code: 'REGULAR', priority_name: 'Regular', created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('priority', null, {});
  }
};
