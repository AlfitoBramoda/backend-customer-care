const { HTTP_STATUS } = require('../constants/statusCodes');
const { Op } = require('sequelize');

const db = require('../models');

const { 
    faq: FAQ,
    channel: Channel
} = db;

class FAQController {
    constructor() {
        // No longer need db instance
    }

    static createInstance() {
        return new FAQController();
    }

    // GET /v1/faqs - List FAQs with search and filter
    async getFAQs(req, res, next) {
        try {
            const { 
                search, 
                channel_id, 
                page = 1, 
                limit = 10,
                sort_by = 'faq_id',
                sort_order = 'asc'
            } = req.query;
            
            // Convert to numbers
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;

            // Build where clause
            let whereClause = {};

            // Search functionality
            if (search) {
                whereClause[Op.or] = [
                    { question: { [Op.iLike]: `%${search}%` } },
                    { answer: { [Op.iLike]: `%${search}%` } },
                    { keywords: { [Op.iLike]: `%${search}%` } }
                ];
            }
            
            // Filter by channel
            if (channel_id) {
                whereClause.channel_id = parseInt(channel_id);
            }

            // Build order clause
            const orderClause = [[sort_by, sort_order.toUpperCase()]];
            
            // Get FAQs with pagination (specify attributes explicitly)
            const { count, rows: faqs } = await FAQ.findAndCountAll({
                where: whereClause,
                attributes: [
                    'faq_id',
                    'channel_id', 
                    'question',
                    'answer',
                    'keywords',
                    'created_at',
                    'updated_at'
                ],
                order: orderClause,
                limit: limitNum,
                offset: offset,
                logging: console.log
            });
            
            // Transform data (without channel for now)
            const enrichedFAQs = faqs.map(faq => {
                const faqData = faq.toJSON();
                return {
                    faq_id: faqData.faq_id,
                    question: faqData.question,
                    answer: faqData.answer,
                    keywords: faqData.keywords,
                    created_at: faqData.created_at,
                    updated_at: faqData.updated_at,
                    channel_id: faqData.channel_id,
                    channel: null  // temporarily null
                };
            });
            
            // Pagination metadata
            const totalPages = Math.ceil(count / limitNum);
            
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "FAQs retrieved successfully",
                pagination: {
                    current_page: pageNum,
                    per_page: limitNum,
                    total_items: count,
                    total_pages: totalPages,
                    has_next: pageNum < totalPages,
                    has_prev: pageNum > 1
                },
                data: enrichedFAQs
            });
            
        } catch (error) {
            next(error);
        }
    }
}

module.exports = FAQController;