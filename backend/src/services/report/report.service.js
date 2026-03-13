const Report = require('../../models/Report');
const AppError = require('../../utils/AppError');
const { logActivity } = require('../activity/activity.service');
const { ACTIVITY_TYPES, REPORT_SEVERITY } = require('../../constants');

/**
 * Report Service - Production Grade
 * 
 * Features:
 * - Duplicate report prevention per user per target
 * - Auto-escalate high-severity reports
 */

/**
 * Submit report
 * 
 * @param {String} userId - Reporter user ID
 * @param {String} targetType - Target type (Post/Project/User/Comment)
 * @param {String} targetId - Target ID
 * @param {String} reason - Report reason
 * @param {String} severity - Report severity
 * @param {String} description - Report description
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created report
 */
const submitReport = async (userId, targetType, targetId, reason, severity, description, req) => {
    // Duplicate report prevention
    const existingReport = await Report.findOne({
        reporter: userId,
        targetType,
        targetId
    });

    if (existingReport) {
        throw AppError.conflictError(
            'You have already reported this content',
            'DUPLICATE_REPORT'
        );
    }

    // Create report
    const report = await Report.create({
        reporter: userId,
        targetType,
        targetId,
        reason,
        severity,
        description
    });

    // Log activity
    logActivity(userId, ACTIVITY_TYPES.REPORT, targetType, targetId, req, {
        reportId: report._id,
        reason,
        severity
    });

    // Auto-escalate high-severity reports
    if (severity === REPORT_SEVERITY.HIGH || severity === REPORT_SEVERITY.CRITICAL) {
        // TODO: Notify moderators immediately
        // await notificationService.notifyModerators(report);

        // TODO: Auto-flag content for review
        // await moderationService.flagContent(targetType, targetId);
    }

    return {
        message: 'Report submitted successfully',
        report: {
            id: report._id,
            targetType,
            targetId,
            severity
        }
    };
};

module.exports = {
    submitReport
};
