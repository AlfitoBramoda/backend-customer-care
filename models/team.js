'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Team extends Model {
        static associate(models) {
        Team.hasMany(models.Agent, {
            foreignKey: 'team_id',
            as: 'agents'
        });
        }
    }
    
    Team.init({
        team_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        team_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Team',
        tableName: 'teams',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    
    return Team;
};