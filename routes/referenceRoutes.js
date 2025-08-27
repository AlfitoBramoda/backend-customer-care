const express = require('express');
const ReferenceController = require('../controllers/referenceController');
const { authenticateToken } = require('../middlewares/auth');

function createReferenceRoutes() {
    const router = express.Router();
    const referenceController = ReferenceController.createInstance();

    // GET /v1/channels - List all channels (authenticated users only)
    router.get('/channels', authenticateToken, referenceController.getChannels.bind(referenceController));

    // GET /v1/complaint-categories - List all complaint categories (authenticated users only)
    router.get('/complaint-categories', authenticateToken, referenceController.getComplaintCategories.bind(referenceController));

    // GET /v1/slas - Extract SLA data from complaint_policy (authenticated users only)
    router.get('/slas', authenticateToken, referenceController.getSLAs.bind(referenceController));

    // GET /v1/uics - Map divisions as UIC (authenticated users only)
    router.get('/uics', authenticateToken, referenceController.getUICs.bind(referenceController));

    // GET /v1/priorities - List all priorities (authenticated users only)
    router.get('/priorities', authenticateToken, referenceController.getPriorities.bind(referenceController));

    // GET /v1/sources - List all intake sources (authenticated users only)
    router.get('/sources', authenticateToken, referenceController.getSources.bind(referenceController));

    // GET /v1/terminals - List all terminals (authenticated users only)
    router.get('/terminals', authenticateToken, referenceController.getTerminals.bind(referenceController));

    // GET /v1/policies - List policies with comprehensive filtering (authenticated users only)
    router.get('/policies', authenticateToken, referenceController.getPolicies.bind(referenceController));

    return router;
}

module.exports = createReferenceRoutes;