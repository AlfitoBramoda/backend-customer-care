'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Customer extends Model {
        static associate(models) {
            Customer.hasMany(models.Account, {
                foreignKey: 'customer_id',
                as: 'accounts'
            });
        }
    }
    
    Customer.init({
        customer_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        full_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        phone_number: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true
        }
    }, {
        sequelize,
        modelName: 'Customer',
        tableName: 'customers',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    
    return Customer;
};