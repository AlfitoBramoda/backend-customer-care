'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Division extends Model {
    static associate(models) {
      // Division has many employees
      Division.hasMany(models.employee, {
        foreignKey: 'division_id',
        as: 'employees'
      });
      
      // Division has many complaint policies (as UIC)
      Division.hasMany(models.complaint_policy, {
        foreignKey: 'uic_id',
        as: 'complaint_policies'
      });
    }
  }
  Division.init({
    division_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    division_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    division_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'division',
    tableName: 'division',
    underscored: true
  });
  return Division;
};