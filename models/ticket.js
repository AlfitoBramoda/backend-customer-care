'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    static associate(models) {
      // Status relationships
      Ticket.belongsTo(models.customer_status, {
        foreignKey: 'customer_status_id',
        as: 'customer_status'
      });
      
      Ticket.belongsTo(models.employee_status, {
        foreignKey: 'employee_status_id',
        as: 'employee_status'
      });
      
      Ticket.belongsTo(models.priority, {
        foreignKey: 'priority_id',
        as: 'priority'
      });
      
      // Channel & Source
      Ticket.belongsTo(models.channel, {
        foreignKey: 'issue_channel_id',
        as: 'issue_channel'
      });
      
      Ticket.belongsTo(models.source, {
        foreignKey: 'intake_source_id',
        as: 'intake_source'
      });
      
      // Customer & Related Entities
      Ticket.belongsTo(models.customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
      
      Ticket.belongsTo(models.account, {
        foreignKey: 'related_account_id',
        as: 'related_account'
      });
      
      Ticket.belongsTo(models.card, {
        foreignKey: 'related_card_id',
        as: 'related_card'
      });
      
      // Complaint & Employee
      Ticket.belongsTo(models.complaint_category, {
        foreignKey: 'complaint_id',
        as: 'complaint_category'
      });
      
      Ticket.belongsTo(models.employee, {
        foreignKey: 'responsible_employee_id',
        as: 'responsible_employee'
      });
      
      Ticket.belongsTo(models.complaint_policy, {
        foreignKey: 'policy_id',
        as: 'policy'
      });
      
      // Terminal for transactions
      Ticket.belongsTo(models.terminal, {
        foreignKey: 'terminal_id',
        as: 'terminal'
      });
      
      // Ticket has many activities
      Ticket.hasMany(models.ticket_activity, {
        foreignKey: 'ticket_id',
        as: 'activities'
      });
      
      // Ticket has one feedback
      Ticket.hasOne(models.feedback, {
        foreignKey: 'ticket_id',
        as: 'feedback'
      });
      
      // Ticket has many chat messages
      Ticket.hasMany(models.chat_message, {
        foreignKey: 'ticket_id',
        as: 'chat_messages'
      });
      
      // Ticket has many call logs
      Ticket.hasMany(models.call_log, {
        foreignKey: 'ticket_id',
        as: 'call_logs'
      });

      // Employee who performed soft delete
      Ticket.belongsTo(models.employee, {
        foreignKey: 'delete_by',
        as: 'deleted_by_employee'
      });
    }
  }
  Ticket.init({
    ticket_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    ticket_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    description: DataTypes.TEXT,
    customer_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    employee_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    priority_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    issue_channel_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    intake_source_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    customer_id: DataTypes.BIGINT,
    related_account_id: DataTypes.BIGINT,
    related_card_id: DataTypes.INTEGER,
    complaint_id: DataTypes.INTEGER,
    responsible_employee_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    policy_id: DataTypes.INTEGER,
    committed_due_at: DataTypes.DATE,
    transaction_date: DataTypes.DATE,
    amount: DataTypes.DECIMAL(18, 2),
    terminal_id: DataTypes.INTEGER,
    created_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    closed_time: DataTypes.DATE,
    division_notes: DataTypes.JSON,
    delete_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    delete_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ticket',
    tableName: 'ticket',
    underscored: true
  });
  return Ticket;
};