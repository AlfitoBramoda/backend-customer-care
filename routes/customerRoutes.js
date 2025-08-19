const express = require('express');
const CustomerController = require('../controllers/customerController');

function createCustomerRoutes() {
    const router = express.Router();
    const customerController = CustomerController.createInstance();

    // GET /customers - Get customers list with filters
    router.get('/', customerController.getCustomers.bind(customerController));

    // GET /customers/{id} - Get customer detail by ID
    router.get('/:id', customerController.getCustomerById.bind(customerController));

    return router;
}

module.exports = createCustomerRoutes;