const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

const errorResponse = (res, code, message, statusCode = 400, details = null) => {
    return res.status(statusCode).json({
        success: false,
        error: {
        code,
        message,
        ...(details && { details })
        },
        timestamp: new Date().toISOString()
    });
};

const paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
    return res.json({
        success: true,
        message,
        data,
        pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
        },
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse
};
