const express = require('express');
const FAQController = require('../controllers/faq_controller');
const { authenticateToken } = require('../middlewares/auth');

const createFAQRoutes = (db) => {
    const router = express.Router();
    const faqController = FAQController.createInstance(db);
    
    router.get('/', authenticateToken, faqController.getFAQs.bind(faqController));
    
    return router;
};

module.exports = createFAQRoutes;