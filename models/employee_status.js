'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EmployeeStatus extends Model {
    static associate(models) {
      // EmployeeStatus has many tickets
      EmployeeStatus.hasMany(models.ticket, {
        foreignKey: 'employee_status_id',
        as: 'tickets'
      });
    }
  }
  EmployeeStatus.init({
    employee_status_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employee_status_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    employee_status_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'employee_status',
    tableName: 'employee_status',
    underscored: true
  });
  return EmployeeStatus;
};