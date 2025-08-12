// routes/agents.js
const express = require('express');
const { Agent, Team } = require('../models');
const { successResponse, errorResponse } = require('../utils/responses');

const router = express.Router();
console.log('✅ Agent routes loaded');
// List agents with optional team filter
router.get('/', async (req, res) => {
    try {
        const { team_id } = req.query;
        
        const whereClause = {};
        if (team_id) {
            whereClause.team_id = team_id;
            }
            
            const agents = await Agent.findAll({
            where: whereClause,
            include: [
                {
                model: Team,
                as: 'team'
                }
            ],
            attributes: { exclude: ['password_hash'] }
        });
        
        return successResponse(res, agents, 'Agents retrieved successfully');
        
    } catch (error) {
        console.error('❌ Get agents error:', error);
        return errorResponse(res, 'INTERNAL_ERROR', 'Failed to retrieve agents', 500);
    }
});

// Get agent by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const agent = await Agent.findByPk(id, {
            include: [
                {
                    model: Team,
                    as: 'team'
                }
            ],
            attributes: { exclude: ['password_hash'] }
        });
        
        if (!agent) {
            return errorResponse(res, 'AGENT_NOT_FOUND', 'Agent not found', 404);
        }
        
        return successResponse(res, agent, 'Agent retrieved successfully');
        
    } catch (error) {
        console.error('❌ Get agent error:', error);
        return errorResponse(res, 'INTERNAL_ERROR', 'Failed to retrieve agent', 500);
    }
});
console.log('✅ Agent routes initialized');
module.exports = router;