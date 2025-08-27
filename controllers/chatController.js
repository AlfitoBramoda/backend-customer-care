'use strict';

const { HTTP_STATUS } = require('../constants/statusCodes');

class ChatController {
    constructor(db) {
        this.db = db;
    }

    static createInstance(db) {
        return new ChatController(db);
    }

    // Helper untuk generate ID
    generateId(items) {
        if (!items || items.length === 0) return 1;
        return Math.max(...items.map(item => item.id || 0)) + 1;
    }

    /**
     * POST /v1/chats/sessions
     * Body: { ticket_id }
     * Return: { session_id }
     */
    async createSession(req, res, next) {
        try {
            const { ticket_id } = req.body;
            if (!ticket_id) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                    success: false,
                    message: 'ticket_id is required' 
                });
            }

            // Cek apakah ticket ada
            const ticket = this.db.get('ticket')
                .find({ ticket_id: Number(ticket_id) })
                .value();
            
            if (!ticket) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({ 
                    success: false,
                    message: 'Ticket not found' 
                });
            }

            return res.status(HTTP_STATUS.CREATED).json({ 
                success: true,
                message: 'Chat session created', 
                data: {
                    session_id: Number(ticket_id)
                }
            });
        } catch (err) {
            console.error('createSession error:', err);
            next(err);
        }
    }

    /**
     * POST /v1/chats/:session_id/messages
     * Body: { sender_id, sender_type_id, message }
     */
    async sendMessage(req, res, next) {
        try {
            const { session_id } = req.params;
            const { sender_id, sender_type_id, message } = req.body;

            if (!session_id) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                    success: false,
                    message: 'session_id is required' 
                });
            }
            if (!sender_id) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                    success: false,
                    message: 'sender_id is required' 
                });
            }
            if (!sender_type_id) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                    success: false,
                    message: 'sender_type_id is required' 
                });
            }
            if (!message || `${message}`.trim().length === 0) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                    success: false,
                    message: 'message is required' 
                });
            }

            // Validasi ticket
            const ticket = this.db.get('ticket')
                .find({ ticket_id: Number(session_id) })
                .value();
            
            if (!ticket) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({ 
                    success: false,
                    message: 'Session/Ticket not found' 
                });
            }

            // Validasi sender_type
            const senderType = this.db.get('sender_type')
                .find({ sender_type_id: Number(sender_type_id) })
                .value();
            
            if (!senderType) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                    success: false,
                    message: 'Invalid sender_type_id' 
                });
            }

            // Buat chat message baru
            const chatMessages = this.db.get('chat_message').value();
            const newMessage = {
                chat_id: this.generateId(chatMessages),
                ticket_id: Number(session_id),
                sender_id: Number(sender_id),
                sender_type_id: Number(sender_type_id),
                message: message.trim(),
                sent_at: new Date().toISOString(),
                id: this.generateId(chatMessages)
            };

            // Tambahkan ke database
            this.db.get('chat_message').push(newMessage).write();

            return res.status(HTTP_STATUS.CREATED).json({ 
                success: true,
                message: 'Message sent', 
                data: newMessage 
            });
        } catch (err) {
            console.error('sendMessage error:', err);
            next(err);
        }
    }

    /**
     * POST /v1/chats/dm-messages
     * Body: { customer_id, employee_id, sender_id, sender_type_id, message, room }
     */
    async sendDMMessage(req, res, next) {
        try {
            const { customer_id, employee_id, sender_id, sender_type_id, message, room } = req.body;
            if (!customer_id || !employee_id) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'customer_id dan employee_id wajib diisi'
                });
            }
            if (!sender_id) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'sender_id wajib diisi'
                });
            }
            if (!sender_type_id) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'sender_type_id wajib diisi'
                });
            }
            if (!message || `${message}`.trim().length === 0) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'message wajib diisi'
                });
            }

            // Validasi sender_type
            const senderType = this.db.get('sender_type')
                .find({ sender_type_id: Number(sender_type_id) })
                .value();
            if (!senderType) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid sender_type_id'
                });
            }

            // Buat DM message baru
            const dmMessages = this.db.get('dm_message').value() || [];
            const newDM = {
                dm_id: this.generateId(dmMessages),
                customer_id,
                employee_id,
                sender_id,
                sender_type_id: Number(sender_type_id),
                message: message.trim(),
                room,
                sent_at: new Date().toISOString(),
                id: this.generateId(dmMessages)
            };
            this.db.get('dm_message').push(newDM).write();

            return res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'DM message sent',
                data: newDM
            });
        } catch (err) {
            console.error('sendDMMessage error:', err);
            next(err);
        }
    }

    /**
     * GET /v1/chats/:session_id/messages?limit=&offset=&since=
     */
    async getMessages(req, res, next) {
        try {
            const { session_id } = req.params;
            const limit = Math.min(Number(req.query.limit) || 50, 200);
            const offset = Number(req.query.offset) || 0;
            const since = req.query.since ? new Date(req.query.since) : null;

            if (!session_id) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                    success: false,
                    message: 'session_id is required' 
                });
            }

            // Cek ticket
            const ticket = this.db.get('ticket')
                .find({ ticket_id: Number(session_id) })
                .value();
            
            if (!ticket) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({ 
                    success: false,
                    message: 'Session/Ticket not found' 
                });
            }

            // Filter chat messages
            let messages = this.db.get('chat_message')
                .filter({ ticket_id: Number(session_id) })
                .value();

            // Filter berdasarkan since jika ada
            if (since && !isNaN(since.valueOf())) {
                messages = messages.filter(msg => new Date(msg.sent_at) >= since);
            }

            // Sort berdasarkan sent_at dan chat_id
            messages.sort((a, b) => {
                const dateA = new Date(a.sent_at);
                const dateB = new Date(b.sent_at);
                if (dateA.getTime() === dateB.getTime()) {
                    return a.chat_id - b.chat_id;
                }
                return dateA - dateB;
            });

            const total = messages.length;
            
            // Apply pagination
            const pageNum = Math.floor(offset / limit) + 1;
            const paginatedMessages = messages.slice(offset, offset + limit);

            // Enrich dengan data relasi jika diperlukan
            const enrichedMessages = paginatedMessages.map(msg => {
                const senderType = this.db.get('sender_type')
                    .find({ sender_type_id: msg.sender_type_id })
                    .value();
                
                return {
                    ...msg,
                    ticket: { ticket_id: ticket.ticket_id },
                    sender_type: senderType ? { 
                        sender_type_id: senderType.sender_type_id, 
                        name: senderType.sender_type_name 
                    } : null
                };
            });

            // Pagination metadata
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
                data: enrichedMessages
            });
        } catch (err) {
            console.error('getMessages error:', err);
            next(err);
        }
    }
}

module.exports = ChatController;
