'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Priority extends Model {
    static associate(models) {
      // Priority has many tickets
      Priority.hasMany(models.ticket, {
        foreignKey: 'priority_id',
        as: 'tickets'
      });
    }
  }
  Priority.init({
    priority_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    priority_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    priority_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'priority',
    tableName: 'priority',
    underscored: true
  });
  return Priority;
};