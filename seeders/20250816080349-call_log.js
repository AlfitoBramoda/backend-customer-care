'use strict';

const { create } = require('json-server');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('call_log', null, {});
  }
};
