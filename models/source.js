'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Source extends Model {
    static associate(models) {
      // Source has many tickets (intake_source)
      Source.hasMany(models.ticket, {
        foreignKey: 'intake_source_id',
        as: 'intake_tickets'
      });
    }
  }
  Source.init({
    source_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    source_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    source_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'source',
    tableName: 'source',
    underscored: true
  });
  return Source;
};