// routes/customers.js - ADD RELATIONSHIPS
const express = require('express');
const { Customer, Account } = require('../models');
const { successResponse, errorResponse } = require('../utils/responses');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Customer routes working' });
});

// Full customer route with relationships
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const customer = await Customer.findByPk(id, {
            include: [
                {
                model: Account,
                as: 'accounts'  // Pastikan alias ini benar di model
                }
            ],
            attributes: { exclude: ['password_hash'] }
        });
        
        if (!customer) {
            return errorResponse(res, 'CUSTOMER_NOT_FOUND', 'Customer not found', 404);
        }
        
        return successResponse(res, customer, 'Customer retrieved successfully');
        
    } catch (error) {
        console.error('❌ Error with relationships:', error);
        return errorResponse(res, 'INTERNAL_ERROR', 'Failed to retrieve customer', 500);
    }
});

module.exports = router;