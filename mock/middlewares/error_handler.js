// HTTP Status Code Messages
const HTTP_MESSAGES = {
    400: 'Bad Request',
    401: 'Unauthorized', 
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error'
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
        super(message, 400);
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403);
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401);
    }
}

const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;
    
    // Default to 500 if no status code
    if (!statusCode) {
        statusCode = 500;
    }
    
    // Use custom message or default HTTP message
    if (!message || message === 'Internal Server Error') {
        message = HTTP_MESSAGES[statusCode] || 'Internal Server Error';
    }
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.message || HTTP_MESSAGES[400];
    }
    
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid or expired token';
    }
    
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token has expired';
    }
    
    if (err.code === 'ENOENT') {
        statusCode = 404;
        message = 'File not found';
    }
    
    // Log error for debugging
    console.error(`[${new Date().toISOString()}] ${statusCode} - ${message}`);
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
