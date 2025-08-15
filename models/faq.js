'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Faq extends Model {
    static associate(models) {
      // FAQ belongs to complaint category
      Faq.belongsTo(models.complaint_category, {
        foreignKey: 'complaint_id',
        as: 'complaint_category'
      });
    }
  }
  Faq.init({
    faq_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    complaint_id: DataTypes.INTEGER,
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