const catchAsync = require('../utils/catchAsync');
const postService = require('../services/post/post.service');
const voteService = require('../services/post/vote.service');
const feedService = require('../services/post/feed.service');
const commentService = require('../services/comment/comment.service');
const reportService = require('../services/report/report.service');

/**
 * Post Controller
 * Thin layer - no business logic
 */

/**
 * Create post
 * POST /api/v1/posts
 */
const createPost = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const postData = req.body;

    const post = await postService.createPost(userId, postData, req);

    res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: { post }
    });
}, 'controller');

/**
 * Get feed
 * GET /api/v1/posts/feed
 */
const getFeed = catchAsync(async (req, res) => {
    const userId = req.user?._id; // Optional auth
    const { page, limit, contentType, tags } = req.query;

    const result = await feedService.getFeed(
        userId,
        { contentType, tags: tags ? tags.split(',') : [] },
        { page: parseInt(page), limit: parseInt(limit) }
    );

    res.status(200).json({
        success: true,
        message: 'Feed retrieved successfully',
        data: result.posts,
        meta: { pagination: result.pagination }
    });
}, 'controller');

/**
 * Get trending posts
 * GET /api/v1/posts/trending
 */
const getTrending = catchAsync(async (req, res) => {
    const { timeWindow, page, limit } = req.query;

    const result = await feedService.getTrendingPosts(
        timeWindow,
        { page: parseInt(page), limit: parseInt(limit) }
    );

    res.status(200).json({
        success: true,
        message: 'Trending posts retrieved successfully',
        data: result.posts,
        meta: { pagination: result.pagination }
    });
}, 'controller');

/**
 * Search posts
 * GET /api/v1/posts/search
 */
const searchPosts = catchAsync(async (req, res) => {
    const { query, contentType, tags, page, limit } = req.query;

    const result = await feedService.searchPosts(
        query,
        { contentType, tags: tags ? tags.split(',') : [] },
        { page: parseInt(page), limit: parseInt(limit) }
    );

    res.status(200).json({
        success: true,
        message: 'Search results retrieved successfully',
        data: result.posts,
        meta: { pagination: result.pagination }
    });
}, 'controller');

/**
 * Get post by ID
 * GET /api/v1/posts/:postId
 */
const getPostById = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?._id; // Optional auth

    const post = await postService.getPostById(postId, userId);

    res.status(200).json({
        success: true,
        message: 'Post retrieved successfully',
        data: { post }
    });
}, 'controller');

/**
 * Hide post (owner only — hides for everyone)
 * PATCH /api/v1/posts/:postId/hide
 */
const hidePost = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { postId } = req.params;

    const result = await postService.hidePost(userId, postId, req);

    res.status(200).json({
        success: true,
        message: result.message,
        data: null
    });
}, 'controller');

/**
 * Hide post from personal feed (any user)
 * POST /api/v1/posts/:postId/hide-from-feed
 */
const hideFromFeed = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { postId } = req.params;

    const result = await postService.hideFromFeed(userId, postId);

    res.status(200).json({
        success: true,
        message: result.message,
        data: null
    });
}, 'controller');

/**
 * Unhide post from personal feed
 * DELETE /api/v1/posts/:postId/hide-from-feed
 */
const unhideFromFeed = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { postId } = req.params;

    const result = await postService.unhideFromFeed(userId, postId);

    res.status(200).json({
        success: true,
        message: result.message,
        data: null
    });
}, 'controller');

/**
 * Vote on post
 * PATCH /api/v1/posts/:postId/vote
 */
const voteOnPost = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { postId } = req.params;
    const { voteType } = req.body;

    const post = await voteService.voteOnPost(userId, postId, voteType, req);

    res.status(200).json({
        success: true,
        message: 'Vote recorded successfully',
        data: { post }
    });
}, 'controller');

/**
 * Comment on post
 * POST /api/v1/posts/:postId/comment
 */
const commentOnPost = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { postId } = req.params;
    const { content } = req.body;

    const comment = await commentService.createComment(userId, 'Post', postId, content, null, req);

    res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: { comment }
    });
}, 'controller');

/**
 * Report post
 * POST /api/v1/posts/:postId/report
 */
const reportPost = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { postId } = req.params;
    const { reason, severity, description } = req.body;

    const result = await reportService.submitReport(userId, 'Post', postId, reason, severity, description, req);

    res.status(201).json({
        success: true,
        message: result.message,
        data: result.report
    });
}, 'controller');

module.exports = {
    createPost,
    getFeed,
    getTrending,
    searchPosts,
    getPostById,
    hidePost,
    hideFromFeed,
    unhideFromFeed,
    voteOnPost,
    commentOnPost,
    reportPost
};
