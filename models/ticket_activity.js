'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TicketActivity extends Model {
    static associate(models) {
      // TicketActivity belongs to ticket
      TicketActivity.belongsTo(models.ticket, {
        foreignKey: 'ticket_id',
        as: 'ticket'
      });
      
      // TicketActivity belongs to sender type
      TicketActivity.belongsTo(models.sender_type, {
        foreignKey: 'sender_type_id',
        as: 'sender_type'
      });
      
      // TicketActivity belongs to activity type
      TicketActivity.belongsTo(models.ticket_activity_type, {
        foreignKey: 'ticket_activity_type_id',
        as: 'activity_type'
      });
      
      // TicketActivity has many attachments
      TicketActivity.hasMany(models.attachment, {
        foreignKey: 'ticket_activity_id',
        as: 'attachments'
      });
    }
  }
  TicketActivity.init({
    ticket_activity_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    ticket_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    sender_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    sender_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ticket_activity_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    content: DataTypes.TEXT,
    ticket_activity_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'ticket_activity',
    tableName: 'ticket_activity',
    underscored: true
  });
  return TicketActivity;
};