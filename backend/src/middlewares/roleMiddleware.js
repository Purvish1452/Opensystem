const AppError = require('../utils/AppError');
const { STATUS_CODES, MESSAGES } = require('../constants');

/**
 * Role-Based Access Control Middleware
 * Restricts access to routes based on user roles
 * Must be used after protect middleware
 */

const authorize = (...roles) => {
    return (req, res, next) => {
        // Check if user exists (should be attached by protect middleware)
        if (!req.user) {
            return next(new AppError(MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED));
        }

        // Check if user's role is authorized
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    `User role '${req.user.role}' is not authorized to access this resource`,
                    STATUS_CODES.FORBIDDEN
                )
            );
        }

        next();
    };
};

module.exports = { authorize };
