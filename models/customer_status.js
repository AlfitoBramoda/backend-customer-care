'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CustomerStatus extends Model {
    static associate(models) {
      // CustomerStatus has many tickets
      CustomerStatus.hasMany(models.ticket, {
        foreignKey: 'customer_status_id',
        as: 'tickets'
      });
    }
  }
  CustomerStatus.init({
    customer_status_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customer_status_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    customer_status_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'customer_status',
    tableName: 'customer_status',
    underscored: true
  });
  return CustomerStatus;
};