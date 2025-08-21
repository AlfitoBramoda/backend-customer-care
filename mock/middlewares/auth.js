const jwt = require('jsonwebtoken');
const { HTTP_STATUS } = require('../constants/statusCodes');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Login required - No authorization token provided',
      code: 'LOGIN_REQUIRED'
    });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Login required - Token missing',
      code: 'LOGIN_REQUIRED'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || 'bcare-api',
      audience: process.env.JWT_AUDIENCE || 'bcare-client'
    });
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.TOKEN_EXPIRED).json({
        success: false,
        message: 'Token expired - Please refresh your session',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token - Authentication failed',
      code: 'INVALID_TOKEN'
    });
  }
};

const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRole };