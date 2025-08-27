'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('employee', [
      {
        employee_id: 1,
        full_name: 'Satrio Adhi Purbo',
        email: 'satrioadhi04@gmail.com',
        npp: 'EMP00001',
        password_hash: 'hash$satrio',
        role_id: 1,
        division_id: 1,
        is_active: true,
        created_at: new Date('2025-08-11T08:00:00Z'),
        updated_at: new Date()
      },
      {
        employee_id: 2,
        full_name: 'Ester Yolanda Berutu',
        email: 'esteryolandaberutu@gmail.com',
        npp: 'EMP00002',
        password_hash: 'hash$ester',
        role_id: 4,
        division_id: 2,
        is_active: true,
        created_at: new Date('2025-08-11T08:30:00Z'),
        updated_at: new Date()
      },
      {
        employee_id: 3,
        full_name: 'Zidan Ramdhani',
        email: 'ramdhani2002@gmail.com',
        npp: 'EMP00003',
        password_hash: 'hash$zidan',
        role_id: 5,
        division_id: 3,
        is_active: true,
        created_at: new Date('2025-08-11T09:00:00Z'),
        updated_at: new Date()
      },
      {
        employee_id: 4,
        full_name: 'Havis Aprinaldi',
        email: 'havisaprinaldi25@gmail.com',
        npp: 'EMP00004',
        password_hash: 'hash$havis',
        role_id: 3,
        division_id: 4,
        is_active: true,
        created_at: new Date('2025-08-11T09:30:00Z'),
        updated_at: new Date()
      },
      {
        employee_id: 5,
        full_name: 'Naweni Gracia Elshalom Riwu',
        email: 'gracerwuu@gmail.com',
        npp: 'EMP00005',
        password_hash: 'hash$grace',
        role_id: 2,
        division_id: 5,
        is_active: true,
        created_at: new Date('2025-08-11T10:00:00Z'),
        updated_at: new Date()
      },
      {
        employee_id: 6,
        full_name: 'Monica Butarbutar',
        email: 'monicabutarbutar04@gmail.com',
        npp: 'EMP00006',
        password_hash: 'hash$monica',
        role_id: 2,
        division_id: 6,
        is_active: true,
        created_at: new Date('2025-08-11T10:30:00Z'),
        updated_at: new Date()
      },
      {
        employee_id: 7,
        full_name: 'Alfito Bramoda Deannova',
        email: 'alfitobramoda@gmail.com',
        npp: 'EMP00007',
        password_hash: 'hash$alfito',
        role_id: 2,
        division_id: 7,
        is_active: true,
        created_at: new Date('2025-08-11T11:00:00Z'),
        updated_at: new Date()
      },
      {
        employee_id: 8,
        full_name: 'Audia Maharani',
        email: 'audiamaharani02@gmail.com',
        npp: 'EMP00008',
        password_hash: 'hash$audia',
        role_id: 2,
        division_id: 8,
        is_active: true,
        created_at: new Date('2025-08-11T11:30:00Z'),
        updated_at: new Date()
      },
      {
        employee_id: 9,
        full_name: 'Dhimasdar Agdeli R.A',
        email: 'dhimasagdel@gmail.com',
        npp: 'EMP00009',
        password_hash: 'hash$samid',
        role_id: 2,
        division_id: 9,
        is_active: true,
        created_at: new Date('2025-08-11T11:00:00Z'),
        updated_at: new Date()
      },
      {
        employee_id: 10,
        full_name: 'Zidan Ramdhani Second',
        email: 'ramdhani.zidan39@gmail.com',
        npp: 'EMP00010',
        password_hash: 'hash$zidan',
        role_id: 2,
        division_id: 10,
        is_active: true,
        created_at: new Date('2025-08-11T11:00:00Z'),
        updated_at: new Date()
      },
    ], {}); 

    // Fix sequence
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('employee', 'employee_id'), COALESCE(MAX(employee_id), 1)) FROM employee;"
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('employee', null, {});
  }
};
