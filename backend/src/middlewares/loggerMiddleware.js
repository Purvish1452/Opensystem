const morgan = require('morgan');
const logger = require('../utils/logger');

/**
 * Logger Middleware
 * Logs HTTP requests using Morgan and Winston
 */

// Create a stream object for Winston
const stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

// Morgan format for development
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

// Create Morgan middleware
const loggerMiddleware = morgan(morganFormat, { stream });

module.exports = loggerMiddleware;
