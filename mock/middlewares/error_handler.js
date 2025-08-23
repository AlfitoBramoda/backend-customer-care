const { HTTP_STATUS } = require('../constants/statusCodes');

// HTTP Status Code Messages
const HTTP_MESSAGES = {
    [HTTP_STATUS.BAD_REQUEST]: 'Bad Request',
    [HTTP_STATUS.UNAUTHORIZED]: 'Unauthorized', 
    [HTTP_STATUS.FORBIDDEN]: 'Forbidden',
    [HTTP_STATUS.NOT_FOUND]: 'Not Found',
    [HTTP_STATUS.CONFLICT]: 'Conflict',
    [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
    [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Internal Server Error'
};

// Custom Error Classes
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message = 'Validation failed') {
        super(message, HTTP_STATUS.BAD_REQUEST);
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, HTTP_STATUS.NOT_FOUND);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super(message, HTTP_STATUS.FORBIDDEN);
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, HTTP_STATUS.CONFLICT);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, HTTP_STATUS.UNAUTHORIZED);
    }
}

const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;
    
    // Default to 500 if no status code
    if (!statusCode) {
        statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    }
    
    // Use custom message or default HTTP message
    if (!message || message === 'Internal Server Error') {
        message = HTTP_MESSAGES[statusCode] || 'Internal Server Error';
    }
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = err.message || HTTP_MESSAGES[HTTP_STATUS.BAD_REQUEST];
    }
    
    if (err.name === 'JsonWebTokenError') {
        statusCode = HTTP_STATUS.UNAUTHORIZED;
        message = 'Invalid or expired token';
    }
    
    if (err.name === 'TokenExpiredError') {
        statusCode = HTTP_STATUS.UNAUTHORIZED;
        message = 'Token has expired';
    }
    
    if (err.code === 'ENOENT') {
        statusCode = HTTP_STATUS.NOT_FOUND;
        message = 'File not found';
    }
    
    // Log error for debugging
    console.error(`[${new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T') + '.000Z'}] ${statusCode} - ${message}`);
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }
    
    res.status(statusCode).json({
        success: false,
        message,
        error_code: statusCode
    });
};

// Helper function to create standardized errors
const createError = (statusCode, message) => {
    const error = new Error(message || HTTP_MESSAGES[statusCode]);
    error.statusCode = statusCode;
    return error;
};

module.exports = {
    errorHandler,
    createError,
    AppError,
    ValidationError,
    NotFoundError,
    ForbiddenError,
    ConflictError,
    UnauthorizedError,
    HTTP_MESSAGES
};
