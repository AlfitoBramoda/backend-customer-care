'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatMessage extends Model {
    static associate(models) {
      // ChatMessage belongs to ticket
      ChatMessage.belongsTo(models.ticket, {
        foreignKey: 'ticket_id',
        as: 'ticket'
      });
      
      // ChatMessage belongs to sender type
      ChatMessage.belongsTo(models.sender_type, {
        foreignKey: 'sender_type_id',
        as: 'sender_type'
      });
    }
  }
  ChatMessage.init({
    chat_id: {
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
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'chat_message',
    tableName: 'chat_message',
    underscored: true
  });
  return ChatMessage;
};