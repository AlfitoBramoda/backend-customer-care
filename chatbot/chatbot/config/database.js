require('dotenv').config();
const { Sequelize } = require('sequelize');

// Gunakan konfigurasi database yang sama dengan main backend
const config = {
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "181022", 
  database: process.env.DB_NAME || "bni_customer_support_dev",
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 5432,
  dialect: "postgres",
  logging: console.log
};

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: config.logging
});

module.exports = sequelize;