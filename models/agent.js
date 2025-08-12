'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Agent extends Model {
        static associate(models) {
        Agent.belongsTo(models.Team, {
            foreignKey: 'team_id',
            as: 'team'
        });
        }
    }
    
    Agent.init({
        agent_id: {
            type: DataTypes.INTEGER,
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
        role: {
            type: DataTypes.ENUM('Frontline', 'Back Office', 'Manajer', 'QA'),
            allowNull: false
        },
        team_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'Agent',
        tableName: 'agents',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    
    return Agent;
};