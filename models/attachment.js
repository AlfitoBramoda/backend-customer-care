'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Attachment extends Model {
    static associate(models) {
      // Attachment belongs to ticket activity
      Attachment.belongsTo(models.ticket_activity, {
        foreignKey: 'ticket_activity_id',
        as: 'ticket_activity'
      });
    }
  }
  Attachment.init({
    attachment_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    ticket_activity_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_path: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_type: DataTypes.STRING(100),
    file_size: DataTypes.INTEGER,
    upload_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'attachment',
    tableName: 'attachment',
    underscored: true
  });
  return Attachment;
};