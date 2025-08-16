const express = require('express');
const TicketController = require('../controllers/ticket_controller');

const createTicketRoutes = (db) => {
    const router = express.Router();
    const ticketController = TicketController.createInstance(db);

    // Customer version - simplified ticket details
    router.get('/customer/:ticketId', ticketController.getCustomerTicket.bind(ticketController));

    return router;
};

module.exports = createTicketRoutes;
