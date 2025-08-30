'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('source', [
      { source_id: 1, source_code: 'CONTACT_CENTER', source_name: 'Contact Center', created_at: new Date(), updated_at: new Date() },
      { source_id: 2, source_code: 'CHATBOT', source_name: 'Chatbot', created_at: new Date(), updated_at: new Date() },
      { source_id: 3, source_code: 'SOSMED', source_name: 'Sosial Media', created_at: new Date(), updated_at: new Date() }
    ], {});

    // Fix sequence
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('source', 'source_id'), COALESCE(MAX(source_id), 1)) FROM source;"
    );
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
