'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Account extends Model {
        static associate(models) {
        Account.belongsTo(models.Customer, {
            foreignKey: 'customer_id',
            as: 'customer'
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
        account_type: {
            type: DataTypes.ENUM('Tabungan', 'Giro', 'Kartu Kredit', 'Lainnya'),
            allowNull: false
        },
        is_primary: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'Account',
        tableName: 'accounts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    
    return Account;
};