'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ticket', [
      {
        ticket_id: 1,
        ticket_number: 'BNI-00001',
        description: 'Kartu nasabah tertelan di ATM',
        customer_status_id: 1,
        employee_status_id: 1,
        priority_id: 2,
        issue_channel_id: 1,
        intake_source_id: 1,
        customer_id: 1,
        related_account_id: 1,
        related_card_id: 1,
        complaint_id: 1,
        responsible_employee_id: 1,
        policy_id: 1,
        committed_due_at: new Date(),
        transaction_date: new Date(),
        amount: 0,
        terminal_id: 1,
        created_time: new Date(),
        closed_time: new Date(),
        division_notes: JSON.stringify([
          {
            division: 'CXC',
            timestamp: '2025-08-14',
            msg: 'Tolong di cek untuk case ini nasabah mengalami special case di bagian ATM',
            author: 'Ratna'
          },
          {
            division: 'DGO',
            timestamp: '2025-08-14',
            msg: 'Oke sudah di cek dan semua aman',
            author: 'Ari'
          }
        ]),
        record: '',
        reason: '',
        solution: '',
        delete_at: null,
        delete_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        ticket_id: 2,
        ticket_number: 'BNI-00002',
        description: 'Gagal tarik tunai, saldo terdebet',
        customer_status_id: 2,
        employee_status_id: 2,
        priority_id: 1,
        issue_channel_id: 1,
        intake_source_id: 3,
        customer_id: 2,
        related_account_id: 2,
        related_card_id: 3,
        complaint_id: 2,
        responsible_employee_id: 2,
        policy_id: 2,
        committed_due_at: new Date(),
        transaction_date: new Date(),
        amount: 1500000,
        terminal_id: 2,
        created_time: new Date(),
        closed_time: new Date(),
        division_notes: JSON.stringify([
          {
            division: 'CXC',
            timestamp: '2025-08-14',
            msg: 'Tolong di cek untuk case ini nasabah mengalami special case di bagian ATM',
            author: 'Ratna'
          },
          {
            division: 'DGO',
            timestamp: '2025-08-14',
            msg: 'Oke sudah di cek dan semua aman',
            author: 'Ari'
          }
        ]),
        record: '',
        reason: '',
        solution: '',
        delete_at: null,
        delete_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        ticket_id: 3,
        ticket_number: 'BNI-00003',
        description: 'Transfer MBANK gagal tetapi saldo terdebet',
        customer_status_id: 2,
        employee_status_id: 2,
        priority_id: 3,
        issue_channel_id: 3,
        intake_source_id: 2,
        customer_id: 3,
        related_account_id: 2,
        related_card_id: null,
        complaint_id: 3,
        responsible_employee_id: 3,
        policy_id: 3,
        committed_due_at: new Date(),
        transaction_date: new Date(),
        amount: 250000,
        terminal_id: null,
        created_time: new Date(),
        closed_time: new Date(),
        division_notes: JSON.stringify([
          {
            division: 'CXC',
            timestamp: '2025-08-14',
            msg: 'Tolong di cek untuk case ini nasabah mengalami special case di bagian ATM',
            author: 'Ratna'
          },
          {
            division: 'DGO',
            timestamp: '2025-08-14',
            msg: 'Oke sudah di cek dan semua aman',
            author: 'Ari'
          }
        ]),
        record: '',
        reason: '',
        solution: '',
        delete_at: null,
        delete_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
    ],{});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ticket', null, {});
  }
};
