/**
 * Standardized API Response Helper
 */

class ResponseHelper {
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    static created(res, data = null, message = 'Created successfully') {
        return this.success(res, data, message, 201);
    }

    static error(res, message = 'Internal Server Error', statusCode = 500, details = null) {
        return res.status(statusCode).json({
            success: false,
            message,
            error_code: statusCode,
            ...(details && { details }),
            timestamp: new Date().toISOString()
        });
    }

    static badRequest(res, message = 'Bad Request', details = null) {
        return this.error(res, message, 400, details);
    }

    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }

    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 403);
    }

    static notFound(res, message = 'Not Found') {
        return this.error(res, message, 404);
    }

    static conflict(res, message = 'Conflict') {
        return this.error(res, message, 409);
    }

    static validationError(res, message = 'Validation Error', details = null) {
        return this.error(res, message, 422, details);
    }

    static paginated(res, data, pagination, message = 'Data retrieved successfully') {
        return res.status(200).json({
            success: true,
            message,
            data,
            pagination,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = ResponseHelper;