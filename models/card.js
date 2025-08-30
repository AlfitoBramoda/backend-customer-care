'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Card extends Model {
    static associate(models) {
      // Card belongs to account
      Card.belongsTo(models.account, {
        foreignKey: 'account_id',
        as: 'account'
      });
      
      // Card belongs to card status
      Card.belongsTo(models.card_status, {
        foreignKey: 'card_status_id',
        as: 'card_status'
      });
      
      // Card has many tickets (related)
      Card.hasMany(models.ticket, {
        foreignKey: 'related_card_id',
        as: 'related_tickets'
      });
    }
  }
  Card.init({
    card_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    account_id: DataTypes.BIGINT,
    card_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    card_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    card_type: {
      type: DataTypes.ENUM('DEBIT', 'KREDIT'),
      allowNull: true
    },
    exp_date: DataTypes.STRING(5)
  }, {
    sequelize,
    modelName: 'card',
    tableName: 'card',
    underscored: true
  });
  return Card;
};