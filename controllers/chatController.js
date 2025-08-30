'use strict';

const { NotFoundError, ValidationError } = require('../middlewares/error_handler');
const { HTTP_STATUS } = require('../constants/statusCodes');
const { Op } = require('sequelize');

const db = require('../models');

const {
    chat_message: ChatMessage,
    ticket: Ticket,
    sender_type: SenderType,
    customer: Customer,
    employee: Employee
} = db;

class ChatController {
    /**
     * POST /v1/chats/sessions
     * Body: { ticket_id }
     * Return: { session_id }
     */
    static async createSession(req, res, next) {
        try {
            const { ticket_id } = req.body;
            
            if (!ticket_id) {
                throw new ValidationError('ticket_id is required');
            }

            // Cek apakah ticket ada
            const ticket = await Ticket.findByPk(ticket_id);
            
            if (!ticket) {
                throw new NotFoundError('Ticket not found');
            }

            return res.status(HTTP_STATUS.CREATED).json({ 
                success: true,
                message: 'Chat session created', 
                data: {
                    session_id: Number(ticket_id)
                }
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /v1/chats/:session_id/messages
     * Body: { message }
     */
    static async sendMessage(req, res, next) {
        try {
            const { session_id } = req.params;
            const { message } = req.body;

            // Extract sender info from authenticated user
            const sender_id = req.user.id;
            const sender_type_id = req.user.role === 'employee' ? 2 : 1;
            
            // Validasi input
            if (!session_id) {
                throw new ValidationError('session_id is required');
            }
            if (!message || message.trim().length === 0) {
                throw new ValidationError('message is required');
            }

            // Validasi ticket exists
            const ticket = await Ticket.findByPk(session_id);
            if (!ticket) {
                throw new NotFoundError('Session/Ticket not found');
            }

            // Validasi sender_type exists
            const senderType = await SenderType.findByPk(sender_type_id);
            if (!senderType) {
                throw new ValidationError('Invalid sender_type_id');
            }

            // Validasi sender exists berdasarkan sender_type
            if (sender_type_id == 1) { // Customer
                const customer = await Customer.findByPk(sender_id);
                if (!customer) {
                    throw new ValidationError('Customer not found');
                }
            } else if (sender_type_id == 2) { // Employee
                const employee = await Employee.findByPk(sender_id);
                if (!employee) {
                    throw new ValidationError('Employee not found');
                }
            }

            // Buat chat message baru
            const newMessage = await ChatMessage.create({
                ticket_id: Number(session_id),
                sender_id: Number(sender_id),
                sender_type_id: Number(sender_type_id),
                message: message.trim(),
                sent_at: new Date()
            });

            // Load relasi untuk response
            const messageWithRelations = await ChatMessage.findByPk(newMessage.chat_id, {
                include: [
                    {
                        model: Ticket,
                        as: 'ticket',
                        attributes: ['ticket_id']
                    },
                    {
                        model: SenderType,
                        as: 'sender_type',
                        attributes: ['sender_type_id', 'sender_type_name']
                    }
                ]
            });

            return res.status(HTTP_STATUS.CREATED).json({ 
                success: true,
                message: 'Message sent', 
                data: messageWithRelations
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /v1/chats/:session_id/messages?limit=&offset=&since=
     */
    static async getMessages(req, res, next) {
        try {
            const { session_id } = req.params;
            const limit = Math.min(Number(req.query.limit) || 50, 200);
            const offset = Number(req.query.offset) || 0;
            const since = req.query.since ? new Date(req.query.since) : null;

            if (!session_id) {
                throw new ValidationError('session_id is required');
            }

            // Cek ticket exists
            const ticket = await Ticket.findByPk(session_id);
            if (!ticket) {
                throw new NotFoundError('Session/Ticket not found');
            }

            // Build where condition
            const whereCondition = { ticket_id: Number(session_id) };
            
            // Add since filter if provided
            if (since && !isNaN(since.valueOf())) {
                whereCondition.sent_at = { [Op.gte]: since };
            }

            // Get messages with pagination and relations
            const { rows: messages, count: total } = await ChatMessage.findAndCountAll({
                where: whereCondition,
                include: [
                    {
                        model: Ticket,
                        as: 'ticket',
                        attributes: ['ticket_id']
                    },
                    {
                        model: SenderType,
                        as: 'sender_type',
                        attributes: ['sender_type_id', 'sender_type_name']
                    }
                ],
                order: [
                    ['sent_at', 'ASC'],
                    ['chat_id', 'ASC']
                ],
                limit,
                offset
            });

            // Format response data
            const formattedMessages = messages.map(msg => ({
                chat_id: msg.chat_id,
                ticket_id: msg.ticket_id,
                sender_id: msg.sender_id,
                sender_type_id: msg.sender_type_id,
                message: msg.message,
                sent_at: msg.sent_at,
                ticket: msg.ticket ? {
                    ticket_id: msg.ticket.ticket_id
                } : null,
                sender_type: msg.sender_type ? {
                    sender_type_id: msg.sender_type.sender_type_id,
                    name: msg.sender_type.sender_type_name
                } : null
            }));

            // Pagination metadata
            const pageNum = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(total / limit);

            return res.status(HTTP_STATUS.OK).json({ 
                success: true,
                message: 'Messages retrieved successfully', 
                pagination: {
                    current_page: pageNum,
                    per_page: limit,
                    total_items: total,
                    total_pages: totalPages,
                    has_next: pageNum < totalPages,
                    has_prev: pageNum > 1
                },
                data: formattedMessages
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * DELETE /v1/chats/:session_id/messages/:message_id
     * Delete a specific message (soft delete by setting deleted_at)
     */
    static async deleteMessage(req, res, next) {
        try {
            const { session_id, message_id } = req.params;

            if (!session_id || !message_id) {
                throw new ValidationError('session_id and message_id are required');
            }

            // Find message yang belongs to session
            const message = await ChatMessage.findOne({
                where: {
                    chat_id: message_id,
                    ticket_id: session_id
                }
            });

            if (!message) {
                throw new NotFoundError('Message not found in this session');
            }

            // Soft delete - update message content
            await message.update({
                message: '[Message deleted]',
                updated_at: new Date()
            });

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Message deleted successfully'
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /v1/chats/:session_id/summary
     * Get chat session summary (message count, participants, etc.)
     */
    static async getSessionSummary(req, res, next) {
        try {
            const { session_id } = req.params;

            if (!session_id) {
                throw new ValidationError('session_id is required');
            }

            // Cek ticket exists
            const ticket = await Ticket.findByPk(session_id);
            if (!ticket) {
                throw new NotFoundError('Session/Ticket not found');
            }

            // Get message count dan latest message
            const messageStats = await ChatMessage.findAll({
                where: { ticket_id: session_id },
                attributes: [
                    [db.sequelize.fn('COUNT', db.sequelize.col('chat_id')), 'total_messages'],
                    [db.sequelize.fn('MAX', db.sequelize.col('sent_at')), 'last_message_at'],
                    [db.sequelize.fn('MIN', db.sequelize.col('sent_at')), 'first_message_at']
                ],
                raw: true
            });

            // Get unique participants
            const participants = await ChatMessage.findAll({
                where: { ticket_id: session_id },
                attributes: ['sender_id', 'sender_type_id'],
                include: [{
                    model: SenderType,
                    as: 'sender_type',
                    attributes: ['sender_type_name']
                }],
                group: ['sender_id', 'sender_type_id', 'sender_type.sender_type_id'],
                raw: false
            });

            const summary = {
                session_id: Number(session_id),
                ticket_id: ticket.ticket_id,
                total_messages: Number(messageStats[0]?.total_messages || 0),
                first_message_at: messageStats[0]?.first_message_at,
                last_message_at: messageStats[0]?.last_message_at,
                participants: participants.map(p => ({
                    sender_id: p.sender_id,
                    sender_type_id: p.sender_type_id,
                    sender_type_name: p.sender_type?.sender_type_name
                }))
            };

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Session summary retrieved successfully',
                data: summary
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = ChatController;
