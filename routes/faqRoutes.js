const express = require('express');
const FAQController = require('../controllers/faqController');
const { authenticateToken } = require('../middlewares/auth');

const createFAQRoutes = () => {
    const router = express.Router();
    const faqController = FAQController.createInstance();
    
    // GET /v1/faqs - List FAQs with search and filter
    router.get('/', authenticateToken, faqController.getFAQs.bind(faqController));
    
    return router;
};

module.exports = createFAQRoutes;