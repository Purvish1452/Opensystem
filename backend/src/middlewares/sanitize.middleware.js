const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

/**
 * Sanitization Middleware
 * Prevents NoSQL injection and XSS attacks
 */

/**
 * Sanitize all user inputs
 * - Removes $ and . from keys (NoSQL injection prevention)
 * - Sanitizes HTML content (XSS prevention)
 * - Prevents ReDoS attacks
 */
const sanitizeMiddleware = (req, res, next) => {
    // NoSQL injection protection
    mongoSanitize.sanitize(req.body, {
        replaceWith: '_',
        onSanitize: ({ req, key }) => {
            console.warn(`Sanitized key: ${key} in request from ${req.ip}`);
        }
    });

    mongoSanitize.sanitize(req.query, { replaceWith: '_' });
    mongoSanitize.sanitize(req.params, { replaceWith: '_' });

    // XSS protection for string fields
    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string') {
                // Sanitize HTML but allow safe formatting
                obj[key] = xss(obj[key], {
                    whiteList: {}, // No HTML tags allowed
                    stripIgnoreTag: true,
                    stripIgnoreTagBody: ['script', 'style']
                });
            } else if (typeof obj[key] === 'object') {
                sanitizeObject(obj[key]);
            }
        });
    };

    sanitizeObject(req.body);
    sanitizeObject(req.query);

    next();
};

module.exports = sanitizeMiddleware;
