'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await queryInterface.bulkInsert('agents', [
      {
        full_name: 'Agent Smith',
        email: 'agent.smith@bni.co.id',
        password_hash: passwordHash,
        role: 'Frontline',
        team_id: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Agent Johnson',
        email: 'agent.johnson@bni.co.id',
        password_hash: passwordHash,
        role: 'Back Office',
        team_id: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Agent Brown',
        email: 'agent.brown@bni.co.id',
        password_hash: passwordHash,
        role: 'Manajer',
        team_id: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Agent Davis',
        email: 'agent.davis@bni.co.id',
        password_hash: passwordHash,
        role: 'Frontline',
        team_id: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Agent Wilson',
        email: 'agent.wilson@bni.co.id',
        password_hash: passwordHash,
        role: 'QA',
        team_id: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Agent Taylor',
        email: 'agent.taylor@bni.co.id',
        password_hash: passwordHash,
        role: 'Back Office',
        team_id: 5,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Agent Anderson',
        email: 'agent.anderson@bni.co.id',
        password_hash: passwordHash,
        role: 'Frontline',
        team_id: 6,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Agent White',
        email: 'agent.white@bni.co.id',
        password_hash: passwordHash,
        role: 'Manajer',
        team_id: 7,
        is_active: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        full_name: 'Agent Garcia',
        email: 'agent.garcia@bni.co.id',
        password_hash: passwordHash,
        role: 'QA',
        team_id: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('agents', null, {});
  }
};