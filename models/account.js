'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    static associate(models) {
      // Account belongs to customer
      Account.belongsTo(models.customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
      
      // Account belongs to account type
      Account.belongsTo(models.account_type, {
        foreignKey: 'account_type_id',
        as: 'account_type'
      });
      
      // Account has many cards
      Account.hasMany(models.card, {
        foreignKey: 'account_id',
        as: 'cards'
      });
      
      // Account has many tickets (related)
      Account.hasMany(models.ticket, {
        foreignKey: 'related_account_id',
        as: 'related_tickets'
      });
    }
  }
  Account.init({
    account_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    customer_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    account_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    account_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'account',
    tableName: 'account',
    underscored: true
  });
  return Account;
};
