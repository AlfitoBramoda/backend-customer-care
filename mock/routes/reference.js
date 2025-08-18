const express = require('express');
const ReferenceController = require('../controllers/reference_controller');
const { authenticateToken } = require('../middlewares/auth');

const createReferenceRoutes = (db) => {
    const router = express.Router();
    const referenceController = ReferenceController.createInstance(db);
    
    // Apply authentication middleware to all reference routes
    router.use(authenticateToken);
    
    // GET /v1/channels - List all channels (authenticated users only)
    router.get('/channels', referenceController.getChannels.bind(referenceController));
    
    // GET /v1/complaint-categories - List all complaint categories (authenticated users only)
    router.get('/complaint-categories', referenceController.getComplaintCategories.bind(referenceController));
    
    // GET /v1/slas - Extract SLA data from complaint_policy (authenticated users only)
    router.get('/slas', referenceController.getSLAs.bind(referenceController));
    
    // GET /v1/uics - Map divisions as UIC (authenticated users only)
    router.get('/uics', referenceController.getUICs.bind(referenceController));
    
    // GET /v1/policies - List policies with comprehensive filtering (authenticated users only)
    router.get('/policies', referenceController.getPolicies.bind(referenceController));
    
    return router;
};

module.exports = createReferenceRoutes;