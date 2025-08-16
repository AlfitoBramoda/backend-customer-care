'use strict';

const { create } = require('json-server');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('call_log', [
      {
        call_id: 1,
        ticket_id: 1,
        employee_id: 1,
        customer_id: 1,
        call_start: '2025-08-14T08:40:00Z',
        call_end: '2025-08-14T08:45:00Z',
        call_status_type_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        call_id: 2,
        ticket_id: 2,
        employee_id: 2,
        customer_id: 2,
        call_start: '2025-08-14T08:50:00Z',
        call_end: ' ',
        call_status_type_id: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        call_id: 3,
        ticket_id: 3,
        employee_id: 3,
        customer_id: 3,
        call_start: '2025-08-14T09:00:00Z',
        call_end: '2025-08-14T09:06:00Z',
        call_status_type_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ],{});  
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('call_log', null, {});
  }
};
