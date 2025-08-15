'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('customer', [
      {
        customer_id: 1,
        full_name: 'Andi Saputra',
        email: 'andi.saputra@example.com',
        password_hash: 'hash$andi',
        address: 'Jl. Merdeka No. 10, Jakarta',
        billing_address: 'Jl. Merdeka No. 10, Jakarta',
        postal_code: '10110',
        phone_number: '081234567890',
        home_phone: '0215551234',
        office_phone: '0215554321',
        fax_phone: '0215556789',
        cif: 'CIF00001',
        nik: '3201010101010001',
        gender_type: 'Male',
        place_of_birth: 'Jakarta',
        created_at: new Date('2025-08-14T08:00:00Z'),
        updated_at: new Date()
      },
      {
        customer_id: 2,
        full_name: 'Siti Nurhaliza',
        email: 'siti.nurhaliza@example.com',
        password_hash: 'hash$siti',
        address: 'Jl. Diponegoro No. 5, Bandung',
        billing_address: 'Jl. Diponegoro No. 5, Bandung',
        postal_code: '40115',
        phone_number: '082233344455',
        home_phone: '0221234567',
        office_phone: '0227654321',
        fax_phone: '0225556667',
        cif: 'CIF00002',
        nik: '3202020202020002',
        gender_type: 'Female',
        place_of_birth: 'Bandung',
        created_at: new Date('2025-08-14T08:02:00Z'),
        updated_at: new Date()
      },
      {
        customer_id: 3,
        full_name: 'Rudi Hartono',
        email: 'rudi.hartono@example.com',
        password_hash: 'hash$rudi',
        address: 'Jl. Sudirman No. 77, Surabaya',
        billing_address: 'Jl. Sudirman No. 77, Surabaya',
        postal_code: '60271',
        phone_number: '083311122233',
        home_phone: '031778899',
        office_phone: '031998877',
        fax_phone: '031445566',
        cif: 'CIF00003',
        nik: '3578010101010003',
        gender_type: 'Male',
        place_of_birth: 'Surabaya',
        created_at: new Date('2025-08-14T08:04:00Z'),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('customer', null, {});
  }
};
