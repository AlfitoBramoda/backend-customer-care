'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ComplaintPolicy extends Model {
    static associate(models) {
      // ComplaintPolicy belongs to channel
      ComplaintPolicy.belongsTo(models.channel, {
        foreignKey: 'channel_id',
        as: 'channel'
      });
      
      // ComplaintPolicy belongs to complaint category
      ComplaintPolicy.belongsTo(models.complaint_category, {
        foreignKey: 'complaint_id',
        as: 'complaint_category'
      });
      
      // ComplaintPolicy belongs to division (UIC)
      ComplaintPolicy.belongsTo(models.division, {
        foreignKey: 'uic_id',
        as: 'uic_division'
      });
      
      // ComplaintPolicy has many tickets
      ComplaintPolicy.hasMany(models.ticket, {
        foreignKey: 'policy_id',
        as: 'tickets'
      });
    }
  }
  ComplaintPolicy.init({
    policy_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    service: DataTypes.STRING(30),
    channel_id: DataTypes.INTEGER,
    complaint_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sla: DataTypes.INTEGER,
    uic_id: DataTypes.INTEGER,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'complaint_policy',
    tableName: 'complaint_policy',
    underscored: true
  });
  return ComplaintPolicy;
};
