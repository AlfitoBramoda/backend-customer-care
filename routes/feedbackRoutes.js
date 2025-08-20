const express = require('express');
const FeedbackController = require('../controllers/feedbackController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

function createFeedbackRoutes() {
    const router = express.Router();
    const feedbackController = FeedbackController.createInstance();

    // GET /v1/feedback - Get all feedback (Employee only)
    router.get('/', 
        authenticateToken, 
        authorizeRole(['employee']),
        feedbackController.getAllFeedback.bind(feedbackController)
    );

    // GET /v1/feedback/{id} - Get feedback detail
    router.get('/:id', 
        authenticateToken, 
        feedbackController.getFeedbackDetail.bind(feedbackController)
    );

    // PATCH /v1/feedback/{id} - Update feedback comment
    router.patch('/:id', 
        authenticateToken, 
        feedbackController.updateFeedback.bind(feedbackController)
    );

    return router;
}

module.exports = createFeedbackRoutes;