'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Faq extends Model {
    static associate(models) {
      // FAQ belongs to channel
      Faq.belongsTo(models.channel, {
        foreignKey: 'channel_id',
        as: 'channel'
      });
    }
  }
  Faq.init({
    faq_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    channel_id: DataTypes.INTEGER,
    question: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    keywords: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'faq',
    tableName: 'faq',
    underscored: true
  });
  return Faq;
};