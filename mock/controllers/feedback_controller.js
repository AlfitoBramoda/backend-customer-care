class FeedbackController {
  constructor(db) {
    this.db = db;
  }

  static createInstance(db) {
    return new FeedbackController(db);
  }

  // POST /v1/tickets/:id/feedback - Submit feedback untuk ticket
  async submitFeedback(req, res) {
    try {
      const { id: ticketId } = req.params;
      const { score, comment } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role_id;

      // Validasi input
      if (!score || score < 1 || score > 5) {
        return res.status(400).json({
          success: false,
          message: 'Score harus antara 1-5'
        });
      }

      // Cek apakah ticket exists
      const ticket = this.db.get('ticket').find({ ticket_id: parseInt(ticketId) }).value();
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket tidak ditemukan'
        });
      }

      // Role-based access control
      if (userRole !== 1) { // Bukan CXC agent
        if (userRole === 3) { // Customer
          if (ticket.customer_id !== userId) {
            return res.status(403).json({
              success: false,
              message: 'Anda hanya dapat memberikan feedback untuk ticket Anda sendiri'
            });
          }
        } else { // Employee non-CXC
          if (ticket.responsible_employee_id !== userId) {
            return res.status(403).json({
              success: false,
              message: 'Anda hanya dapat memberikan feedback untuk ticket yang ditugaskan kepada Anda'
            });
          }
        }
      }

      // Cek apakah sudah ada feedback untuk ticket ini
      const existingFeedback = this.db.get('feedback').find({ ticket_id: parseInt(ticketId) }).value();
      if (existingFeedback) {
        return res.status(400).json({
          success: false,
          message: 'Feedback untuk ticket ini sudah ada'
        });
      }

      // Generate ID baru
      const feedbacks = this.db.get('feedback').value();
      const newId = feedbacks.length > 0 ? Math.max(...feedbacks.map(f => f.feedback_id)) + 1 : 1;

      // Buat feedback baru
      const newFeedback = {
        feedback_id: newId,
        ticket_id: parseInt(ticketId),
        customer_id: ticket.customer_id,
        score,
        comment: comment || null,
        submit_time: new Date().toISOString(),
        id: newId
      };

      this.db.get('feedback').push(newFeedback).write();

      // Ambil data customer dan ticket untuk response
      const customer = this.db.get('customer').find({ customer_id: ticket.customer_id }).value();

      res.status(201).json({
        success: true,
        message: 'Feedback berhasil dikirim',
        data: {
          id: newFeedback.feedback_id,
          ticket: {
            id: ticket.ticket_id,
            ticket_number: ticket.ticket_number,
            description: ticket.description,
            status: ticket.customer_status_id
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
      console.error('Error submitting feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengirim feedback'
      });
    }
  }

  // GET /v1/feedback/:id - Get feedback detail
  async getFeedbackDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role_id;

      const feedback = this.db.get('feedback').find({ feedback_id: parseInt(id) }).value();
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback tidak ditemukan'
        });
      }

      // Ambil data ticket dan customer
      const ticket = this.db.get('ticket').find({ ticket_id: feedback.ticket_id }).value();
      const customer = this.db.get('customer').find({ customer_id: feedback.customer_id }).value();

      // Role-based access control
      if (userRole !== 1) { // Bukan CXC agent
        if (userRole === 3) { // Customer
          if (ticket.customer_id !== userId) {
            return res.status(403).json({
              success: false,
              message: 'Anda tidak memiliki akses ke feedback ini'
            });
          }
        } else { // Employee non-CXC
          if (ticket.responsible_employee_id !== userId) {
            return res.status(403).json({
              success: false,
              message: 'Anda tidak memiliki akses ke feedback ini'
            });
          }
        }
      }

      res.json({
        success: true,
        data: {
          id: feedback.feedback_id,
          ticket: {
            id: ticket.ticket_id,
            ticket_number: ticket.ticket_number,
            description: ticket.description,
            status: ticket.customer_status_id
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
      console.error('Error getting feedback detail:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil detail feedback'
      });
    }
  }

  // GET /v1/feedback - Get all feedback (Employee only)
  async getAllFeedback(req, res) {
    try {
      const userRole = req.user.role_id;
      
      // Only employees can access all feedback
      if (userRole === 3) { // Customer role
        return res.status(403).json({
          success: false,
          message: 'Akses ditolak. Hanya employee yang dapat melihat semua feedback'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Get all feedback with pagination
      const allFeedback = this.db.get('feedback').value();
      const totalItems = allFeedback.length;
      const totalPages = Math.ceil(totalItems / limit);
      const paginatedFeedback = allFeedback.slice(offset, offset + limit);

      // Enrich feedback data with ticket and customer info
      const enrichedFeedback = paginatedFeedback.map(feedback => {
        const ticket = this.db.get('ticket').find({ ticket_id: feedback.ticket_id }).value();
        const customer = this.db.get('customer').find({ customer_id: feedback.customer_id }).value();
        
        return {
          id: feedback.feedback_id,
          ticket: {
            id: ticket?.ticket_id,
            ticket_number: ticket?.ticket_number,
            description: ticket?.description,
            status: ticket?.customer_status_id
          },
          customer: {
            id: customer?.customer_id,
            full_name: customer?.full_name,
            email: customer?.email,
            phone_number: customer?.phone_number
          },
          score: feedback.score,
          comment: feedback.comment,
          submit_time: feedback.submit_time
        };
      });

      res.json({
        success: true,
        message: 'Data feedback berhasil diambil',
        data: enrichedFeedback,
        pagination: {
          current_page: page,
          per_page: limit,
          total_items: totalItems,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      });

    } catch (error) {
      console.error('Error getting all feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data feedback'
      });
    }
  }

  // PATCH /v1/feedback/:id - Update feedback comment
  async updateFeedback(req, res) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role_id;

      const feedback = this.db.get('feedback').find({ feedback_id: parseInt(id) }).value();
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback tidak ditemukan'
        });
      }

      // Ambil data ticket
      const ticket = this.db.get('ticket').find({ ticket_id: feedback.ticket_id }).value();

      // Role-based access control
      if (userRole !== 1) { // Bukan CXC agent
        if (userRole === 3) { // Customer
          if (ticket.customer_id !== userId) {
            return res.status(403).json({
              success: false,
              message: 'Anda hanya dapat mengupdate feedback Anda sendiri'
            });
          }
        } else { // Employee non-CXC
          if (ticket.responsible_employee_id !== userId) {
            return res.status(403).json({
              success: false,
              message: 'Anda tidak memiliki akses untuk mengupdate feedback ini'
            });
          }
        }
      }

      // Update feedback
      this.db.get('feedback')
        .find({ feedback_id: parseInt(id) })
        .assign({ comment: comment || feedback.comment })
        .write();

      // Ambil data lengkap setelah update
      const updatedFeedback = this.db.get('feedback').find({ feedback_id: parseInt(id) }).value();
      const customer = this.db.get('customer').find({ customer_id: feedback.customer_id }).value();

      res.json({
        success: true,
        message: 'Feedback berhasil diupdate',
        data: {
          id: updatedFeedback.feedback_id,
          ticket: {
            id: ticket.ticket_id,
            ticket_number: ticket.ticket_number,
            description: ticket.description,
            status: ticket.customer_status_id
          },
          customer: {
            id: customer.customer_id,
            full_name: customer.full_name,
            email: customer.email,
            phone_number: customer.phone_number
          },
          score: updatedFeedback.score,
          comment: updatedFeedback.comment,
          submit_time: updatedFeedback.submit_time
        }
      });

    } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengupdate feedback'
      });
    }
  }
}

module.exports = FeedbackController;