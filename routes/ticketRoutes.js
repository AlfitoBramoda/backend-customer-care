const express = require('express');
const TicketController = require('../controllers/ticketController');
const FeedbackController = require('../controllers/feedbackController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

const createTicketRoutes = () => {
    const router = express.Router();
    const ticketController = TicketController.createInstance();
    const feedbackController = FeedbackController.createInstance();
    
    // GET /v1/tickets - List tickets (All authenticated users)
    router.get('/', 
        authenticateToken, 
        ticketController.getAllTickets.bind(ticketController)
    );
    
    // POST /v1/tickets - Create ticket (All authenticated users)
    router.post('/', 
        authenticateToken, 
        ticketController.createTicket.bind(ticketController)
    );
    
    // GET /v1/tickets/:id - Get ticket detail (All authenticated users with access control)
    router.get('/:id', 
        authenticateToken, 
        ticketController.getTicketById.bind(ticketController)
    );
    
    // PATCH /v1/tickets/:id - Update ticket (Employee only)
    router.patch('/:id', 
        authenticateToken, 
        authorizeRole(['employee']), 
        ticketController.updateTicket.bind(ticketController)
    );
    
    // DELETE /v1/tickets/:id - Delete ticket (CXC Employee only)
    router.delete('/:id', 
        authenticateToken, 
        authorizeRole(['employee']), 
        ticketController.deleteTicket.bind(ticketController)
    );
    
    // GET /v1/tickets/:id/activities - Get ticket activities
    router.get('/:id/activities', 
        authenticateToken, 
        ticketController.getTicketActivities.bind(ticketController)
    );
    
    // POST /v1/tickets/:id/activities - Create ticket activity
    router.post('/:id/activities', 
        authenticateToken, 
        ticketController.createTicketActivity.bind(ticketController)
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
    
    // POST /v1/tickets/:id/feedback - Submit feedback for ticket
    router.post('/:id/feedback', 
        authenticateToken, 
        feedbackController.submitFeedback.bind(feedbackController)
    );
    
    return router;
};

module.exports = createTicketRoutes;