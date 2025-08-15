'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ticket_activity', [
      {
        
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ticket_activity', null, {});
  }
};
