'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    static associate(models) {
      // Employee belongs to role
      Employee.belongsTo(models.role, {
        foreignKey: 'role_id',
        as: 'role'
      });
      
      // Employee belongs to division
      Employee.belongsTo(models.division, {
        foreignKey: 'division_id',
        as: 'division'
      });
      
      // Employee has many tickets (responsible)
      Employee.hasMany(models.ticket, {
        foreignKey: 'responsible_employee_id',
        as: 'assigned_tickets'
      });
      
      // Employee has many call logs
      Employee.hasMany(models.call_log, {
        foreignKey: 'employee_id',
        as: 'call_logs'
      });
    }
  }
  Employee.init({
    employee_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    npp: {
      type: DataTypes.CHAR(8),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role_id: DataTypes.INTEGER,
    division_id: DataTypes.INTEGER,
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    fcm_token: {
      type: DataTypes.STRING(225),
      allowNull: true
    },
  }, {
    sequelize,
    modelName: 'employee',
    tableName: 'employee',
    underscored: true
  });
  return Employee;
};