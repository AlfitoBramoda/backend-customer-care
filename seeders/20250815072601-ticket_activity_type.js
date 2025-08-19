'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ticket_activity_type', [
      { ticket_activity_type_id: 1, ticket_activity_code: 'COMMENT', ticket_activity_name: 'Comment', created_at: new Date(), updated_at: new Date() },
      { ticket_activity_type_id: 2, ticket_activity_code: 'STATUS_CHANGE', ticket_activity_name: 'Status Change', created_at: new Date(), updated_at: new Date() },
      { ticket_activity_type_id: 3, ticket_activity_code: 'ATTACHMENT', ticket_activity_name: 'Attachment', created_at: new Date(), updated_at: new Date() },
      { ticket_activity_type_id: 4, ticket_activity_code: 'DELETE', ticket_activity_name: 'Ticket Deletion', created_at: new Date(), updated_at: new Date() },

    ], {}); 
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ticket_activity_type', null, {});
  }
};
