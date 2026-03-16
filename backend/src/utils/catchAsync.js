const AppError = require('./AppError');
const logger = require('./logger');

/**
 * Async Error Wrapper - Production Grade
 * Eliminates try-catch boilerplate in controllers
 * 
 * Features:
 * - Automatic error forwarding to global error handler
 * - Unhandled promise rejection logging
 * - Request ID attachment for tracing
 * - Error source tracking
 */

const catchAsync = (fn, source = 'controller') => {
    return (req, res, next) => {
        // Generate request ID if not exists
        if (!req.requestId) {
            req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        Promise.resolve(fn(req, res, next))
            .catch((error) => {
                // Log unhandled promise rejections before forwarding
                if (error instanceof AppError) {
                    // Operational error - expected
                    error.setSource(source);
                    error.setRequestId(req.requestId);

                    logger.warn('Operational error caught', {
                        requestId: req.requestId,
                        errorCode: error.errorCode,
                        errorSource: error.errorSource,
                        message: error.message,
                        statusCode: error.statusCode,
                        userId: req.user?._id,
                        path: req.originalUrl,
                        method: req.method
                    });
                } else {
                    // Programming error - unexpected
                    logger.error('Unhandled promise rejection caught', {
                        requestId: req.requestId,
                        errorSource: source,
                        message: error.message,
                        stack: error.stack,
                        userId: req.user?._id,
                        path: req.originalUrl,
                        method: req.method
                    });

                    // Convert to AppError for consistent handling
                    const appError = new AppError(
                        process.env.NODE_ENV === 'production'
                            ? 'An unexpected error occurred'
                            : error.message,
                        500,
                        'INTERNAL_ERROR'
                    );
                    appError.setSource(source);
                    appError.setRequestId(req.requestId);
                    appError.originalError = error;

                    error = appError;
                }

                // Forward to global error handler
                next(error);
            });
    };
};

module.exports = catchAsync;
