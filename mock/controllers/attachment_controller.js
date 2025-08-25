const gcs = require('../config/gcs');
const { NotFoundError, ForbiddenError, ValidationError } = require('../middlewares/error_handler');
const { HTTP_STATUS } = require('../constants/statusCodes');

class AttachmentController {
    constructor(db) {
        this.db = db;
    }

    static createInstance(db) {
        return new AttachmentController(db);
    }

    async uploadAttachment(req, res, next) {
        try {
            // Check if GCS is configured
            if (!gcs.isReady()) {
                return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
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
            const ticket = this.db.get('ticket')
                .find({ ticket_id: parseInt(id) })
                .value();

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
            const activity = {
                ticket_activity_id: this.getNextId('ticket_activity'),
                ticket_id: parseInt(id),
                ticket_activity_type_id: 3, // ATTACHMENT type
                sender_type_id: req.user.role === 'customer' ? 1 : 2,
                sender_id: req.user.id,
                content: `Uploaded ${files.length} file(s)`,
                ticket_activity_time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T') + '.000Z'
            };

            this.db.get('ticket_activity').push(activity).write();

            // Upload each file to GCS
            for (const file of files) {
                try {
                    // Generate GCS path
                    const gcsPath = `tickets/ticket-${id}/${file.uniqueName}`;
                    
                    // Upload to GCS
                    const uploadResult = await gcs.uploadFile(gcsPath, file.buffer, {
                        contentType: file.mimetype,
                        customMetadata: {
                            originalName: file.originalname,
                            ticketId: id.toString(),
                            uploadedBy: req.user.id.toString(),
                            uploadedByRole: req.user.role
                        }
                    });

                    // Save attachment metadata to database
                    const attachment = {
                        attachment_id: this.getNextId('attachment'),
                        ticket_activity_id: activity.ticket_activity_id,
                        file_name: file.originalname,
                        file_path: gcsPath, // Store GCS path
                        file_type: file.mimetype,
                        file_size: file.size,
                        upload_time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T') + '.000Z'
                    };

                    this.db.get('attachment').push(attachment).write();

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
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: 'Failed to upload any files'
                });
            }

            res.status(HTTP_STATUS.CREATED).json({
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
            if (!gcs.isReady()) {
                return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
                    success: false,
                    message: 'File download service not available. GCS not configured.',
                    error: 'SERVICE_UNAVAILABLE'
                });
            }

            const { id } = req.params; // attachment_id

            const attachment = this.db.get('attachment')
                .find({ attachment_id: parseInt(id) })
                .value();

            if (!attachment) {
                throw new NotFoundError('Attachment');
            }

            // Get associated ticket activity and ticket
            const activity = this.db.get('ticket_activity')
                .find({ ticket_activity_id: attachment.ticket_activity_id })
                .value();

            if (!activity) {
                throw new NotFoundError('Associated ticket activity');
            }

            const ticket = this.db.get('ticket')
                .find({ ticket_id: activity.ticket_id })
                .value();

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
            const signedUrl = await gcs.generateSignedUrl(attachment.file_path, 3600); // 1 hour

            res.status(HTTP_STATUS.OK).json({
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
            if (!gcs.isReady()) {
                return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
                    success: false,
                    message: 'File delete service not available. GCS not configured.',
                    error: 'SERVICE_UNAVAILABLE'
                });
            }

            const { id } = req.params; // attachment_id

            const attachment = this.db.get('attachment')
                .find({ attachment_id: parseInt(id) })
                .value();

            if (!attachment) {
                throw new NotFoundError('Attachment');
            }

            // Get associated ticket activity and ticket
            const activity = this.db.get('ticket_activity')
                .find({ ticket_activity_id: attachment.ticket_activity_id })
                .value();

            if (!activity) {
                throw new NotFoundError('Associated ticket activity');
            }

            const ticket = this.db.get('ticket')
                .find({ ticket_id: activity.ticket_id })
                .value();

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
                await gcs.deleteFile(attachment.file_path);
            } catch (gcsError) {
                console.error('Failed to delete from GCS:', gcsError);
                // Continue with database deletion even if GCS deletion fails
            }

            // Remove from database
            this.db.get('attachment')
                .remove({ attachment_id: parseInt(id) })
                .write();

            // Create activity log
            const deleteActivity = {
                ticket_activity_id: this.getNextId('ticket_activity'),
                ticket_id: ticket.ticket_id,
                ticket_activity_type_id: 4, // DELETE activity type
                sender_type_id: 2, // Employee
                sender_id: req.user.id,
                content: `Deleted attachment: ${attachment.file_name}`,
                ticket_activity_time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T') + '.000Z'
            };

            this.db.get('ticket_activity').push(deleteActivity).write();

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Attachment deleted successfully',
                data: {
                    attachment_id: attachment.attachment_id,
                    file_name: attachment.file_name,
                    deleted_at: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T') + '.000Z'
                }
            });

        } catch (error) {
            next(error);
        }
    }

    getNextId(tableName) {
        const records = this.db.get(tableName).value();
        if (!records || records.length === 0) return 1;
        
        const maxId = Math.max(...records.map(record => {
            const idField = `${tableName}_id`;
            return record[idField] || 0;
        }));
        
        return maxId + 1;
    }
}

module.exports = AttachmentController;