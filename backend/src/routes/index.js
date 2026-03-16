const express = require('express');
const router = express.Router();

/**
 * API v1 Routes Index
 * Mounts all versioned routes under /api/v1
 * Admin routes are mounted LAST to avoid middleware precedence issues
 */

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const postRoutes = require('./post.routes');
const projectRoutes = require('./project.routes');
const commentRoutes = require('./comment.routes');
const reportRoutes = require('./report.routes');
const searchRoutes = require('./search.routes');
// Admin — loaded AFTER all user-facing routes
const adminRoutes = require('../modules/admin/admin.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/projects', projectRoutes);
router.use('/comments', commentRoutes);
router.use('/reports', reportRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);   // Phase-4: Admin Role System

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API v1 is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
