const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { validateBody } = require('../middlewares/validate.middleware');
const sanitizeMiddleware = require('../middlewares/sanitize.middleware');
const { reportLimiter } = require('../middlewares/rateLimit.middleware');
const { reportSpamCheck: antiSpamReport } = require('../middlewares/antiSpam.middleware');
const reportController = require('../controllers/report.controller');
const { submitReportSchema } = require('../validators/report.validator');

/**
 * Report Routes
 * All routes under /api/v1/reports
 */

// @route   POST /api/v1/reports
// @desc    Submit report
// @access  Private
router.post(
    '/',
    protect,
    reportLimiter,
    antiSpamReport,
    sanitizeMiddleware,
    validateBody(submitReportSchema),
    reportController.submitReport
);

module.exports = router;
