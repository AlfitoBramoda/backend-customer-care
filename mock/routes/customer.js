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
    
    return router;
};

module.exports = createCustomerRoutes;