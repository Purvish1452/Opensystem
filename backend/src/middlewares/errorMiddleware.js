const logger = require('../utils/logger');
const { STATUS_CODES, MESSAGES } = require('../constants');
const AppError = require('../utils/AppError');

/**
 * Global Error Handler Middleware - Production Grade
 * Catches all errors and sends appropriate response based on environment
 * 
 * Features:
 * - Request ID tracking for traceability
 * - Error source logging (controller/service/middleware)
 * - Operational vs programming error distinction
 * - Comprehensive error transformation
 * - Environment-aware responses
 */

const errorMiddleware = (err, req, res, next) => {
    // Ensure request ID exists
    const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    error.errorCode = err.errorCode || 'INTERNAL_ERROR';
    error.errorSource = err.errorSource || 'unknown';
    error.requestId = requestId;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error.message = 'Resource not found';
        error.statusCode = STATUS_CODES.NOT_FOUND;
        error.errorCode = 'INVALID_ID';
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error.message = `${field} already exists`;
        error.statusCode = STATUS_CODES.CONFLICT;
        error.errorCode = 'DUPLICATE_ENTRY';
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        error.message = errors.join(', ');
        error.statusCode = STATUS_CODES.BAD_REQUEST;
        error.errorCode = 'VALIDATION_ERROR';
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error.message = MESSAGES.INVALID_TOKEN;
        error.statusCode = STATUS_CODES.UNAUTHORIZED;
        error.errorCode = 'INVALID_TOKEN';
    }

    if (err.name === 'TokenExpiredError') {
        error.message = 'Token has expired';
        error.statusCode = STATUS_CODES.UNAUTHORIZED;
        error.errorCode = 'TOKEN_EXPIRED';
    }

    // Log error with comprehensive context
    const logContext = {
        requestId,
        errorCode: error.errorCode,
        errorSource: error.errorSource,
        message: error.message,
        statusCode: error.statusCode,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?._id,
        userAgent: req.headers['user-agent'],
        isOperational: err.isOperational || false
    };

    // Log based on severity
    if (error.statusCode >= 500) {
        logger.error('Server error', {
            ...logContext,
            stack: err.stack
        });
    } else if (error.statusCode >= 400) {
        logger.warn('Client error', logContext);
    }

    // Build error response
    const errorResponse = {
        success: false,
        message: error.message || MESSAGES.INTERNAL_ERROR,
        errorCode: error.errorCode,
        requestId
    };

    // Add validation errors if present
    if (err.errors && err.errors.length > 0) {
        errorResponse.errors = err.errors;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.errorSource = error.errorSource;
    }

    // Send error response
    res.status(error.statusCode).json(errorResponse);
};

module.exports = errorMiddleware;

