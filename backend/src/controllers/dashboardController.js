const asyncHandler = require('../middlewares/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const { STATUS_CODES } = require('../constants');

/**
 * Dashboard Controller
 * Sample protected route demonstrating authentication
 */

/**
 * @desc    Get dashboard data
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboard = asyncHandler(async (req, res) => {
    // req.user is available because of protect middleware
    const dashboardData = {
        message: `Welcome ${req.user.name}!`,
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        },
        stats: {
            totalUsers: 150,
            activeProjects: 12,
            pendingTasks: 8
        },
        recentActivity: [
            { action: 'Login', timestamp: new Date() },
            { action: 'Profile Updated', timestamp: new Date(Date.now() - 86400000) }
        ]
    };

    successResponse(
        res,
        STATUS_CODES.OK,
        'Dashboard data retrieved successfully',
        dashboardData
    );
});

/**
 * @desc    Get admin dashboard (role-based example)
 * @route   GET /api/dashboard/admin
 * @access  Private/Admin
 */
const getAdminDashboard = asyncHandler(async (req, res) => {
    const adminData = {
        message: 'Admin Dashboard',
        systemStats: {
            totalUsers: 1500,
            totalRevenue: 50000,
            activeSubscriptions: 450
        }
    };

    successResponse(
        res,
        STATUS_CODES.OK,
        'Admin dashboard data retrieved successfully',
        adminData
    );
});

module.exports = {
    getDashboard,
    getAdminDashboard
};
