'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AccountType extends Model {
    static associate(models) {
      // AccountType has many accounts
      AccountType.hasMany(models.account, {
        foreignKey: 'account_type_id',
        as: 'accounts'
      });
    }
  }
  AccountType.init({
    account_type_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    account_type_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    account_type_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'account_type',
    tableName: 'account_type',
    underscored: true
  });
  return AccountType;
};
