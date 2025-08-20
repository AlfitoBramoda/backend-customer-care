const express = require('express');
const FAQController = require('../controllers/faq_controller');
const { authenticateToken } = require('../middlewares/auth');

const createFAQRoutes = (db) => {
    const router = express.Router();
    const faqController = FAQController.createInstance(db);
    
    /**
     * @swagger
     * components:
     *   schemas:
     *     FAQ:
     *       type: object
     *       properties:
     *         faq_id:
     *           type: integer
     *           description: FAQ ID
     *         question:
     *           type: string
     *           description: FAQ question
     *         answer:
     *           type: string
     *           description: FAQ answer
     *         keywords:
     *           type: string
     *           description: Search keywords
     *         created_at:
     *           type: string
     *           format: date-time
     *         updated_at:
     *           type: string
     *           format: date-time
     *         channel:
     *           type: object
     *           properties:
     *             channel_id:
     *               type: integer
     *             channel_code:
     *               type: string
     *             channel_name:
     *               type: string
     *             supports_terminal:
     *               type: boolean
     */

    /**
     * @swagger
     * /v1/faqs:
     *   get:
     *     summary: Get FAQs with search and filter
     *     tags: [FAQ]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search in question, answer, or keywords
     *       - in: query
     *         name: channel_id
     *         schema:
     *           type: integer
     *         description: Filter by channel ID
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: Items per page
     *       - in: query
     *         name: sort_by
     *         schema:
     *           type: string
     *           default: faq_id
     *         description: Sort by field
     *       - in: query
     *         name: sort_order
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *           default: asc
     *         description: Sort order
     *     responses:
     *       200:
     *         description: FAQs retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 pagination:
     *                   type: object
     *                   properties:
     *                     current_page:
     *                       type: integer
     *                     per_page:
     *                       type: integer
     *                     total_items:
     *                       type: integer
     *                     total_pages:
     *                       type: integer
     *                     has_next:
     *                       type: boolean
     *                     has_prev:
     *                       type: boolean
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/FAQ'
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    router.get('/', authenticateToken, faqController.getFAQs.bind(faqController));
    
    return router;
};

module.exports = createFAQRoutes;