const catchAsync = require('../utils/catchAsync');
const searchService = require('../services/search/search.service');

/**
 * Search Controller
 * Thin layer - no business logic
 */

/**
 * Search users
 * GET /api/v1/search/users
 */
const searchUsers = catchAsync(async (req, res) => {
    const { query, userType, page, limit } = req.query;
    const userId = req.user?._id; // Optional auth

    const result = await searchService.searchUsers(
        query,
        { userType },
        { page: parseInt(page), limit: parseInt(limit) },
        userId,
        req
    );

    res.status(200).json({
        success: true,
        message: 'Search results retrieved successfully',
        data: result.users,
        meta: { pagination: result.pagination }
    });
}, 'controller');

/**
 * Search posts
 * GET /api/v1/search/posts
 */
const searchPosts = catchAsync(async (req, res) => {
    const { query, contentType, tags, page, limit } = req.query;
    const userId = req.user?._id; // Optional auth

    const result = await searchService.searchPosts(
        query,
        { contentType, tags: tags ? tags.split(',') : [] },
        { page: parseInt(page), limit: parseInt(limit) },
        userId,
        req
    );

    res.status(200).json({
        success: true,
        message: 'Search results retrieved successfully',
        data: result.posts,
        meta: { pagination: result.pagination }
    });
}, 'controller');

/**
 * Search projects
 * GET /api/v1/search/projects
 */
const searchProjects = catchAsync(async (req, res) => {
    const { query, projectStage, status, techStack, page, limit } = req.query;
    const userId = req.user?._id; // Optional auth

    const result = await searchService.searchProjects(
        query,
        { projectStage, status, techStack: techStack ? techStack.split(',') : [] },
        { page: parseInt(page), limit: parseInt(limit) },
        userId,
        req
    );

    res.status(200).json({
        success: true,
        message: 'Search results retrieved successfully',
        data: result.projects,
        meta: { pagination: result.pagination }
    });
}, 'controller');

module.exports = {
    searchUsers,
    searchPosts,
    searchProjects
};
