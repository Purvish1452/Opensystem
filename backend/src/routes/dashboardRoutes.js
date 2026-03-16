const express = require('express');
const router = express.Router();
const { getDashboard, getAdminDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants');

/**
 * Dashboard Routes
 * Sample protected routes demonstrating authentication and authorization
 */

// @route   GET /api/dashboard
// @desc    Get user dashboard
// @access  Private (requires authentication)
router.get('/', protect, getDashboard);

// @route   GET /api/dashboard/admin
// @desc    Get admin dashboard
// @access  Private/Admin (requires authentication + admin role)
router.get('/admin', protect, authorize(ROLES.ADMIN), getAdminDashboard);

module.exports = router;
