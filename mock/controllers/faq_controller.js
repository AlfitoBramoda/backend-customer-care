const { HTTP_STATUS } = require('../constants/statusCodes');

class FAQController {
    constructor(db) {
        this.db = db;
    }

    static createInstance(db) {
        return new FAQController(db);
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
            
            let faqs = this.db.get('faq').value();
            
            // Search functionality
            if (search) {
                const searchLower = search.toLowerCase();
                faqs = faqs.filter(faq => 
                    faq.question.toLowerCase().includes(searchLower) ||
                    faq.answer.toLowerCase().includes(searchLower) ||
                    (faq.keywords && faq.keywords.toLowerCase().includes(searchLower))
                );
            }
            
            // Filter by channel
            if (channel_id) {
                faqs = faqs.filter(faq => faq.channel_id == channel_id);
            }
            
            // Sorting
            faqs.sort((a, b) => {
                let aVal = a[sort_by];
                let bVal = b[sort_by];
                
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }
                
                if (sort_order === 'desc') {
                    return bVal > aVal ? 1 : -1;
                } else {
                    return aVal > bVal ? 1 : -1;
                }
            });
            
            // Pagination
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;
            const totalFAQs = faqs.length;
            const paginatedFAQs = faqs.slice(offset, offset + limitNum);
            
            // Enrich with channel data
            const enrichedFAQs = paginatedFAQs.map(faq => {
                const channel = this.db.get('channel')
                    .find({ channel_id: faq.channel_id })
                    .value();
                
                return {
                    faq_id: faq.faq_id,
                    question: faq.question,
                    answer: faq.answer,
                    keywords: faq.keywords,
                    created_at: faq.created_at,
                    updated_at: faq.updated_at,
                    channel: channel ? {
                        channel_id: channel.channel_id,
                        channel_code: channel.channel_code,
                        channel_name: channel.channel_name,
                        supports_terminal: channel.supports_terminal
                    } : null
                };
            });
            
            // Pagination metadata
            const totalPages = Math.ceil(totalFAQs / limitNum);
            
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "FAQs retrieved successfully",
                pagination: {
                    current_page: pageNum,
                    per_page: limitNum,
                    total_items: totalFAQs,
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