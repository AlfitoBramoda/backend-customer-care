'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TicketActivityType extends Model {
    static associate(models) {
      // TicketActivityType has many ticket activities
      TicketActivityType.hasMany(models.ticket_activity, {
        foreignKey: 'ticket_activity_type_id',
        as: 'ticket_activities'
      });
    }
  }
  TicketActivityType.init({
    ticket_activity_type_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ticket_activity_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    ticket_activity_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ticket_activity_type',
    tableName: 'ticket_activity_type',
    underscored: true
  });
  return TicketActivityType;
};