const express = require('express');
const { Account, Customer } = require('../models');
const { successResponse, errorResponse } = require('../utils/responses');

const router = express.Router();

console.log('✅ Account routes loaded');

router.get('/', async (req, res) => {
    try {
        const { customer_id } = req.query;
        
        if (!customer_id) {
            return errorResponse(res, 'MISSING_CUSTOMER_ID', 'customer_id parameter is required', 400);
        }
        
        const accounts = await Account.findAll({
            where: { customer_id },
            include: [
                {
                model: Customer,
                as: 'customer',
                attributes: { exclude: ['password_hash'] }
                }
            ]
        });
        
        return successResponse(res, accounts, 'Accounts retrieved successfully');
        
    } catch (error) {
        console.error('Get accounts error:', error);
        return errorResponse(res, 'INTERNAL_ERROR', 'Failed to retrieve accounts', 500);
    }
});

console.log('✅ Account routes initialized');

module.exports = router;