const rateLimit = require('express-rate-limit');
const { STATUS_CODES, MESSAGES } = require('../constants');

/**
 * Rate Limiting Middleware
 * Per-route rate limiting configurations
 */

// General API rate limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: MESSAGES.RATE_LIMIT_EXCEEDED,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(STATUS_CODES.TOO_MANY_REQUESTS).json({
            success: false,
            message: MESSAGES.RATE_LIMIT_EXCEEDED
        });
    }
});

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true, // Don't count successful logins
    standardHeaders: true,
    legacyHeaders: false
});

// Post creation rate limiter
const postCreateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 posts per hour
    message: 'Too many posts created, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

// Comment rate limiter
const commentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // 30 comments per hour
    message: 'Too many comments, please slow down',
    standardHeaders: true,
    legacyHeaders: false
});

// Vote rate limiter
const voteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // 100 votes per hour
    message: 'Too many votes, please slow down',
    standardHeaders: true,
    legacyHeaders: false
});

// Report rate limiter
const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 reports per hour
    message: 'Too many reports, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

// Project creation rate limiter
const projectCreateLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // 5 projects per day
    message: 'Too many projects created, please try again tomorrow',
    standardHeaders: true,
    legacyHeaders: false
});

// Enrollment rate limiter
const enrollmentLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 20, // 20 enrollments per day
    message: 'Too many enrollment requests, please try again tomorrow',
    standardHeaders: true,
    legacyHeaders: false
});

// Search rate limiter
const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 searches per minute
    message: 'Too many search requests, please slow down',
    standardHeaders: true,
    legacyHeaders: false
});

// Admin login rate limiter — 3 attempts per 30 min (much stricter than user authLimiter)
const adminLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 3, // 3 attempts only
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(STATUS_CODES.TOO_MANY_REQUESTS).json({
            success: false,
            message: 'Too many admin login attempts. Account temporarily locked for 30 minutes.'
        });
    }
});

// Admin write limiter — for suspend / unlock / force-logout / risk adjust
const adminWriteLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 write actions per minute
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(STATUS_CODES.TOO_MANY_REQUESTS).json({
            success: false,
            message: 'Too many admin write operations. Please slow down.'
        });
    }
});

module.exports = {
    generalLimiter,
    authLimiter,
    postCreateLimiter,
    commentLimiter,
    voteLimiter,
    reportLimiter,
    projectCreateLimiter,
    enrollmentLimiter,
    searchLimiter,
    adminLimiter,
    adminWriteLimiter
};
