'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CardStatus extends Model {
    static associate(models) {
      // CardStatus has many cards
      CardStatus.hasMany(models.card, {
        foreignKey: 'card_status_id',
        as: 'cards'
      });
    }
  }
  CardStatus.init({
    card_status_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    card_status_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    card_status_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'card_status',
    tableName: 'card_status',
    underscored: true
  });
  return CardStatus;
};