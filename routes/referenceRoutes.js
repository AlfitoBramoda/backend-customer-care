const express = require('express');
const ReferenceController = require('../controllers/referenceController');

function createReferenceRoutes() {
    const router = express.Router();
    const referenceController = ReferenceController.createInstance();

    // GET /v1/channels - List all channels
    router.get('/channels', referenceController.getChannels.bind(referenceController));

    // GET /v1/complaint-categories - List all complaint categories
    router.get('/complaint-categories', referenceController.getComplaintCategories.bind(referenceController));

    // GET /v1/slas - Extract SLA data from complaint_policy
    router.get('/slas', referenceController.getSLAs.bind(referenceController));

    // GET /v1/uics - Map divisions as UIC (Unit in Charge)
    router.get('/uics', referenceController.getUICs.bind(referenceController));

    // GET /v1/policies - List policies with comprehensive filtering
    router.get('/policies', referenceController.getPolicies.bind(referenceController));

    return router;
}

module.exports = createReferenceRoutes;