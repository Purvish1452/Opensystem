const catchAsync = require('../utils/catchAsync');
const reportService = require('../services/report/report.service');

/**
 * Report Controller
 * Thin layer - no business logic
 */

/**
 * Submit report
 * POST /api/v1/reports
 */
const submitReport = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { targetType, targetId, reason, severity, description } = req.body;

    const result = await reportService.submitReport(userId, targetType, targetId, reason, severity, description, req);

    res.status(201).json({
        success: true,
        message: result.message,
        data: result.report
    });
}, 'controller');

module.exports = {
    submitReport
};
