const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ChatMessage extends Model {}

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
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ChatMessage;