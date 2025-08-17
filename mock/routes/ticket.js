const express = require('express');
const TicketController = require('../controllers/ticket_controller');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

const createTicketRoutes = (db) => {
    const router = express.Router();
    const ticketController = TicketController.createInstance(db);
    
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
    
    // POST /v1/tickets - Create new ticket (customer & employee)
    router.post('/', 
        authenticateToken,
        authorizeRole(['customer', 'employee']),
        ticketController.createTicket.bind(ticketController)
    );
    
    return router;
};

module.exports = createTicketRoutes;
