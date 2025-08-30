'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TerminalType extends Model {
    static associate(models) {
      // TerminalType has many terminals
      TerminalType.hasMany(models.terminal, {
        foreignKey: 'terminal_type_id',
        as: 'terminals'
      });
    }
  }
  TerminalType.init({
    terminal_type_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    terminal_type_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    terminal_type_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'terminal_type',
    tableName: 'terminal_type',
    underscored: true
  });
  return TerminalType;
};