const asyncHandler = require('./asyncHandler');
const { verifyAccessToken } = require('../utils/generateToken');
const User = require('../models/User');

/**
 * Optional Authentication Middleware
 * Attaches user to request if token is present, but doesn't fail if missing
 * Used for public routes that have different behavior for authenticated users
 */

const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // If no token, continue without user
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        // Verify token
        const decoded = verifyAccessToken(token);

        // Get user from token and attach to request
        const user = await User.findById(decoded.id).select('-password');

        if (user) {
            req.user = user;
        } else {
            req.user = null;
        }
    } catch (error) {
        // Token invalid, but don't fail - just continue without user
        req.user = null;
    }

    next();
});

module.exports = { optionalAuth };
