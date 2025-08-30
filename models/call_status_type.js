'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CallStatusType extends Model {
    static associate(models) {
      // CallStatusType has many call logs
      CallStatusType.hasMany(models.call_log, {
        foreignKey: 'call_status_type_id',
        as: 'call_logs'
      });
    }
  }
  CallStatusType.init({
    call_status_type_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    call_status_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    call_status_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'call_status_type',
    tableName: 'call_status_type',
    underscored: true
  });
  return CallStatusType;
};
