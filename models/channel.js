'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Channel extends Model {
    static associate(models) {
      // Channel has many tickets (issue_channel)
      Channel.hasMany(models.ticket, {
        foreignKey: 'issue_channel_id',
        as: 'issue_tickets'
      });
      
      // Channel has many terminals
      Channel.hasMany(models.terminal, {
        foreignKey: 'channel_id',
        as: 'terminals'
      });
      
      // Channel has many complaint policies
      Channel.hasMany(models.complaint_policy, {
        foreignKey: 'channel_id',
        as: 'complaint_policies'
      });
    }
  }
  Channel.init({
    channel_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    channel_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    channel_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    supports_terminal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'channel',
    tableName: 'channel',
    underscored: true
  });
  return Channel;
};