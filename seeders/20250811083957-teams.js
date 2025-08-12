'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('teams', [
      {
        team_name: 'Customer Service Team 1',
        description: 'Primary customer service team for general inquiries',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        team_name: 'Technical Support Team',
        description: 'Technical support for digital banking issues',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        team_name: 'Complaint Resolution Team',
        description: 'Specialized team for handling complaints',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        team_name: 'VIP Customer Service',
        description: 'Premium service team for priority banking customers',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        team_name: 'Digital Banking Support',
        description: 'Support team for mobile and internet banking issues',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        team_name: 'Credit Card Team',
        description: 'Specialized team for credit card related inquiries',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        team_name: 'Corporate Banking Team',
        description: 'Business and corporate customer service team',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('teams', null, {});
  }
};