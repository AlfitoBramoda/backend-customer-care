const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;