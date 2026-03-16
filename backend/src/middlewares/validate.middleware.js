const { STATUS_CODES, MESSAGES } = require('../constants');
const AppError = require('../utils/AppError');

/**
 * Validation Middleware
 * Wraps JOI validation schemas for Express routes
 */

/**
 * Validate request body
 * @param {Joi.Schema} schema - JOI validation schema
 */
const validateBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Return all errors
            stripUnknown: true, // Remove unknown fields
            errors: {
                wrap: {
                    label: '' // Remove quotes from field names in error messages
                }
            }
        });

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return next(new AppError(errorMessage, STATUS_CODES.BAD_REQUEST));
        }

        // Replace req.body with validated and sanitized value
        req.body = value;
        next();
    };
};

/**
 * Validate request params
 * @param {Joi.Schema} schema - JOI validation schema
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            allowUnknown: true,  // Don't reject params validated by other validateParams calls
            // NOTE: No stripUnknown — multi-param routes call validateParams separately
            // for each param, so we must preserve all params across calls
            errors: {
                wrap: {
                    label: ''
                }
            }
        });

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return next(new AppError(errorMessage, STATUS_CODES.BAD_REQUEST));
        }

        // Merge validated value back, preserving existing params
        req.params = { ...req.params, ...value };
        next();
    };
};

/**
 * Validate request query
 * @param {Joi.Schema} schema - JOI validation schema
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            errors: {
                wrap: {
                    label: ''
                }
            }
        });

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return next(new AppError(errorMessage, STATUS_CODES.BAD_REQUEST));
        }

        req.query = value;
        next();
    };
};

module.exports = {
    validateBody,
    validateParams,
    validateQuery
};
