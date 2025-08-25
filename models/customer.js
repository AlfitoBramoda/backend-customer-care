'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
      // Customer has many accounts
      Customer.hasMany(models.account, {
        foreignKey: 'customer_id',
        as: 'accounts'
      });
      
      // Customer has many tickets
      Customer.hasMany(models.ticket, {
        foreignKey: 'customer_id',
        as: 'tickets'
      });
      
      // Customer has many call logs
      Customer.hasMany(models.call_log, {
        foreignKey: 'customer_id',
        as: 'call_logs'
      });
    }
  }
  Customer.init({
    customer_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    address: DataTypes.STRING(255),
    billing_address: DataTypes.STRING(255),
    postal_code: DataTypes.STRING(10),
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true
    },
    home_phone: DataTypes.STRING(20),
    office_phone: DataTypes.STRING(20),
    fax_phone: DataTypes.STRING(20),
    cif: {
      type: DataTypes.STRING(30),
      allowNull: true,
      unique: true
    },
    nik: {
      type: DataTypes.CHAR(16),
      allowNull: true,
      unique: true
    },
    gender_type: {
      type: DataTypes.ENUM('Male', 'Female'),
      allowNull: true
    },
    place_of_birth: DataTypes.STRING(255),
    fcm_token: {
      type: DataTypes.STRING(225),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'customer',
    tableName: 'customer',
    underscored: true
  });
  return Customer;
};