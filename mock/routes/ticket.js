const express = require('express');
const TicketController = require('../controllers/ticket_controller');
const FeedbackController = require('../controllers/feedback_controller');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

const createTicketRoutes = (db) => {
    const router = express.Router();
    const ticketController = TicketController.createInstance(db);
    const feedbackController = FeedbackController.createInstance(db);
    
    // GET /v1/tickets - List tickets dengan role-based filtering
    router.get('/', 
        authenticateToken, 
        ticketController.getAllTickets.bind(ticketController)
    );
    
    // GET /v1/tickets/:id - Get ticket detail by ID
    router.get('/:id', 
        authenticateToken, 
        ticketController.getTicketById.bind(ticketController)
    );
    
    // GET /v1/tickets/:id/activities - Get ticket activities
    router.get('/:id/activities', 
        authenticateToken, 
        ticketController.getTicketActivities.bind(ticketController)
    );
    
    // GET /v1/tickets/:id/attachments - Get ticket attachments
    router.get('/:id/attachments', 
        authenticateToken, 
        ticketController.getTicketAttachments.bind(ticketController)
    );
    
    // GET /v1/tickets/:id/feedback - Get ticket feedback
    router.get('/:id/feedback', 
        authenticateToken, 
        ticketController.getTicketFeedback.bind(ticketController)
    );
    
    // POST /v1/tickets/:id/feedback - Submit feedback untuk ticket
    router.post('/:id/feedback', 
        authenticateToken,
        authorizeRole(['customer', 'employee']),
        feedbackController.submitFeedback.bind(feedbackController)
    );
    
    // POST /v1/tickets/:id/activities - Add activity to ticket
    router.post('/:id/activities', 
        authenticateToken,
        authorizeRole(['customer', 'employee']),
        ticketController.createTicketActivity.bind(ticketController)
    );
    
    // POST /v1/tickets - Create new ticket (customer & employee)
    router.post('/', 
        authenticateToken,
        authorizeRole(['customer', 'employee']),
        ticketController.createTicket.bind(ticketController)
    );
    
    // PATCH /v1/tickets/:id - Update ticket (employee only)
    router.patch('/:id', 
        authenticateToken,
        authorizeRole(['employee']),
        ticketController.updateTicket.bind(ticketController)
    );
    
    // DELETE /v1/tickets/:id - Delete ticket (admin/manager only)
    router.delete('/:id', 
        authenticateToken,
        authorizeRole(['employee']),
        ticketController.deleteTicket.bind(ticketController)
    );
    
    return router;
};

// Separate router for activities (standalone endpoints)
const createActivityRoutes = (db) => {
    const router = express.Router();
    const ticketController = TicketController.createInstance(db);
    
    // GET /v1/activities/:id - Get activity detail by ID
    router.get('/:id', 
        authenticateToken, 
        ticketController.getActivityById.bind(ticketController)
    );
    
    return router;
};

// Separate router for feedback (standalone endpoints)
const createFeedbackRoutes = (db) => {
    const router = express.Router();
    const feedbackController = FeedbackController.createInstance(db);
    
    // GET /v1/feedback - Get all feedback (Employee only)
    router.get('/', 
        authenticateToken,
        authorizeRole(['employee']),
        feedbackController.getAllFeedback.bind(feedbackController)
    );
    
    // GET /v1/feedback/:id - Get feedback detail
    router.get('/:id', 
        authenticateToken, 
        feedbackController.getFeedbackDetail.bind(feedbackController)
    );
    
    // PATCH /v1/feedback/:id - Update feedback comment
    router.patch('/:id', 
        authenticateToken,
        authorizeRole(['customer', 'employee']),
        feedbackController.updateFeedback.bind(feedbackController)
    );
    
    return router;
};

module.exports = { createTicketRoutes, createActivityRoutes, createFeedbackRoutes };
