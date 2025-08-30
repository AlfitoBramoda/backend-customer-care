'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Feedback extends Model {
    static associate(models) {
      // Feedback belongs to ticket
      Feedback.belongsTo(models.ticket, {
        foreignKey: 'ticket_id',
        as: 'ticket'
      });
    }
  }
  Feedback.init({
    feedback_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    ticket_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true
    },
    score: DataTypes.TINYINT,
    comment: DataTypes.TEXT,
    submit_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'feedback',
    tableName: 'feedback',
    underscored: true
  });
  return Feedback;
};