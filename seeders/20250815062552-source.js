'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('source', [
      { source_id: 1, source_code: 'CONTACT_CENTER', source_name: 'Contact Center', created_at: new Date(), updated_at: new Date() },
      { source_id: 2, source_code: 'CHATBOT', source_name: 'Chatbot', created_at: new Date(), updated_at: new Date() },
      { source_id: 3, source_code: 'SOSMED', source_name: 'Sosial Media', created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('source', null, {});
  }
};
