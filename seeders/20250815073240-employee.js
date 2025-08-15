'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('employee', [
      {
        employee_id: 1,
        full_name: 'Budi Hartono',
        email: 'budi.hartono@example.com',
        npp: 'EMP00001',
        password_hash: 'hash$budi',
        role_id: 1,
        division_id: 1,
        is_active: true,
        created_at: new Date('2025-08-14T08:05:00Z'),
        updated_at: new Date()
      },
      {
        employee_id: 2,
        full_name: 'Lina Oktavia',
        email: 'lina.oktavia@example.com',
        npp: 'EMP00002',
        password_hash: 'hash$lina',
        role_id: 2,
        division_id: 2,
        is_active: true,
        created_at: new Date('2025-08-14T08:06:00Z'),
        updated_at: new Date()
      },
      {
        employee_id: 3,
        full_name: 'Agus Salim',
        email: 'agus.salim@example.com',
        npp: 'EMP00003',
        password_hash: 'hash$agus',
        role_id: 3,
        division_id: 3,
        is_active: true,
        created_at: new Date('2025-08-14T08:07:00Z'),
        updated_at: new Date()
      }
    ], {}); 
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('employee', null, {});
  }
};
