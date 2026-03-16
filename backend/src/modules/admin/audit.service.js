const AdminAuditLog = require('../../models/AdminAuditLog');
const { ADMIN_SECURITY } = require('../../constants');
const logger = require('../../utils/logger');

/**
 * Audit Service — Phase-4
 *
 * Thin, non-blocking wrapper around AdminAuditLog.logAdminAction.
 * All admin mutation controllers should call logAudit — fire-and-forget.
 * Validates metadata size before write.
 * Fallback: synchronous console.error if setImmediate callback fails
 * (never silently lose audit entries).
 */

/**
 * Validate metadata size (max 5KB)
 * Returns sanitized metadata or throws
 */
const validateMetadata = (metadata) => {
    const size = Buffer.byteLength(JSON.stringify(metadata || {}), 'utf8');
    if (size > ADMIN_SECURITY.AUDIT_METADATA_MAX_BYTES) {
        // Truncate rather than throw — audit log must still write
        return { _truncated: true, note: `Original metadata exceeded ${ADMIN_SECURITY.AUDIT_METADATA_MAX_BYTES} bytes` };
    }
    return metadata || {};
};

/**
 * Log an admin action asynchronously.
 * Returns the auditId for inclusion in HTTP responses.
 *
 * @param {Object} params
 * @param {String} params.adminId
 * @param {String} params.action  — ADMIN_ACTIONS value
 * @param {String} params.targetType
 * @param {Object|String} params.targetId
 * @param {String} [params.reason]
 * @param {Object} [params.metadata]
 * @param {Object} [params.req]   — Express request
 * @returns {Promise<String>} auditId
 */
const logAudit = async ({ adminId, action, targetType, targetId, reason = '', metadata = {}, req = {} }) => {
    const safeMetadata = validateMetadata(metadata);

    // Fire-and-forget with synchronous fallback
    return new Promise((resolve) => {
        setImmediate(async () => {
            try {
                const log = await AdminAuditLog.logAdminAction({
                    adminId,
                    action,
                    targetType,
                    targetId,
                    reason,
                    metadata: safeMetadata,
                    req
                });
                resolve(log._id?.toString() || null);
            } catch (err) {
                // Synchronous fallback — never silently lose audit entries
                console.error('[AUDIT LOG FAILURE]', {
                    adminId, action, targetType, targetId, err: err.message
                });
                logger.error('Admin audit log write failed', { adminId, action, err: err.message });
                resolve(null);
            }
        });
    });
};

module.exports = { logAudit };
