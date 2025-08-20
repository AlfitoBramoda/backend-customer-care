const { NotFoundError, ForbiddenError, ValidationError } = require('../middlewares/error_handler');
const { Op } = require('sequelize');

const db = require('../models');

const { 
    feedback: Feedback,
    ticket: Ticket,
    customer: Customer,
    customer_status: CustomerStatus
} = db;

class FeedbackController {
    constructor() {
        // No longer need db instance
    }

    static createInstance() {
        return new FeedbackController();
    }

    // POST /v1/tickets/:id/feedback - Submit feedback untuk ticket
    async submitFeedback(req, res, next) {
        try {
            const { id: ticketId } = req.params;
            const { score, comment } = req.body;
            const userId = req.user.id;
            const userRole = req.user.role_id;

            // Validasi input
            if (!score || score < 1 || score > 5) {
                throw new ValidationError('Score harus antara 1-5');
            }

            // Cek apakah ticket exists
            const ticket = await Ticket.findByPk(parseInt(ticketId));
            if (!ticket) {
                throw new NotFoundError('Ticket');
            }

            // Role-based access control
            if (userRole !== 1) { // Bukan CXC agent
                if (userRole === 3) { // Customer
                    if (ticket.customer_id !== userId) {
                        throw new ForbiddenError('Anda hanya dapat memberikan feedback untuk ticket Anda sendiri');
                    }
                } else { // Employee non-CXC
                    if (ticket.responsible_employee_id !== userId) {
                        throw new ForbiddenError('Anda hanya dapat memberikan feedback untuk ticket yang ditugaskan kepada Anda');
                    }
                }
            }

            // Cek apakah sudah ada feedback untuk ticket ini
            const existingFeedback = await Feedback.findOne({
                where: { ticket_id: parseInt(ticketId) }
            });

            if (existingFeedback) {
                return res.status(400).json({
                    success: false,
                    message: 'Feedback untuk ticket ini sudah ada'
                });
            }

            // Buat feedback baru
            const newFeedback = await Feedback.create({
                ticket_id: parseInt(ticketId),
                score: score,
                comment: comment || null,
                submit_time: new Date().toISOString()
            });

            // Ambil data customer dan ticket untuk response
            const customer = await Customer.findByPk(ticket.customer_id, {
                attributes: ['customer_id', 'full_name', 'email', 'phone_number']
            });

            const ticketWithStatus = await Ticket.findByPk(parseInt(ticketId), {
                include: [{
                    model: CustomerStatus,
                    as: 'customer_status',
                    attributes: ['customer_status_id', 'customer_status_name', 'customer_status_code']
                }]
            });

            res.status(201).json({
                success: true,
                message: 'Feedback berhasil dikirim',
                data: {
                    id: newFeedback.feedback_id,
                    ticket: {
                        id: ticket.ticket_id,
                        ticket_number: ticket.ticket_number,
                        description: ticket.description,
                        status: ticketWithStatus.customer_status
                    },
                    customer: {
                        id: customer.customer_id,
                        full_name: customer.full_name,
                        email: customer.email,
                        phone_number: customer.phone_number
                    },
                    score: newFeedback.score,
                    comment: newFeedback.comment,
                    submit_time: newFeedback.submit_time
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // GET /v1/feedback/:id - Get feedback detail
    async getFeedbackDetail(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role_id;

            // console.log('=== DEBUG getFeedbackDetail ===');
            // console.log('Feedback ID:', id);
            // console.log('User ID:', userId);
            // console.log('User Role:', userRole);

            const feedback = await Feedback.findByPk(parseInt(id));
            // console.log('Feedback found:', feedback ? 'YES' : 'NO');
            // console.log('Feedback data:', feedback?.toJSON());

            if (!feedback) {
                throw new NotFoundError('Feedback');
            }

            // if (feedback) {
            //     console.log('Looking for ticket_id:', feedback.ticket_id);
            // }

            // Ambil data ticket dan customer
            const ticket = await Ticket.findByPk(feedback.ticket_id, {
                include: [{
                    model: CustomerStatus,
                    as: 'customer_status',
                    attributes: ['customer_status_id', 'customer_status_name', 'customer_status_code']
                }]
            });

            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Associated ticket not found'
                });
            }

            const customer = await Customer.findByPk(ticket.customer_id, {
                attributes: ['customer_id', 'full_name', 'email', 'phone_number']
            });

            // Role-based access control
            if (userRole !== 1) { // Bukan CXC agent
                if (userRole === 3) { // Customer
                    if (ticket.customer_id !== userId) {
                        throw new ForbiddenError('Anda tidak memiliki akses ke feedback ini');
                    }
                } else { // Employee non-CXC
                    if (ticket.responsible_employee_id !== userId) {
                        throw new ForbiddenError('Anda tidak memiliki akses ke feedback ini');
                    }
                }
            }

            res.status(200).json({
                success: true,
                message: 'Feedback detail retrieved successfully',
                data: {
                    id: feedback.feedback_id,
                    ticket: {
                        id: ticket.ticket_id,
                        ticket_number: ticket.ticket_number,
                        description: ticket.description,
                        status: ticket.customer_status
                    },
                    customer: {
                        id: customer.customer_id,
                        full_name: customer.full_name,
                        email: customer.email,
                        phone_number: customer.phone_number
                    },
                    score: feedback.score,
                    comment: feedback.comment,
                    submit_time: feedback.submit_time
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // GET /v1/feedback - Get all feedback (Employee only)
    async getAllFeedback(req, res, next) {
        try {
            const userRole = req.user.role_id;
            
            // Only employees can access all feedback
            if (userRole === 3) { // Customer role
                throw new ForbiddenError('Akses ditolak. Hanya employee yang dapat melihat semua feedback');
            }

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Get all feedback with pagination
            const { count, rows: feedbacks } = await Feedback.findAndCountAll({
                include: [
                    {
                        model: Ticket,
                        as: 'ticket',
                        attributes: ['ticket_id', 'ticket_number', 'description', 'customer_id'],
                        include: [{
                            model: CustomerStatus,
                            as: 'customer_status',
                            attributes: ['customer_status_id', 'customer_status_name', 'customer_status_code']
                        }]
                    }
                ],
                order: [['submit_time', 'DESC']],
                limit: limit,
                offset: offset
            });

            // Transform data - get customer through ticket
            const enrichedFeedback = await Promise.all(feedbacks.map(async (feedback) => {
                const feedbackData = feedback.toJSON();
                
                // Get customer data through ticket
                let customer = null;
                if (feedbackData.ticket?.customer_id) {
                    customer = await Customer.findByPk(feedbackData.ticket.customer_id, {
                        attributes: ['customer_id', 'full_name', 'email', 'phone_number']
                    });
                }

                return {
                    id: feedbackData.feedback_id,
                    ticket: {
                        id: feedbackData.ticket?.ticket_id,
                        ticket_number: feedbackData.ticket?.ticket_number,
                        description: feedbackData.ticket?.description,
                        status: feedbackData.ticket?.customer_status
                    },
                    customer: customer ? {
                        id: customer.customer_id,
                        full_name: customer.full_name,
                        email: customer.email,
                        phone_number: customer.phone_number
                    } : null,
                    score: feedbackData.score,
                    comment: feedbackData.comment,
                    submit_time: feedbackData.submit_time
                };
            }));

            const totalPages = Math.ceil(count / limit);

            res.status(200).json({
                success: true,
                message: 'Data feedback berhasil diambil',
                data: enrichedFeedback,
                pagination: {
                    current_page: page,
                    per_page: limit,
                    total_items: count,
                    total_pages: totalPages,
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // PATCH /v1/feedback/:id - Update feedback comment
    async updateFeedback(req, res, next) {
        try {
            const { id } = req.params;
            const { comment } = req.body;
            const userId = req.user.id;
            const userRole = req.user.role_id;

            const feedback = await Feedback.findByPk(parseInt(id));
            if (!feedback) {
                throw new NotFoundError('Feedback');
            }

            // Ambil data ticket
            const ticket = await Ticket.findByPk(feedback.ticket_id, {
                include: [{
                    model: CustomerStatus,
                    as: 'customer_status',
                    attributes: ['customer_status_id', 'customer_status_name', 'customer_status_code']
                }]
            });

            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Associated ticket not found'
                });
            }

            // Role-based access control
            if (userRole !== 1) { // Bukan CXC agent
                if (userRole === 3) { // Customer
                    if (ticket.customer_id !== userId) {
                        throw new ForbiddenError('Anda hanya dapat mengupdate feedback Anda sendiri');
                    }
                } else { // Employee non-CXC
                    if (ticket.responsible_employee_id !== userId) {
                        throw new ForbiddenError('Anda tidak memiliki akses untuk mengupdate feedback ini');
                    }
                }
            }

            // Update feedback
            await feedback.update({
                comment: comment !== undefined ? comment : feedback.comment
            });
            console.log('Update berhasil');

            console.log('Mengambil customer untuk ticket.customer_id:', ticket.customer_id);
            console.log('ticket.customer_id type:', typeof ticket.customer_id);
            console.log('ticket.customer_id value:', ticket.customer_id);

            // Ambil data customer untuk response
            const customer = await Customer.findByPk(parseInt(ticket.customer_id), {
                attributes: ['customer_id', 'full_name', 'email', 'phone_number']
            });
            console.log('Customer found:', customer ? 'YES' : 'NO');

            res.status(200).json({
                success: true,
                message: 'Feedback berhasil diupdate',
                data: {
                    id: feedback.feedback_id,
                    ticket: {
                        id: ticket.ticket_id,
                        ticket_number: ticket.ticket_number,
                        description: ticket.description,
                        status: ticket.customer_status
                    },
                    customer: {
                        id: customer.customer_id,
                        full_name: customer.full_name,
                        email: customer.email,
                        phone_number: customer.phone_number
                    },
                    score: feedback.score,
                    comment: feedback.comment,
                    submit_time: feedback.submit_time
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = FeedbackController;