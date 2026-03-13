const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * MongoDB Database Connection
 * Establishes connection to MongoDB with error handling and retry logic
 */

const connectDB = () => {
    const options = {
        // Connection options for production
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };

    let attempts = 0;
    const maxRetries = 5;

    const connectWithRetry = async () => {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI, options);

            logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
            logger.info(`📊 Database Name: ${conn.connection.name}`);

            // Handle connection events
            mongoose.connection.on('error', (err) => {
                logger.error(`❌ MongoDB connection error: ${err}`);
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
            });

            mongoose.connection.on('reconnected', () => {
                logger.info('✅ MongoDB reconnected');
            });

        } catch (error) {
            attempts += 1;
            logger.error(`❌ MongoDB Connection Failed (attempt ${attempts}/${maxRetries}): ${error.message}`);
            logger.error({ stack: error.stack });

            if (attempts < maxRetries) {
                const delay = Math.min(30000, 5000 * attempts);
                logger.warn(`Retrying MongoDB connection in ${delay / 1000}s...`);
                setTimeout(connectWithRetry, delay);
            } else {
                logger.error('❌ MongoDB failed to connect after maximum retries. Exiting.');
                process.exit(1);
            }
        }
    };

    // Start initial connection attempt
    connectWithRetry();
};

module.exports = connectDB;
