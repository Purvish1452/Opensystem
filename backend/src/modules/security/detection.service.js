const SuspiciousActivity = require('../../models/SuspiciousActivity');
const AdminAuditLog = require('../../models/AdminAuditLog');
const { applyRiskScore } = require('../security/risk.service');
const { SUSPICIOUS_TYPES, ADMIN_ACTIONS, REPORT_SEVERITY } = require('../../constants');
const logger = require('../../utils/logger');

/**
 * Detection Service — Phase-4
 *
 * Creates and resolves SuspiciousActivity flags.
 * Deduplication: same type within 1h is skipped (noise control).
 * Severity is auto-calculated from trigger frequency in the last 24h.
 */

/**
 * Calculate severity based on trigger frequency (last 24h)
 * @param {String} userId
 * @param {String} type
 * @returns {Promise<'low'|'medium'|'high'>}
 */
const calculateSeverity = async (userId, type) => {
    const since = new Date(Date.now() - 86400000); // 24h
    const count = await SuspiciousActivity.countDocuments({ userId, type, createdAt: { $gte: since } });
    if (count >= 5) return 'high';
    if (count >= 2) return 'medium';
    return 'low';
};

/**
 * Flag a suspicious activity for a user.
 * - Deduplicates within 1h (same type → skip)
 * - Auto-calculates severity from frequency
 * - Applies risk score
 *
 * @param {String} userId
 * @param {String} type — SUSPICIOUS_TYPES value
 * @param {Object} [metadata]
 * @returns {Object|null} flag or null if duplicate
 */
const flagSuspicious = async (userId, type, metadata = {}) => {
    if (!Object.values(SUSPICIOUS_TYPES).includes(type)) {
        logger.warn('Unknown suspicious type, skipping flag', { userId, type });
        return null;
    }

    // Deduplication: skip if same type flagged for this user in last 1h
    const isDuplicate = await SuspiciousActivity.isDuplicate(userId, type, 3600000);
    if (isDuplicate) {
        logger.debug('Suspicious flag deduplicated (same type within 1h)', { userId, type });
        return null;
    }

    const severity = await calculateSeverity(userId, type);
    const { delta } = await applyRiskScore(userId, type);

    const flag = await SuspiciousActivity.create({
        userId,
        type,
        severity,
        riskScoreImpact: delta,
        metadata
    });

    logger.info('Suspicious activity flagged', { userId, type, severity, riskImpact: delta });
    return flag;
};

/**
 * Resolve a suspicious activity flag (admin only).
 * Writes audit log entry.
 *
 * @param {String} flagId
 * @param {String} adminId
 * @param {String} [note]
 * @param {Object} req
 * @returns {Object} resolved flag
 */
const resolveSuspicious = async (flagId, adminId, note = '', req = {}) => {
    const flag = await SuspiciousActivity.findById(flagId);
    if (!flag) throw new Error('Suspicious activity flag not found');
    if (flag.resolved) throw new Error('Flag is already resolved');

    flag.resolved = true;
    flag.resolvedBy = adminId;
    flag.resolvedAt = new Date();
    flag.resolutionNote = note || null;
    await flag.save();

    // Non-blocking audit log
    setImmediate(async () => {
        try {
            await AdminAuditLog.logAdminAction({
                adminId,
                action: ADMIN_ACTIONS.RESOLVE_SUSPICIOUS,
                targetType: 'SuspiciousActivity',
                targetId: flag._id,
                reason: note || 'Resolved by admin',
                metadata: { userId: flag.userId, type: flag.type, severity: flag.severity },
                req
            });
        } catch (err) {
            logger.error('Audit log failed for resolveSuspicious', { err: err.message });
        }
    });

    return flag;
};

/**
 * Get all unresolved suspicious activity (admin queue).
 * Groups by userId + aggregates counts.
 *
 * @param {Number} page
 * @param {Number} limit
 * @param {Object} filters — e.g. { type: 'BRUTE_FORCE' }
 */
const getSuspiciousUsers = async (page = 1, limit = 20, filters = {}) => {
    return await SuspiciousActivity.getAdminQueue(page, limit, filters);
};

module.exports = { flagSuspicious, resolveSuspicious, getSuspiciousUsers };
