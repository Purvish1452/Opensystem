const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const passport = require('./config/passport');
const loggerMiddleware = require('./middlewares/loggerMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');
const AppError = require('./utils/AppError');
const { STATUS_CODES } = require('./constants');

/**
 * Express Application Configuration
 * Middleware order matters — see comments for reasoning
 */

const app = express();

// ============================================
// 1. SECURITY HEADERS (first — no deps)
// ============================================
app.use(helmet());

// ============================================
// 2. CORS (before routes + body parsing)
// ============================================
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// ============================================
// 3. BODY PARSING (before sanitization)
// type includes 'text/plain' so Postman requests
// without Content-Type: application/json still parse correctly
// ============================================
app.use(express.json({ limit: '50kb', type: ['application/json', 'text/plain'] }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ============================================
// 4. SANITIZATION (must run after body parsing)
// ============================================

// NoSQL injection protection
app.use(mongoSanitize());

// XSS protection
app.use(xss());

// Compress response bodies
app.use(compression());

// Passport OAuth (stateless — no sessions)
app.use(passport.initialize());

// ============================================
// 5. RATE LIMITING
// ============================================
const rateLimiter = new RateLimiterMemory({
    points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900,
});

app.use(async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (error) {
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.'
        });
    }
});

// ============================================
// 6. LOGGING
// ============================================
app.use(loggerMiddleware);

// ============================================
// 7. API ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Mount API v1 routes
const apiV1Routes = require('./routes/index');
app.use('/api/v1', apiV1Routes);

// Legacy routes (deprecated)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// ============================================
// 8. 404 HANDLER
// ============================================
app.all('*', (req, res, next) => {
    next(
        new AppError(
            `Cannot find ${req.originalUrl} on this server`,
            STATUS_CODES.NOT_FOUND
        )
    );
});

// ============================================
// 9. GLOBAL ERROR HANDLER
// ============================================
app.use(errorMiddleware);

module.exports = app;
