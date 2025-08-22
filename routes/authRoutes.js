const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

const createAuthRoutes = () => {
    const router = express.Router();
    const authController = AuthController.createInstance();
    
    // Customer login
    router.post('/login/customer', authController.loginCustomer.bind(authController));
    
    // Employee login  
    router.post('/login/employee', authController.loginEmployee.bind(authController));

    // Authentication Enhancement Routes
    router.post('/logout', authenticateToken, authController.logout.bind(authController));         // Logout
    router.get('/me', authenticateToken, authController.getCurrentUser.bind(authController));      // Current user
    router.post('/refresh', authController.refreshToken.bind(authController));  // Refresh token
    
    return router;
};

module.exports = createAuthRoutes;