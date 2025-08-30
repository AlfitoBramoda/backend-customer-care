const express = require('express');
const router = express.Router();
const AttachmentController = require('../controllers/attachmentController');
const { upload, handleMulterError } = require('../middlewares/upload');
const { authenticateToken } = require('../middlewares/auth');

module.exports = () => {
    const attachmentController = AttachmentController.createInstance();

    // Upload attachments to ticket
    router.post('/tickets/:id/attachments', 
        authenticateToken,
        upload.any(), // Accept any field names, max 5 files (set in multer config)
        (req, res, next) => attachmentController.uploadAttachment(req, res, next)
    );

    // Get attachment metadata and download URL
    router.get('/attachments/:id',
        authenticateToken,
        (req, res, next) => attachmentController.getAttachment(req, res, next)
    );

    // Delete attachment
    router.delete('/attachments/:id',
        authenticateToken,
        (req, res, next) => attachmentController.deleteAttachment(req, res, next)
    );

    // Multer error handler
    router.use(handleMulterError);

    return router;
};