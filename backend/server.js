require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');

/**
 * Server Entry Point
 * Initializes database connection and starts the Express server
 */

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger.error({ message: err.message, stack: err.stack });
    process.exit(1);
});

// Connect to database
connectDB();

// Start server
const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    logger.info(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error({ message: err.message, stack: err.stack });
    server.close(() => {
        process.exit(1);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully...');
    server.close(() => {
        logger.info('💤 Process terminated!');
    });
});

process.on('SIGINT', () => {
    logger.info('👋 SIGINT RECEIVED. Shutting down gracefully...');
    server.close(() => {
        logger.info('💤 Process terminated!');
    });
});
