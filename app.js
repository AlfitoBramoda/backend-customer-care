const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Trust proxy (for HTTPS redirect & secure cookies)
app.set('trust proxy', 1);

// Security headers
const isProd = process.env.NODE_ENV === 'production';
app.use(helmet({
    contentSecurityPolicy: isProd ? { useDefaults: true } : false,
    crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const allowlist = (process.env.CORS_ORIGIN || 'http://localhost:3001').split(',');
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        cb(null, allowlist.includes(origin));
    },
    credentials: process.env.CORS_CREDENTIALS === 'true'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the auth routes (no longer needs db parameter)
const createAuthRoutes = require('./routes/authRoutes');
app.use('/v1/auth', createAuthRoutes());

// Add ticket routes
const createTicketRoutes = require('./routes/ticketRoutes');
app.use('/v1/tickets', createTicketRoutes());

// Add customer routes
const createCustomerRoutes = require('./routes/customerRoutes');
app.use('/v1/customers', createCustomerRoutes());

// Add reference routes
const createReferenceRoutes = require('./routes/referenceRoutes');
app.use('/v1', createReferenceRoutes());

// Add feedback routes
const createFeedbackRoutes = require('./routes/feedbackRoutes');
app.use('/v1/feedback', createFeedbackRoutes());

// Add attachment routes
const createAttachmentRoutes = require('./routes/attachmentRoutes');
app.use('/v1', createAttachmentRoutes());

// Add FAQ routes
const createFaqRoutes = require('./routes/faqRoutes');
app.use('/v1/faqs', createFaqRoutes());

// Add Chat routes
const chatRoutes = require('./routes/chatRoutes');
app.use('/v1/chats', chatRoutes);

// Swagger - NO AUTH REQUIRED
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./mock/docs/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Handle custom errors with status
    if (err.status) {
        return res.status(err.status).json({
            success: false,
            message: err.message
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

const PORT = process.env.PORT_APP || 3001;
app.listen(PORT, () => {
    console.log(`✅ GCS configured successfully`);
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
