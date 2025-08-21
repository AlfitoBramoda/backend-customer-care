const gcsConfig = require('../config/gcs');
const { NotFoundError, ForbiddenError, ValidationError } = require('../middlewares/error_handler');
const { Op } = require('sequelize');

const db = require('../models');

const { 
    attachment: Attachment,
    ticket_activity: TicketActivity,
    ticket: Ticket,
    customer: Customer,
    employee: Employee
} = db;

class AttachmentController {
    constructor() {
        // No longer need db instance
    }

    static createInstance() {
        return new AttachmentController();
    }

    async uploadAttachment(req, res, next) {
        try {
            // Check if GCS is configured
            if (!gcsConfig.isReady()) {
                return res.status(503).json({
                    success: false,
                    message: 'File upload service not available. GCS not configured.',
                    error: 'SERVICE_UNAVAILABLE'
                });
            }

            const { id } = req.params; // ticket_id
            const files = req.files;

            if (!files || files.length === 0) {
                throw new ValidationError('No files uploaded');
            }

            // Check if ticket exists
            const ticket = await Ticket.findByPk(parseInt(id));
            if (!ticket) {
                throw new NotFoundError('Ticket');
            }

            // Role-based access control
            if (req.user.role === 'customer' && ticket.customer_id !== req.user.id) {
                throw new ForbiddenError('Access denied');
            } else if (req.user.role === 'employee') {
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    if (ticket.responsible_employee_id !== req.user.id) {
                        throw new ForbiddenError('Access denied - you can only upload attachments to tickets assigned to you');
                    }
                }
            }

            const uploadedFiles = [];

            // Create ticket activity first
            const activity = await TicketActivity.create({
                ticket_id: parseInt(id),
                ticket_activity_type_id: 3, // ATTACHMENT type
                sender_type_id: req.user.role === 'customer' ? 1 : 2,
                sender_id: req.user.id,
                content: `Uploaded ${files.length} file(s)`,
                ticket_activity_time: new Date().toISOString()
            });

            // Upload each file to GCS
            for (const file of files) {
                try {
                    // Generate GCS path
                    const gcsPath = `tickets/ticket-${id}/${file.uniqueName}`;
                    
                    // Upload to GCS
                    const uploadResult = await gcsConfig.uploadFile(gcsPath, file.buffer, {
                        contentType: file.mimetype,
                        customMetadata: {
                            originalName: file.originalname,
                            ticketId: id.toString(),
                            uploadedBy: req.user.id.toString(),
                            uploadedByRole: req.user.role
                        }
                    });

                    // Save attachment metadata to database
                    const attachment = await Attachment.create({
                        ticket_activity_id: activity.ticket_activity_id,
                        file_name: file.originalname,
                        file_path: gcsPath, // Store GCS path
                        file_type: file.mimetype,
                        file_size: file.size,
                        upload_time: new Date().toISOString()
                    });

                    uploadedFiles.push({
                        attachment_id: attachment.attachment_id,
                        file_name: attachment.file_name,
                        file_size: attachment.file_size,
                        file_type: attachment.file_type,
                        upload_time: attachment.upload_time,
                        gcs_path: gcsPath
                    });

                } catch (uploadError) {
                    console.error(`Failed to upload ${file.originalname}:`, uploadError);
                    // Continue with other files
                }
            }

            if (uploadedFiles.length === 0) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload any files'
                });
            }

            res.status(201).json({
                success: true,
                message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
                data: {
                    ticket_id: parseInt(id),
                    activity_id: activity.ticket_activity_id,
                    attachments: uploadedFiles
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async getAttachment(req, res, next) {
        try {
            // Check if GCS is configured
            if (!gcsConfig.isReady()) {
                return res.status(503).json({
                    success: false,
                    message: 'File download service not available. GCS not configured.',
                    error: 'SERVICE_UNAVAILABLE'
                });
            }

            const { id } = req.params; // attachment_id

            const attachment = await Attachment.findByPk(parseInt(id));
            if (!attachment) {
                throw new NotFoundError('Attachment');
            }

            // Get associated ticket activity and ticket
            const activity = await TicketActivity.findByPk(attachment.ticket_activity_id);
            if (!activity) {
                throw new NotFoundError('Associated ticket activity');
            }

            const ticket = await Ticket.findByPk(activity.ticket_id);
            if (!ticket) {
                throw new NotFoundError('Associated ticket');
            }

            // Role-based access control
            if (req.user.role === 'customer' && ticket.customer_id !== req.user.id) {
                throw new ForbiddenError('Access denied');
            } else if (req.user.role === 'employee') {
                if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                    if (ticket.responsible_employee_id !== req.user.id) {
                        throw new ForbiddenError('Access denied - you can only access attachments for tickets assigned to you');
                    }
                }
            }

            // Generate signed URL for download
            const signedUrl = await gcsConfig.generateSignedUrl(attachment.file_path, 3600); // 1 hour

            res.status(200).json({
                success: true,
                message: 'Attachment retrieved successfully',
                data: {
                    attachment_id: attachment.attachment_id,
                    file_name: attachment.file_name,
                    file_size: attachment.file_size,
                    file_type: attachment.file_type,
                    upload_time: attachment.upload_time,
                    download_url: signedUrl,
                    ticket: {
                        ticket_id: ticket.ticket_id,
                        ticket_number: ticket.ticket_number
                    }
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async deleteAttachment(req, res, next) {
        try {
            // Check if GCS is configured
            if (!gcsConfig.isReady()) {
                return res.status(503).json({
                    success: false,
                    message: 'File delete service not available. GCS not configured.',
                    error: 'SERVICE_UNAVAILABLE'
                });
            }

            const { id } = req.params; // attachment_id

            const attachment = await Attachment.findByPk(parseInt(id));
            if (!attachment) {
                throw new NotFoundError('Attachment');
            }

            // Get associated ticket activity and ticket
            const activity = await TicketActivity.findByPk(attachment.ticket_activity_id);
            if (!activity) {
                throw new NotFoundError('Associated ticket activity');
            }

            const ticket = await Ticket.findByPk(activity.ticket_id);
            if (!ticket) {
                throw new NotFoundError('Associated ticket');
            }

            // Role-based access control - Only CXC agents can delete attachments
            if (req.user.role !== 'employee') {
                throw new ForbiddenError('Only employees can delete attachments');
            }

            if (req.user.role_id !== 1 || req.user.division_id !== 1) {
                throw new ForbiddenError('Only CXC agents can delete attachments');
            }

            try {
                // Delete from GCS
                await gcsConfig.deleteFile(attachment.file_path);
            } catch (gcsError) {
                console.error('Failed to delete from GCS:', gcsError);
                // Continue with database deletion even if GCS deletion fails
            }

            // Hard delete from database
            await attachment.destroy();

            // Create activity log
            await TicketActivity.create({
                ticket_id: ticket.ticket_id,
                ticket_activity_type_id: 4, // DELETE activity type
                sender_type_id: 2, // Employee
                sender_id: req.user.id,
                content: `Deleted attachment: ${attachment.file_name}`,
                ticket_activity_time: new Date().toISOString()
            });

            res.status(200).json({
                success: true,
                message: 'Attachment deleted successfully',
                data: {
                    attachment_id: attachment.attachment_id,
                    file_name: attachment.file_name,
                    deleted_at: new Date().toISOString()
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = AttachmentController;