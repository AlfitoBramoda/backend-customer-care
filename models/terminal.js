'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Terminal extends Model {
    static associate(models) {
      // Terminal belongs to terminal type
      Terminal.belongsTo(models.terminal_type, {
        foreignKey: 'terminal_type_id',
        as: 'terminal_type'
      });
      
      // Terminal belongs to channel
      Terminal.belongsTo(models.channel, {
        foreignKey: 'channel_id',
        as: 'channel'
      });
      
      // Terminal has many tickets
      Terminal.hasMany(models.ticket, {
        foreignKey: 'terminal_id',
        as: 'tickets'
      });
    }
  }
  Terminal.init({
    terminal_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    terminal_code: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    terminal_type_id: DataTypes.INTEGER,
    location: DataTypes.TEXT,
    channel_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'terminal',
    tableName: 'terminal',
    underscored: true
  });
  return Terminal;
};