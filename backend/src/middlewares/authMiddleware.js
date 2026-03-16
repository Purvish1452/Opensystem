const asyncHandler = require('./asyncHandler');
const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/generateToken');
const { STATUS_CODES, MESSAGES, ACCOUNT_STATUS } = require('../constants');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request object
 * Protects routes that require authentication
 */

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
        return next(new AppError(MESSAGES.TOKEN_REQUIRED, STATUS_CODES.UNAUTHORIZED));
    }

    try {
        // Verify token
        const decoded = verifyAccessToken(token);

        // Get user from token and attach to request
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return next(new AppError(MESSAGES.USER_NOT_FOUND, STATUS_CODES.UNAUTHORIZED));
        }

        // Block unverified users — they must confirm OTP before using the platform
        if (!user.emailVerified || user.accountStatus === ACCOUNT_STATUS.PENDING_VERIFICATION) {
            return next(new AppError(
                'Email not verified. Please verify your account with the OTP sent to your inbox.',
                STATUS_CODES.FORBIDDEN
            ));
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        return next(new AppError(MESSAGES.INVALID_TOKEN, STATUS_CODES.UNAUTHORIZED));
    }
});

/**
 * Optional Authentication Middleware
 * Attaches user to req if a valid token is present, but does NOT block the request if there is no token.
 * Useful for public routes that personalize responses for logged-in users.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(); // No token — proceed as guest
    }

    try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id).select('-password');
        if (user) req.user = user;
    } catch (_) {
        // Invalid token — still proceed as guest, don't block
    }

    next();
});

module.exports = { protect, optionalAuth };
