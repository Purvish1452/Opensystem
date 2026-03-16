const User = require('../../models/User');
const ActivityLog = require('../../models/ActivityLog');
const SuspiciousActivity = require('../../models/SuspiciousActivity');
const AdminAuditLog = require('../../models/AdminAuditLog');
const UserProject = require('../../models/UserProject');
const { logAudit } = require('./audit.service');
const {
    ADMIN_ACTIONS,
    ACCOUNT_STATUS,
    ADMIN_SECURITY,
    MESSAGES,
    STATUS_CODES
} = require('../../constants');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

/**
 * Admin Service — Phase-4
 *
 * All admin business logic lives here.
 * Controllers are thin — just invoke these methods.
 */

// ============================================
// IN-MEMORY OVERVIEW CACHE (30s TTL)
// ============================================
const overviewCache = { data: null, expiresAt: 0 };

// ============================================
// OVERVIEW / STATS
// ============================================

/**
 * Get platform overview using a single $facet aggregation.
 * Result cached in memory for 30 seconds to prevent DB spikes.
 */
const getOverview = async () => {
    const now = Date.now();
    if (overviewCache.data && now < overviewCache.expiresAt) {
        return overviewCache.data;
    }

    const ago24h = new Date(now - 86400000);
    const ago7d = new Date(now - 604800000);

    const [userStats] = await User.aggregate([
        {
            $facet: {
                total: [{ $count: 'count' }],
                byStatus: [{ $group: { _id: '$accountStatus', count: { $sum: 1 } } }],
                newToday: [{ $match: { createdAt: { $gte: ago24h } } }, { $count: 'count' }],
                newThisWeek: [{ $match: { createdAt: { $gte: ago7d } } }, { $count: 'count' }],
                activeToday: [{ $match: { lastActiveAt: { $gte: ago24h } } }, { $count: 'count' }],
                highRisk: [{ $match: { riskScore: { $gte: 50 } } }, { $count: 'count' }],
                locked: [{ $match: { lockUntil: { $gt: new Date() } } }, { $count: 'count' }]
            }
        }
    ]);

    const [suspiciousStats] = await SuspiciousActivity.aggregate([
        {
            $facet: {
                unresolved: [{ $match: { resolved: false } }, { $count: 'count' }],
                resolvedToday: [{ $match: { resolved: true, resolvedAt: { $gte: ago24h } } }, { $count: 'count' }]
            }
        }
    ]);

    const topTechStacks = await UserProject.aggregate([
        { $match: { isDeleted: false } },
        { $unwind: '$techStack' },
        { $group: { _id: '$techStack', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]);

    const result = {
        users: {
            total: userStats.total[0]?.count || 0,
            byStatus: userStats.byStatus,
            newToday: userStats.newToday[0]?.count || 0,
            newThisWeek: userStats.newThisWeek[0]?.count || 0,
            activeToday: userStats.activeToday[0]?.count || 0,
            highRisk: userStats.highRisk[0]?.count || 0,
            locked: userStats.locked[0]?.count || 0
        },
        suspicious: {
            unresolved: suspiciousStats.unresolved[0]?.count || 0,
            resolvedToday: suspiciousStats.resolvedToday[0]?.count || 0
        },
        topTechStacks
    };

    overviewCache.data = result;
    overviewCache.expiresAt = now + ADMIN_SECURITY.OVERVIEW_CACHE_TTL_MS;

    return result;
};

// ============================================
// USER LIST
// ============================================

/**
 * Paginated user list with filters.
 * Excludes admin accounts from results.
 *
 * @param {Object} filters — { riskScore, accountStatus, search, role }
 * @param {Number} page
 * @param {Number} limit
 */
const listUsers = async (filters = {}, page = 1, limit = 20) => {
    const query = { role: { $ne: 'admin' } }; // never expose admin in listings

    if (filters.accountStatus) query.accountStatus = filters.accountStatus;
    if (filters.riskScore === 'high') query.riskScore = { $gte: 50 };
    if (filters.riskScore === 'critical') query.riskScore = { $gte: 80 };
    if (filters.search) {
        query.$or = [
            { username: { $regex: filters.search, $options: 'i' } },
            { email: { $regex: filters.search, $options: 'i' } }
        ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
        User.find(query)
            .select('username email fullname role accountStatus riskScore lastAdminActionAt lastActiveAt createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(query)
    ]);

    return { users, total, page, pages: Math.ceil(total / limit) };
};

// ============================================
// USER DEEP INSPECTION
// ============================================

/**
 * Full user detail for admin inspection.
 * Uses Promise.allSettled — partial failure safe.
 *
 * @param {String} userId
 */
const getUserDetail = async (userId) => {
    const [userResult, activityResult, flagsResult, auditResult] = await Promise.allSettled([
        User.findById(userId)
            .select('-password -refreshTokens -emailVerificationToken -otp')
            .lean(),
        ActivityLog.find({ user: userId })
            .sort({ timestamp: -1 })
            .limit(20)
            .lean(),
        SuspiciousActivity.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean(),
        AdminAuditLog.find({ targetId: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()
    ]);

    const user = userResult.status === 'fulfilled' ? userResult.value : null;
    if (!user) throw new AppError('User not found', STATUS_CODES.NOT_FOUND);

    return {
        user,
        activityTimeline: activityResult.status === 'fulfilled' ? activityResult.value : [],
        suspiciousFlags: flagsResult.status === 'fulfilled' ? flagsResult.value : [],
        auditHistory: auditResult.status === 'fulfilled' ? auditResult.value : []
    };
};

// ============================================
// USER CONTROL ACTIONS
// (Wrapped in Mongoose sessions for atomicity)
// ============================================

/**
 * Suspend a user account.
 */
const suspendUser = async (userId, adminId, reason, req) => {
    const session = await User.startSession();
    let auditId = null;
    try {
        session.startTransaction();

        const user = await User.findByIdAndUpdate(
            userId,
            {
                accountStatus: ACCOUNT_STATUS.SUSPENDED,
                lastAdminActionAt: new Date()
            },
            { new: true, session, select: 'username email accountStatus' }
        );
        if (!user) throw new AppError('User not found', STATUS_CODES.NOT_FOUND);

        await session.commitTransaction();

        // Audit log (outside transaction — non-blocking)
        auditId = await logAudit({
            adminId,
            action: ADMIN_ACTIONS.SUSPEND_USER,
            targetType: 'User',
            targetId: userId,
            reason,
            metadata: { username: user.username, email: user.email },
            req
        });

        return { user, auditId };
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

/**
 * Unlock / unsuspend a user account.
 */
const unlockUser = async (userId, adminId, reason, req) => {
    const session = await User.startSession();
    let auditId = null;
    try {
        session.startTransaction();

        const user = await User.findByIdAndUpdate(
            userId,
            {
                accountStatus: ACCOUNT_STATUS.ACTIVE,
                lockUntil: null,
                loginAttempts: 0,
                lastAdminActionAt: new Date()
            },
            { new: true, session, select: 'username email accountStatus' }
        );
        if (!user) throw new AppError('User not found', STATUS_CODES.NOT_FOUND);

        await session.commitTransaction();

        auditId = await logAudit({
            adminId,
            action: ADMIN_ACTIONS.UNLOCK_USER,
            targetType: 'User',
            targetId: userId,
            reason: reason || 'Account unlocked by admin',
            metadata: { username: user.username },
            req
        });

        return { user, auditId };
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

/**
 * Force logout — revoke all refresh tokens.
 */
const forceLogout = async (userId, adminId, reason, req) => {
    const session = await User.startSession();
    let auditId = null;
    try {
        session.startTransaction();

        const user = await User.findByIdAndUpdate(
            userId,
            {
                refreshTokens: [],
                lastAdminActionAt: new Date()
            },
            { new: true, session, select: 'username email' }
        );
        if (!user) throw new AppError('User not found', STATUS_CODES.NOT_FOUND);

        await session.commitTransaction();

        auditId = await logAudit({
            adminId,
            action: ADMIN_ACTIONS.FORCE_LOGOUT,
            targetType: 'User',
            targetId: userId,
            reason: reason || 'Force logout by admin',
            metadata: { username: user.username },
            req
        });

        return { user, auditId };
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

module.exports = {
    getOverview,
    listUsers,
    getUserDetail,
    suspendUser,
    unlockUser,
    forceLogout
};
