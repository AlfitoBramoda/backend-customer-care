const express = require('express');
const { Team, Agent } = require('../models');
const { successResponse, errorResponse } = require('../utils/responses');

const router = express.Router();

console.log('✅ Team routes loaded');

router.get('/', async (req, res) => {
    try {
        const teams = await Team.findAll({
            include: [
                {
                model: Agent,
                as: 'agents',
                attributes: { exclude: ['password_hash'] }
                }
            ]
        });
        
        return successResponse(res, teams, 'Teams retrieved successfully');
        
    } catch (error) {
        console.error('Get teams error:', error);
        return errorResponse(res, 'INTERNAL_ERROR', 'Failed to retrieve teams', 500);
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const team = await Team.findByPk(id, {
            include: [
                {
                model: Agent,
                as: 'agents',
                attributes: { exclude: ['password_hash'] }
                }
            ]
        });
        
        if (!team) {
            return errorResponse(res, 'TEAM_NOT_FOUND', 'Team not found', 404);
        }
        
        return successResponse(res, team, 'Team retrieved successfully');
        
    } catch (error) {
        console.error('Get team error:', error);
        return errorResponse(res, 'INTERNAL_ERROR', 'Failed to retrieve team', 500);
    }
});

console.log('✅ Team routes initialized');

module.exports = router;