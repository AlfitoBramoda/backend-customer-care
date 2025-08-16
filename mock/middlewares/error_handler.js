const errorHandler = (err, req, res, next) => {
    let status = err.status || 500;
    let message = err.message || 'Internal Server Error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        status = 400;
        message = 'Validation Error';
    }

    if (err.name === 'JsonWebTokenError') {
        status = 401;
        message = 'Invalid token';
    }

    console.error('Error:', err);

    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
