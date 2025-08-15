'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CallLog extends Model {
    static associate(models) {
      // CallLog belongs to ticket
      CallLog.belongsTo(models.ticket, {
        foreignKey: 'ticket_id',
        as: 'ticket'
      });
      
      // CallLog belongs to employee
      CallLog.belongsTo(models.employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      
      // CallLog belongs to customer
      CallLog.belongsTo(models.customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
      
      // CallLog belongs to call status type
      CallLog.belongsTo(models.call_status_type, {
        foreignKey: 'call_status_type_id',
        as: 'call_status_type'
      });
    }
  }
  CallLog.init({
    call_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    ticket_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    customer_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    call_start: {
      type: DataTypes.DATE,
      allowNull: false
    },
    call_end: DataTypes.DATE,
    call_status_type_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'call_log',
    tableName: 'call_log',
    underscored: true
  });
  return CallLog;
};