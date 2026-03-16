/**
 * Content Moderation Middleware
 * Phase-5: Pluggable content verification gate
 *
 * ─── USAGE ───────────────────────────────────────────────────────────────────
 * const { moderateContent } = require('../middlewares/contentModeration.middleware');
 *
 * // Check specific body fields:
 * router.post('/', protect, moderateContent(['content']), controller.create);
 * router.post('/', protect, moderateContent(['title', 'description']), controller.create);
 *
 * // In your controller, apply the result before saving:
 * const { applyModerationResult } = require('../middlewares/contentModeration.middleware');
 * applyModerationResult(req, document);  // patches moderationStatus, score, flags fields
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { analyzeFields } = require('../services/moderation/contentModeration.service');
const { CONTENT_MODERATION, STATUS_CODES, ACTIVITY_TYPES } = require('../constants');
const AppError = require('../utils/AppError');

/**
 * Factory middleware — returns Express middleware configured
 * to inspect the specified body fields.
 *
 * @param {string[]} fields - Array of req.body field names to check
 * @param {object} [options] - Optional config overrides
 * @param {boolean} [options.skipSpamCheck=false]
 * @param {boolean} [options.skipUrlCheck=false]
 * @param {boolean} [options.allowFlagged=true] - If false, flagged content is also blocked
 * @returns {function} Express middleware
 */
const moderateContent = (fields = ['content'], options = {}) => {
    const {
        skipSpamCheck = false,
        skipUrlCheck = false,
        allowFlagged = true,
    } = options;

    return async (req, res, next) => {
        try {
            // Build the map of field values to analyze
            const fieldsMap = {};
            for (const field of fields) {
                const value = req.body[field];
                if (value && typeof value === 'string') {
                    fieldsMap[field] = value;
                }
            }

            // If no textual fields found, skip moderation
            if (Object.keys(fieldsMap).length === 0) {
                req.moderationResult = _cleanResult();
                return next();
            }

            // Run the analysis
            const result = analyzeFields(fieldsMap, { skipSpamCheck, skipUrlCheck });

            // ─── HARD BLOCK ─────────────────────────────────────────────────
            if (result.severity === CONTENT_MODERATION.SEVERITY.BLOCKED) {
                // Async log to SuspiciousActivity (don't await — non-blocking)
                _logViolation(req, result, 'blocked').catch(err =>
                    console.error('[Moderation] Failed to log blocked violation:', err)
                );

                return next(new AppError(
                    CONTENT_MODERATION.MESSAGES.BLOCKED,
                    STATUS_CODES.UNPROCESSABLE_ENTITY,
                    {
                        moderationFlags: result.flags,
                        reasons: result.reasons,
                        moderationScore: result.score,
                    }
                ));
            }

            // ─── OPTION: treat flagged as blocked too ────────────────────────
            if (!allowFlagged && result.severity === CONTENT_MODERATION.SEVERITY.FLAGGED) {
                _logViolation(req, result, 'flagged_blocked').catch(err =>
                    console.error('[Moderation] Failed to log flagged-block violation:', err)
                );

                return next(new AppError(
                    CONTENT_MODERATION.MESSAGES.FLAGGED,
                    STATUS_CODES.UNPROCESSABLE_ENTITY,
                    {
                        moderationFlags: result.flags,
                        reasons: result.reasons,
                        moderationScore: result.score,
                    }
                ));
            }

            // ─── SOFT FLAG — attach result for controller to persist ─────────
            if (result.severity === CONTENT_MODERATION.SEVERITY.FLAGGED) {
                _logViolation(req, result, 'flagged').catch(err =>
                    console.error('[Moderation] Failed to log flagged violation:', err)
                );
            }

            // Attach to request — controllers call applyModerationResult(req, doc)
            req.moderationResult = result;
            req.moderationResult.checkedAt = new Date();

            next();
        } catch (err) {
            // Moderation errors must NEVER block a request — fail open (log + continue)
            console.error('[Moderation] Service error — failing open:', err.message);
            req.moderationResult = _cleanResult();
            next();
        }
    };
};

/**
 * Apply moderation result to a Mongoose document before saving.
 * Call this in your controller after creating/updating a document:
 *
 *   const doc = new Post({ ... });
 *   applyModerationResult(req, doc);
 *   await doc.save();
 *
 * @param {import('express').Request} req
 * @param {object} doc - Mongoose document
 */
const applyModerationResult = (req, doc) => {
    if (!req.moderationResult) return;

    const { severity, score, flags, checkedAt } = req.moderationResult;
    const { MODERATION_STATUS } = require('../constants');

    const statusMap = {
        [CONTENT_MODERATION.SEVERITY.CLEAN]: MODERATION_STATUS.APPROVED,
        [CONTENT_MODERATION.SEVERITY.FLAGGED]: MODERATION_STATUS.FLAGGED,
        // BLOCKED never reaches here (middleware already rejected)
    };

    if (doc.moderationStatus !== undefined) {
        doc.moderationStatus = statusMap[severity] || MODERATION_STATUS.APPROVED;
    }
    if (doc.isModerated !== undefined) {
        doc.isModerated = severity !== CONTENT_MODERATION.SEVERITY.CLEAN;
    }
    if (doc.moderationScore !== undefined) {
        doc.moderationScore = score;
    }
    if (doc.moderationFlags !== undefined) {
        doc.moderationFlags = flags;
    }
    if (doc.moderationCheckedAt !== undefined) {
        doc.moderationCheckedAt = checkedAt || new Date();
    }
};

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * @returns {object} Default clean moderation result
 */
function _cleanResult() {
    return {
        passed: true,
        score: 0,
        severity: CONTENT_MODERATION.SEVERITY.CLEAN,
        flags: [],
        reasons: [],
        checkedAt: new Date(),
    };
}

/**
 * Async-log a violation to SuspiciousActivity model
 * @param {import('express').Request} req
 * @param {object} result
 * @param {string} action
 */
async function _logViolation(req, result, action) {
    try {
        const SuspiciousActivity = require('../models/SuspiciousActivity');
        const userId = req.user?._id;

        if (!userId) return;

        // Map moderation severity → SuspiciousActivity schema severity enum
        const severityMap = {
            [CONTENT_MODERATION.SEVERITY.BLOCKED]: 'high',
            [CONTENT_MODERATION.SEVERITY.FLAGGED]: 'medium',
            [CONTENT_MODERATION.SEVERITY.CLEAN]: 'low',
        };
        const severity = severityMap[result.severity] || 'medium';

        // riskScoreImpact: blocked = up to 40, flagged = up to 20
        const riskScoreImpact = result.severity === CONTENT_MODERATION.SEVERITY.BLOCKED
            ? Math.min(Math.round(result.score * 0.4), 40)
            : Math.min(Math.round(result.score * 0.2), 20);

        await SuspiciousActivity.create({
            userId,
            type: 'CONTENT_VIOLATION',   // registered in SUSPICIOUS_TYPES
            severity,
            riskScoreImpact,
            metadata: {
                action,                  // 'blocked' | 'flagged' | 'flagged_blocked'
                url: req.originalUrl,
                method: req.method,
                moderationScore: result.score,
                moderationSeverity: result.severity,
                flags: result.flags,
                reasons: result.reasons,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            },
        });
    } catch (err) {
        // Silent fail — never block the request for logging errors
        console.error('[Moderation] Violation log error:', err.message);
    }
}

module.exports = {
    moderateContent,
    applyModerationResult,
};
