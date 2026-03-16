const { STATUS_CODES } = require('../constants');

/**
 * Custom Error Class - Enhanced for Production
 * Extends native Error class with comprehensive error tracking
 * 
 * Features:
 * - Error source tracking (controller/service/middleware)
 * - Request ID for distributed tracing
 * - Error codes for API consumers
 * - Validation error details
 * - Operational vs programming error distinction
 */
class AppError extends Error {
    constructor(message, statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR, errorCode = null) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        // Error code for API consumers (e.g., 'AUTH_001', 'VALIDATION_002')
        this.errorCode = errorCode;

        // Error source for debugging
        this.errorSource = null; // Will be set by middleware/service/controller

        // Request ID for traceability across logs
        this.requestId = null; // Will be set by error handler

        // Validation errors array (for JOI/validation errors)
        this.errors = [];

        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Set error source for debugging
     */
    setSource(source) {
        this.errorSource = source; // 'controller' | 'service' | 'middleware'
        return this;
    }

    /**
     * Set request ID for traceability
     */
    setRequestId(requestId) {
        this.requestId = requestId;
        return this;
    }

    /**
     * Add validation errors
     */
    addValidationErrors(errors) {
        this.errors = errors;
        return this;
    }

    /**
     * Create validation error
     */
    static validationError(errors, message = 'Validation failed') {
        const error = new AppError(message, STATUS_CODES.BAD_REQUEST, 'VALIDATION_ERROR');
        error.addValidationErrors(errors);
        return error;
    }

    /**
     * Create authentication error
     */
    static authError(message = 'Authentication failed', errorCode = 'AUTH_ERROR') {
        return new AppError(message, STATUS_CODES.UNAUTHORIZED, errorCode);
    }

    /**
     * Create authorization error
     */
    static forbiddenError(message = 'Access forbidden', errorCode = 'FORBIDDEN') {
        return new AppError(message, STATUS_CODES.FORBIDDEN, errorCode);
    }

    /**
     * Create not found error
     */
    static notFoundError(resource = 'Resource', errorCode = 'NOT_FOUND') {
        return new AppError(`${resource} not found`, STATUS_CODES.NOT_FOUND, errorCode);
    }

    /**
     * Create conflict error
     */
    static conflictError(message = 'Resource already exists', errorCode = 'CONFLICT') {
        return new AppError(message, STATUS_CODES.CONFLICT, errorCode);
    }

    /**
     * Create rate limit error
     */
    static rateLimitError(message = 'Too many requests', errorCode = 'RATE_LIMIT') {
        return new AppError(message, STATUS_CODES.TOO_MANY_REQUESTS, errorCode);
    }
}

module.exports = AppError;

