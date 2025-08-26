const jwt = require('jsonwebtoken');
const { HTTP_STATUS } = require('../constants/statusCodes');

// Global token blacklist (in production, use Redis)
let tokenBlacklist = new Set();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const tokenData of tokenBlacklist) {
    if (tokenData.exp < now) {
      tokenBlacklist.delete(tokenData);
    }
  }
}, 3600000); // 1 hour

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

  // Check if token is blacklisted
  for (const tokenData of tokenBlacklist) {
    if (tokenData.token === token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Token has been invalidated - Please login again',
        code: 'TOKEN_BLACKLISTED'
      });
    }
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || 'bcare-api',
      audience: process.env.JWT_AUDIENCE || 'bcare-client'
    });
    
    req.user = decoded;
    req.token = token; // Store token for potential blacklisting
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

// Function to add token to blacklist
const blacklistToken = (token, exp, userId, userRole) => {
  tokenBlacklist.add({
    token: token,
    exp: exp,
    user_id: userId,
    user_role: userRole,
    blacklisted_at: Math.floor(Date.now() / 1000)
  });
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

module.exports = { authenticateToken, authorizeRole, blacklistToken };