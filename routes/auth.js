// routes/auth.js - FIXED VERSION
const express = require('express');
const jwt = require('jsonwebtoken');
const { Customer, Agent, Team } = require('../models');
const { successResponse, errorResponse } = require('../utils/responses');

const router = express.Router();

console.log('✅ Auth routes loaded');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt with username:', username);
    
    if (!username || !password) {
      return errorResponse(res, 'MISSING_CREDENTIALS', 'Username and password are required', 400);
    }
    
    let user, role;
    
    if (username.includes('@bni.co.id')) {
      console.log('agent login attempt');
      
      const agent = await Agent.findOne({ 
        where: { email: username },
        include: [{ model: Team, as: 'team' }],
        attributes: { exclude: ['password_hash'] }
      });
      
      role = 'agent';
      user = agent ? {
        id: agent.agent_id,
        full_name: agent.full_name,  // ✅ CORRECT: full_name
        email: agent.email,
        role: agent.role,
        team_id: agent.team_id,
        team_name: agent.team?.team_name,
        is_active: agent.is_active
      } : {
        id: 'agent_001',
        full_name: 'Agent Smith (STUB)',  // ✅ CORRECT: full_name
        email: username,
        role: 'Frontline',
        team_id: 1,
        team_name: 'Customer Service Team 1',
        is_active: true
      };
      
      console.log('✅ Agent user:', agent ? 'Found in DB' : 'Using STUB');
      
    } else {
      console.log('customer login attempt');
      
      const customer = await Customer.findOne({ 
        where: { email: username },
        attributes: { exclude: ['password_hash'] }
      });
      
      role = 'customer';
      user = customer ? {
        id: customer.customer_id,
        full_name: customer.full_name,  // ✅ CORRECT: full_name (BUKAN firstname)
        email: customer.email,
        phone_number: customer.phone_number
      } : {
        id: 'cust_001',
        full_name: 'John Customer (STUB)',  // ✅ CORRECT: full_name
        email: username,
        phone_number: '+6281234567890'
      };
      
      console.log('✅ Customer user:', customer ? 'Found in DB' : 'Using STUB');
    }
    
    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      role: role,
      email: username,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'dummy-secret-key');
    
    const responseData = {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
      role: role,
      user: user
    };
    
    console.log('✅ Login successful for:', username, 'as', role);
    
    return successResponse(res, responseData, 'Login successful');
    
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'AUTH_ERROR', 'Authentication failed', 500);
  }
});

console.log('✅ Auth routes setup complete');

module.exports = router;