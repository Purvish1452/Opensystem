const asyncHandler = require('./asyncHandler');
const AppError = require('../utils/AppError');
const { STATUS_CODES } = require('../constants');
const ActivityLog = require('../models/ActivityLog');
const { ANTI_SPAM } = require('../constants');

/**
 * Anti-Spam Middleware
 * ActivityLog-based spam detection and prevention
 */

/**
 * Check for spam patterns based on activity logs
 * @param {String} actionType - Type of action being performed
 * @param {Number} maxActions - Maximum allowed actions in time window
 * @param {Number} timeWindow - Time window in milliseconds
 */
const antiSpamMiddleware = (actionType, maxActions, timeWindow) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            return next();
        }

        const userId = req.user._id;
        const cutoffTime = new Date(Date.now() - timeWindow);

        // Count recent actions of this type
        const recentActions = await ActivityLog.countDocuments({
            userId,
            actionType,
            createdAt: { $gte: cutoffTime }
        });

        if (recentActions >= maxActions) {
            return next(new AppError(
                `Too many ${actionType} actions. Please slow down.`,
                STATUS_CODES.TOO_MANY_REQUESTS
            ));
        }

        next();
    });
};

/**
 * Post creation spam check
 */
const postSpamCheck = antiSpamMiddleware(
    'post_create',
    ANTI_SPAM.MAX_POSTS_PER_HOUR,
    60 * 60 * 1000 // 1 hour
);

/**
 * Comment spam check
 */
const commentSpamCheck = antiSpamMiddleware(
    'comment',
    ANTI_SPAM.MAX_COMMENTS_PER_HOUR,
    60 * 60 * 1000 // 1 hour
);

/**
 * Vote spam check
 */
const voteSpamCheck = antiSpamMiddleware(
    'vote',
    ANTI_SPAM.MAX_VOTES_PER_HOUR,
    60 * 60 * 1000 // 1 hour
);

/**
 * Report spam check
 */
const reportSpamCheck = antiSpamMiddleware(
    'report',
    ANTI_SPAM.MAX_REPORTS_PER_HOUR,
    60 * 60 * 1000 // 1 hour
);

/**
 * Project creation spam check
 */
const projectSpamCheck = antiSpamMiddleware(
    'project_create',
    ANTI_SPAM.MAX_PROJECTS_PER_DAY,
    24 * 60 * 60 * 1000 // 24 hours
);

/**
 * Enrollment spam check
 */
const enrollmentSpamCheck = antiSpamMiddleware(
    'enroll',
    ANTI_SPAM.MAX_ENROLLMENTS_PER_DAY,
    24 * 60 * 60 * 1000 // 24 hours
);

module.exports = {
    antiSpamMiddleware,
    postSpamCheck,
    commentSpamCheck,
    voteSpamCheck,
    reportSpamCheck,
    projectSpamCheck,
    enrollmentSpamCheck
};
