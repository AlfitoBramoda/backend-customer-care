'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      // Role has many employees
      Role.hasMany(models.employee, {
        foreignKey: 'role_id',
        as: 'employees'
      });
    }
  }
  Role.init({
    role_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    role_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    role_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'role',
    tableName: 'role',
    underscored: true
  });
  return Role;
};