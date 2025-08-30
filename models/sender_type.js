'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SenderType extends Model {
    static associate(models) {
      // SenderType has many ticket activities
      SenderType.hasMany(models.ticket_activity, {
        foreignKey: 'sender_type_id',
        as: 'ticket_activities'
      });
      
      // SenderType has many chat messages
      SenderType.hasMany(models.chat_message, {
        foreignKey: 'sender_type_id',
        as: 'chat_messages'
      });
    }
  }
  SenderType.init({
    sender_type_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sender_type_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    sender_type_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'sender_type',
    tableName: 'sender_type',
    underscored: true
  });
  return SenderType;
};