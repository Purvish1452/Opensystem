const User = require('../../models/User');
const AdminAuditLog = require('../../models/AdminAuditLog');
const { RISK_SCORE_WEIGHTS, RISK_THRESHOLDS, ADMIN_ACTIONS, ACCOUNT_STATUS } = require('../../constants');
const logger = require('../../utils/logger');

/**
 * Risk Service — Phase-4
 *
 * Centralised risk score management.
 * All riskScore mutations flow through this service — never set directly in controllers.
 * Score is always clamped 0–100.
 */

/**
 * Apply risk score delta for a suspicious event.
 * Auto-locks account at RISK_THRESHOLDS.AUTO_LOCK (50).
 * Flags for admin review at RISK_THRESHOLDS.ADMIN_REVIEW (80).
 *
 * @param {String} userId
 * @param {String} type — SUSPICIOUS_TYPES value
 * @param {Object} [adminReq] — if triggered by admin, for audit trail
 * @returns {Object} { newScore, wasLocked, needsReview }
 */
const applyRiskScore = async (userId, type, adminReq = null) => {
    const delta = RISK_SCORE_WEIGHTS[type] || 10;

    // Atomic increment + clamp in a single findOneAndUpdate
    const user = await User.findByIdAndUpdate(
        userId,
        [
            {
                $set: {
                    riskScore: {
                        $min: [
                            RISK_THRESHOLDS.MAX,
                            { $add: ['$riskScore', delta] }
                        ]
                    }
                }
            }
        ],
        { new: true, select: 'riskScore accountStatus lockUntil username email' }
    );

    if (!user) throw new Error(`User ${userId} not found during risk score update`);

    const newScore = user.riskScore;
    let wasLocked = false;
    let needsReview = false;

    // Auto-lock at threshold
    if (newScore >= RISK_THRESHOLDS.AUTO_LOCK && user.accountStatus === ACCOUNT_STATUS.ACTIVE) {
        await User.findByIdAndUpdate(userId, {
            accountStatus: ACCOUNT_STATUS.SUSPENDED,
            lockUntil: new Date(Date.now() + 30 * 60 * 1000) // 30 min auto-lock
        });
        wasLocked = true;
        logger.warn('User auto-locked by risk engine', { userId, riskScore: newScore, type });
    }

    if (newScore >= RISK_THRESHOLDS.ADMIN_REVIEW) {
        needsReview = true;
    }

    return { newScore, wasLocked, needsReview, delta };
};

/**
 * Manually adjust risk score — admin action only.
 * Delta clamped to ±ADMIN_SECURITY.MAX_RISK_DELTA (50).
 * Writes to AdminAuditLog.
 *
 * @param {String} userId
 * @param {Number} delta  e.g. +15 or -20
 * @param {String} adminId
 * @param {Object} req — Express req for audit context
 */
const adjustRiskScore = async (userId, delta, adminId, req) => {
    const { ADMIN_SECURITY } = require('../../constants');
    const clampedDelta = Math.max(-ADMIN_SECURITY.MAX_RISK_DELTA, Math.min(ADMIN_SECURITY.MAX_RISK_DELTA, delta));

    const user = await User.findByIdAndUpdate(
        userId,
        [
            {
                $set: {
                    riskScore: {
                        $max: [0, { $min: [RISK_THRESHOLDS.MAX, { $add: ['$riskScore', clampedDelta] }] }]
                    },
                    lastAdminActionAt: new Date()
                }
            }
        ],
        { new: true, select: 'riskScore username email' }
    );

    if (!user) throw new Error(`User ${userId} not found`);

    // Non-blocking audit log
    setImmediate(async () => {
        try {
            await AdminAuditLog.logAdminAction({
                adminId,
                action: ADMIN_ACTIONS.ADJUST_RISK_SCORE,
                targetType: 'User',
                targetId: userId,
                reason: `Manual risk adjustment: ${clampedDelta > 0 ? '+' : ''}${clampedDelta}`,
                metadata: { previousScore: user.riskScore - clampedDelta, newScore: user.riskScore, delta: clampedDelta },
                req
            });
        } catch (err) {
            logger.error('Failed to write audit log for risk adjustment', { err: err.message, userId, adminId });
        }
    });

    return { userId, newScore: user.riskScore, delta: clampedDelta };
};

/**
 * Decay all risk scores by RISK_THRESHOLDS.DECAY_PER_DAY (5).
 * Designed to be called by a cron job once every 24 hours.
 * Clamps at 0 (never goes negative).
 *
 * @returns {Number} modifiedCount
 */
const decayRiskScores = async () => {
    const result = await User.updateMany(
        { riskScore: { $gt: 0 } },
        [
            {
                $set: {
                    riskScore: {
                        $max: [0, { $subtract: ['$riskScore', RISK_THRESHOLDS.DECAY_PER_DAY] }]
                    }
                }
            }
        ]
    );
    logger.info('Risk score decay applied', { modifiedCount: result.modifiedCount });
    return result.modifiedCount;
};

module.exports = { applyRiskScore, adjustRiskScore, decayRiskScores };
