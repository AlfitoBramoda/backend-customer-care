'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ticket_activity_type', [
      { ticket_activity_type_id: 1, ticket_activity_code: 'COMMENT', ticket_activity_name: 'Comment', created_at: new Date(), updated_at: new Date() },
      { ticket_activity_type_id: 2, ticket_activity_code: 'STATUS_CHANGE', ticket_activity_name: 'Status Change', created_at: new Date(), updated_at: new Date() },
      { ticket_activity_type_id: 3, ticket_activity_code: 'ATTACHMENT', ticket_activity_name: 'Attachment', created_at: new Date(), updated_at: new Date() },
      { ticket_activity_type_id: 4, ticket_activity_code: 'EMAIL_SENT', ticket_activity_name: 'Email Sent', created_at: new Date(), updated_at: new Date() },
      { ticket_activity_type_id: 5, ticket_activity_code: 'NOTIFICATION', ticket_activity_name: 'Notification', created_at: new Date(), updated_at: new Date() },
    ], {}); 

    // Fix sequence
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('ticket_activity_type', 'ticket_activity_type_id'), COALESCE(MAX(ticket_activity_type_id), 1)) FROM ticket_activity_type;"
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ticket_activity_type', null, {});
  }
};
