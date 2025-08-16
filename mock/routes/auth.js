const express = require('express');
const AuthController = require('../controllers/auth_controller');

const createAuthRoutes = (db) => {
    const router = express.Router();
    const authController = AuthController.createInstance(db);
    
    // Customer login
    router.post('/login/customer', authController.loginCustomer.bind(authController));
    
    // Employee login  
    router.post('/login/employee', authController.loginEmployee.bind(authController));
    
    return router;
};

module.exports = createAuthRoutes;
