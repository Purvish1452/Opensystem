const { protect } = require('../../middlewares/authMiddleware');
const { authorize } = require('../../middlewares/roleMiddleware');
const { isAdmin, ROLES } = require('../../constants');
const AppError = require('../../utils/AppError');
const { STATUS_CODES } = require('../../constants');

/**
 * Admin Middleware — Phase-4
 *
 * requireAdmin: [protect, authorize('admin')]
 *   - protect ensures req.user is set from JWT
 *   - authorize('admin') checks role enum
 *   - secondary isAdmin() check is defense-in-depth
 *
 * injectAuditContext: attaches forensic metadata to req
 *   for downstream audit logging
 */

/**
 * Secondary role check — defense in depth
 * Even after authorize passes, verify isAdmin before any mutation.
 * Protects against middleware ordering mistakes.
 */
const enforceAdminIdentity = (req, res, next) => {
    if (!isAdmin(req.user)) {
        return next(new AppError(
            'Admin identity verification failed — access denied',
            STATUS_CODES.FORBIDDEN
        ));
    }
    next();
};

/**
 * Attach audit context to request for downstream services
 * Always call this AFTER protect + authorize
 */
const injectAuditContext = (req, res, next) => {
    req.adminId = req.user._id;
    req.clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    req.userAgent = req.headers['user-agent'] || 'unknown';
    // requestId is already attached by loggerMiddleware
    next();
};

/**
 * requireAdmin — full admin guard stack
 * Usage: router.get('/route', ...requireAdmin, handler)
 */
const requireAdmin = [protect, authorize('admin'), enforceAdminIdentity, injectAuditContext];

module.exports = { requireAdmin, injectAuditContext, enforceAdminIdentity };
