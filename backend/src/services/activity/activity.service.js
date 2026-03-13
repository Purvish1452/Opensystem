const ActivityLog = require('../../models/ActivityLog');
const logger = require('../../utils/logger');
const { ACTIVITY_TYPES } = require('../../constants');

/**
 * Activity Service - Production Grade
 * 
 * Features:
 * - Async non-blocking logging (never slows down user requests)
 * - Queue-ready pattern (Bull/Redis ready structure)
 * - Severity classification for events
 * - Comprehensive abuse detection
 */

/**
 * Event severity levels
 */
const SEVERITY = {
    LOW: 'low',           // Normal user actions (view, search)
    MEDIUM: 'medium',     // Mutating actions (create, update)
    HIGH: 'high',         // Security-sensitive (login, password change)
    CRITICAL: 'critical'  // Admin actions, suspicious activity
};

/**
 * Severity mapping for activity types
 */
const SEVERITY_MAP = {
    [ACTIVITY_TYPES.LOGIN]: SEVERITY.HIGH,
    [ACTIVITY_TYPES.LOGOUT]: SEVERITY.MEDIUM,
    [ACTIVITY_TYPES.FAILED_LOGIN]: SEVERITY.HIGH,
    [ACTIVITY_TYPES.PASSWORD_CHANGE]: SEVERITY.HIGH,
    [ACTIVITY_TYPES.EMAIL_VERIFICATION]: SEVERITY.HIGH,
    [ACTIVITY_TYPES.POST_CREATE]: SEVERITY.MEDIUM,
    [ACTIVITY_TYPES.POST_UPDATE]: SEVERITY.MEDIUM,
    [ACTIVITY_TYPES.POST_DELETE]: SEVERITY.MEDIUM,
    [ACTIVITY_TYPES.COMMENT]: SEVERITY.MEDIUM,
    [ACTIVITY_TYPES.VOTE]: SEVERITY.LOW,
    [ACTIVITY_TYPES.REPORT]: SEVERITY.HIGH,
    [ACTIVITY_TYPES.ENROLL]: SEVERITY.MEDIUM,
    [ACTIVITY_TYPES.PROJECT_CREATE]: SEVERITY.MEDIUM,
    [ACTIVITY_TYPES.ADMIN_ACTION]: SEVERITY.CRITICAL
};

/**
 * Log activity - Async non-blocking
 * NEVER awaited in controllers/services to avoid slowing down requests
 * 
 * @param {String} userId - User ID
 * @param {String} actionType - Activity type from ACTIVITY_TYPES
 * @param {String} targetType - Target type (Post/Project/User/Comment)
 * @param {String} targetId - Target ID
 * @param {Object} req - Express request object
 * @param {Object} metadata - Additional metadata
 */
const logActivity = (userId, actionType, targetType = null, targetId = null, req = {}, metadata = {}) => {
    // Fire and forget - async non-blocking
    setImmediate(async () => {
        try {
            const severity = SEVERITY_MAP[actionType] || SEVERITY.LOW;

            // Prepare activity log data
            const activityData = {
                user: userId,
                actionType,
                targetType,
                targetId,
                ipAddress: req.ip || req.connection?.remoteAddress,
                userAgent: req.headers?.['user-agent'],
                deviceInfo: {
                    deviceId: req.headers?.['x-device-id'] || null,
                    browser: req.headers?.['user-agent'] ? req.headers['user-agent'].split(' ')[0] : 'Unknown',
                    os: req.headers?.['user-agent'] ? req.headers['user-agent'].split('(')[1]?.split(')')[0] : 'Unknown',
                    deviceType: /mobile/i.test(req.headers?.['user-agent']) ? 'mobile' : 'desktop'
                },
                metadata: {
                    ...metadata,
                    severity,
                    requestId: req.requestId,
                    path: req.originalUrl,
                    method: req.method
                },
                timestamp: Date.now()
            };

            // Create activity log (queue-ready pattern)
            await ActivityLog.create(activityData);

            // Log high/critical severity events
            if (severity === SEVERITY.HIGH || severity === SEVERITY.CRITICAL) {
                logger.info('High severity activity logged', {
                    userId,
                    actionType,
                    severity,
                    requestId: req.requestId
                });
            }
        } catch (error) {
            // Never throw - just log the error
            logger.error('Failed to log activity', {
                error: error.message,
                userId,
                actionType
            });
        }
    });
};

/**
 * Detect spam patterns
 * 
 * @param {String} userId - User ID
 * @param {String} actionType - Activity type
 * @param {Number} timeWindow - Time window in milliseconds (default: 1 hour)
 * @returns {Promise<Object>} Abuse detection result
 */
const detectSpamPatterns = async (userId, actionType, timeWindow = 3600000) => {
    return await ActivityLog.detectAbusePattern(userId, actionType, timeWindow);
};

/**
 * Detect multiple accounts from same IP
 * 
 * @param {String} ipAddress - IP address
 * @param {Number} timeWindow - Time window in milliseconds (default: 24 hours)
 * @returns {Promise<Object>} Detection result
 */
const detectMultipleAccounts = async (ipAddress, timeWindow = 86400000) => {
    return await ActivityLog.detectMultipleAccountsSameIP(ipAddress, timeWindow);
};

/**
 * Detect rapid voting (vote manipulation)
 * 
 * @param {String} userId - User ID
 * @param {Number} timeWindow - Time window in milliseconds (default: 1 hour)
 * @returns {Promise<Object>} Detection result
 */
const detectRapidVoting = async (userId, timeWindow = 3600000) => {
    return await ActivityLog.detectAbusePattern(userId, ACTIVITY_TYPES.VOTE, timeWindow);
};

/**
 * Detect repeated content (spam detection)
 * 
 * @param {String} userId - User ID
 * @param {String} contentHash - Content hash
 * @param {Number} timeWindow - Time window in milliseconds (default: 1 hour)
 * @returns {Promise<Object>} Detection result
 */
const detectRepeatedContent = async (userId, contentHash, timeWindow = 3600000) => {
    return await ActivityLog.detectRepeatedContent(userId, contentHash, timeWindow);
};

/**
 * Get user activity history
 * 
 * @param {String} userId - User ID
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Promise<Array>} Activity logs
 */
const getUserActivity = async (userId, page = 1, limit = 20) => {
    return await ActivityLog.getUserActivity(userId, page, limit);
};

/**
 * Get suspicious activity
 * 
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Promise<Array>} Suspicious activity logs
 */
const getSuspiciousActivity = async (page = 1, limit = 20) => {
    return await ActivityLog.getSuspiciousActivity(page, limit);
};

module.exports = {
    logActivity,
    detectSpamPatterns,
    detectMultipleAccounts,
    detectRapidVoting,
    detectRepeatedContent,
    getUserActivity,
    getSuspiciousActivity,
    SEVERITY
};
