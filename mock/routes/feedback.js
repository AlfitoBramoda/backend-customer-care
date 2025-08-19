const express = require('express');
const FeedbackController = require('../controllers/feedback_controller');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

const createFeedbackRoutes = (db) => {
    const router = express.Router();
    const feedbackController = FeedbackController.createInstance(db);
    
    // POST /v1/tickets/:id/feedback - Submit feedback untuk ticket
    router.post('/tickets/:id/feedback', 
        authenticateToken,
        authorizeRole(['customer', 'employee']),
        feedbackController.submitFeedback.bind(feedbackController)
    );
    
    // GET /v1/feedback/:id - Get feedback detail
    router.get('/feedback/:id', 
        authenticateToken, 
        feedbackController.getFeedbackDetail.bind(feedbackController)
    );
    
    // PATCH /v1/feedback/:id - Update feedback comment
    router.patch('/feedback/:id', 
        authenticateToken,
        authorizeRole(['customer', 'employee']),
        feedbackController.updateFeedback.bind(feedbackController)
    );
    
    return router;
};

module.exports = { createFeedbackRoutes };