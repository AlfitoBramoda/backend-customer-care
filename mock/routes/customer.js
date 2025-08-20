const express = require('express');
const CustomerController = require('../controllers/customer_controller');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

const createCustomerRoutes = (db) => {
    const router = express.Router();
    const customerController = CustomerController.createInstance(db);
    
    // GET /v1/customers - List customers (Employee only)
    router.get('/', 
        authenticateToken, 
        authorizeRole(['employee']), 
        customerController.getCustomers.bind(customerController)
    );
    
    // GET /v1/customers/:id - Get customer detail (Employee only)
    router.get('/:id', 
        authenticateToken, 
        authorizeRole(['employee']), 
        customerController.getCustomerById.bind(customerController)
    );
    
    // GET /v1/customers/:id/accounts - Get customer accounts (Employee only)
    router.get('/:id/accounts', 
        authenticateToken, 
        authorizeRole(['employee']), 
        customerController.getCustomerAccounts.bind(customerController)
    );
    
    // GET /v1/customers/:id/cards - Get customer cards (Employee only)
    router.get('/:id/cards', 
        authenticateToken, 
        authorizeRole(['employee']), 
        customerController.getCustomerCards.bind(customerController)
    );
    
    return router;
};

module.exports = createCustomerRoutes;