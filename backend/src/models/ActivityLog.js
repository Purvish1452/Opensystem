const mongoose = require('mongoose');
const { ACTIVITY_TYPES, RETENTION } = require('../constants');

/**
 * Activity Log Model Schema - Phase-2
 * Comprehensive audit trail for user actions and security monitoring
 */

const activityLogSchema = new mongoose.Schema(
    {
        // User
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User is required'],
            index: true
        },

        // Action
        actionType: {
            type: String,
            required: [true, 'Action type is required'],
            enum: Object.values(ACTIVITY_TYPES),
            index: true
        },

        // Target (optional, for actions on specific resources)
        targetType: {
            type: String,
            enum: ['Post', 'Project', 'User', 'Comment', null]
        },

        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'targetType'
        },

        // Additional Context
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        // Security Tracking
        ipAddress: {
            type: String,
            index: true
        },

        geoLocation: {
            country: String,
            city: String,
            coordinates: [Number] // [longitude, latitude]
        },

        userAgent: String,

        deviceInfo: {
            deviceType: String, // mobile, desktop, tablet
            deviceId: String,
            browser: String,
            os: String
        },

        // Suspicious Activity Flag
        isSuspicious: {
            type: Boolean,
            default: false,
            index: true
        },

        // Timestamp
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: false // Using custom timestamp field
    }
);

// ============================================
// INDEXES
// ============================================

// User activity history
activityLogSchema.index({ user: 1, timestamp: -1 });

// Action-based queries
activityLogSchema.index({ actionType: 1, timestamp: -1 });

// Abuse detection (multiple accounts same IP)
activityLogSchema.index({ ipAddress: 1, timestamp: -1 });

// Suspicious activity queue
activityLogSchema.index({ isSuspicious: 1, timestamp: -1 });

// User-specific action tracking
activityLogSchema.index({ actionType: 1, user: 1, timestamp: -1 });

// TTL index (auto-delete after 90 days)
activityLogSchema.index(
    { timestamp: 1 },
    { expireAfterSeconds: RETENTION.ACTIVITY_LOG_DAYS * 24 * 60 * 60 }
);

// ============================================
// STATIC METHODS
// ============================================

/**
 * Log activity with device and IP tracking
 */
activityLogSchema.statics.logActivity = async function (userId, actionType, targetType, targetId, req) {
    const deviceInfo = {
        deviceId: req.headers['x-device-id'] || null,
        browser: req.headers['user-agent'] ? req.headers['user-agent'].split(' ')[0] : 'Unknown',
        os: req.headers['user-agent'] ? req.headers['user-agent'].split('(')[1]?.split(')')[0] : 'Unknown',
        deviceType: /mobile/i.test(req.headers['user-agent']) ? 'mobile' : 'desktop'
    };

    const ipAddress = req.ip || req.connection.remoteAddress;

    const log = await this.create({
        user: userId,
        actionType,
        targetType: targetType || null,
        targetId: targetId || null,
        ipAddress,
        userAgent: req.headers['user-agent'],
        deviceInfo,
        timestamp: Date.now()
    });

    return log;
};

/**
 * Get user's activity history
 */
activityLogSchema.statics.getUserActivity = async function (userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    return await this.find({ user: userId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);
};

/**
 * Detect abuse patterns
 */
activityLogSchema.statics.detectAbusePattern = async function (userId, actionType, timeWindow = 3600000) {
    const since = Date.now() - timeWindow; // Default: last hour

    const count = await this.countDocuments({
        user: userId,
        actionType,
        timestamp: { $gte: since }
    });

    // Define thresholds
    const thresholds = {
        [ACTIVITY_TYPES.VOTE]: 100,
        [ACTIVITY_TYPES.COMMENT]: 30,
        [ACTIVITY_TYPES.POST_CREATE]: 10,
        [ACTIVITY_TYPES.ENROLL]: 20,
        [ACTIVITY_TYPES.REPORT]: 10
    };

    const threshold = thresholds[actionType] || 50;

    if (count >= threshold) {
        // Flag as suspicious
        await this.updateMany(
            {
                user: userId,
                actionType,
                timestamp: { $gte: since }
            },
            { $set: { isSuspicious: true } }
        );

        return {
            isAbuse: true,
            count,
            threshold,
            message: `Suspicious activity detected: ${count} ${actionType} actions in the last hour`
        };
    }

    return { isAbuse: false, count, threshold };
};

/**
 * Get failed login attempts for brute force detection
 */
activityLogSchema.statics.getFailedLoginAttempts = async function (userId, timeWindow = 3600000) {
    const since = Date.now() - timeWindow;

    return await this.countDocuments({
        user: userId,
        actionType: ACTIVITY_TYPES.FAILED_LOGIN,
        timestamp: { $gte: since }
    });
};

/**
 * Get suspicious activity
 */
activityLogSchema.statics.getSuspiciousActivity = async function (page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    return await this.find({ isSuspicious: true })
        .populate('user', 'username email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);
};

/**
 * Get admin actions for audit
 */
activityLogSchema.statics.getAdminActions = async function (page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    return await this.find({ actionType: ACTIVITY_TYPES.ADMIN_ACTION })
        .populate('user', 'username email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);
};

/**
 * Detect multiple accounts from same IP
 */
activityLogSchema.statics.detectMultipleAccountsSameIP = async function (ipAddress, timeWindow = 86400000) {
    const since = Date.now() - timeWindow; // Default: last 24 hours

    const users = await this.distinct('user', {
        ipAddress,
        actionType: ACTIVITY_TYPES.LOGIN,
        timestamp: { $gte: since }
    });

    if (users.length > 3) {
        return {
            isSuspicious: true,
            userCount: users.length,
            users,
            message: `${users.length} different accounts logged in from IP ${ipAddress} in the last 24 hours`
        };
    }

    return { isSuspicious: false, userCount: users.length };
};

/**
 * Check for repeated same content (spam detection)
 */
activityLogSchema.statics.detectRepeatedContent = async function (userId, contentHash, timeWindow = 3600000) {
    const since = Date.now() - timeWindow;

    const count = await this.countDocuments({
        user: userId,
        'metadata.contentHash': contentHash,
        timestamp: { $gte: since }
    });

    if (count > 3) {
        return {
            isSpam: true,
            count,
            message: `User posted the same content ${count} times in the last hour`
        };
    }

    return { isSpam: false, count };
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
