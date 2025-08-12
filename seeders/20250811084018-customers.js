'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await queryInterface.bulkInsert('customers', [
      {
        full_name: 'John Customer',
        email: 'john@email.com',
        password_hash: passwordHash,
        phone_number: '+6281234567890',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Jane Priority',
        email: 'jane@email.com',
        password_hash: passwordHash,
        phone_number: '+6281234567891',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Corporate Client PT ABC',
        email: 'corp@company.com',
        password_hash: passwordHash,
        phone_number: '+6281234567892',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Ahmad Wijaya',
        email: 'ahmad.wijaya@gmail.com',
        password_hash: passwordHash,
        phone_number: '+6281234567893',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Siti Nurhaliza',
        email: 'siti.nurhaliza@yahoo.com',
        password_hash: passwordHash,
        phone_number: '+6281234567894',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Budi Santoso',
        email: 'budi.santoso@outlook.com',
        password_hash: passwordHash,
        phone_number: '+6281234567895',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Rina Kusuma',
        email: 'rina.kusuma@gmail.com',
        password_hash: passwordHash,
        phone_number: '+6281234567896',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Dedi Kurniawan',
        email: 'dedi.kurniawan@email.com',
        password_hash: passwordHash,
        phone_number: '+6281234567897',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('customers', null, {});
  }
};