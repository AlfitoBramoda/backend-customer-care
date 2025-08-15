'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ComplaintCategory extends Model {
    static associate(models) {
      // ComplaintCategory has many tickets
      ComplaintCategory.hasMany(models.ticket, {
        foreignKey: 'complaint_id',
        as: 'tickets'
      });
      
      // ComplaintCategory has many FAQs
      ComplaintCategory.hasMany(models.faq, {
        foreignKey: 'complaint_id',
        as: 'faqs'
      });
      
      // ComplaintCategory has many policies
      ComplaintCategory.hasMany(models.complaint_policy, {
        foreignKey: 'complaint_id',
        as: 'complaint_policies'
      });
    }
  }
  ComplaintCategory.init({
    complaint_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    complaint_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    complaint_name: {
      type: DataTypes.STRING(150),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'complaint_category',
    tableName: 'complaint_category',
    underscored: true
  });
  return ComplaintCategory;
};