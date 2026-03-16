/**
 * Async Handler Middleware
 * Wraps async route handlers to catch errors and pass them to error middleware
 * Eliminates the need for try-catch blocks in controllers
 */

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
