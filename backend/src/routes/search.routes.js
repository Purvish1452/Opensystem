const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middlewares/authMiddleware');
const { validateQuery } = require('../middlewares/validate.middleware');
const { generalLimiter } = require('../middlewares/rateLimit.middleware');
const searchController = require('../controllers/search.controller');
const { searchUsersSchema, searchPostsSchema, searchProjectsSchema } = require('../validators/search.validator');

/**
 * Search Routes
 * All routes under /api/v1/search
 */

// @route   GET /api/v1/search/users
// @desc    Search users
// @access  Public (optional auth for analytics)
router.get(
    '/users',
    optionalAuth,
    generalLimiter,
    validateQuery(searchUsersSchema),
    searchController.searchUsers
);

// @route   GET /api/v1/search/posts
// @desc    Search posts
// @access  Public (optional auth for analytics)
router.get(
    '/posts',
    optionalAuth,
    generalLimiter,
    validateQuery(searchPostsSchema),
    searchController.searchPosts
);

// @route   GET /api/v1/search/projects
// @desc    Search projects
// @access  Public (optional auth for analytics)
router.get(
    '/projects',
    optionalAuth,
    generalLimiter,
    validateQuery(searchProjectsSchema),
    searchController.searchProjects
);

module.exports = router;
