const validateLoginCustomer = (req, res, next) => {
    const { email, password } = req.body;
    
    // Check required fields
    if (!email || !password) {
        return res.status(400).json({
        success: false,
        message: 'Email and password are required'
        });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
        success: false,
        message: 'Invalid email format'
        });
    }
    
    next();
};

const validateLoginEmployee = (req, res, next) => {
    const { npp, password } = req.body;
    
    // Check required fields
    if (!npp || !password) {
        return res.status(400).json({
        success: false,
        message: 'NPP and password are required'
        });
    }
    
    next();
};

module.exports = { validateLoginCustomer, validateLoginEmployee };
