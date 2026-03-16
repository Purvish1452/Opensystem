const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middlewares/authMiddleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validate.middleware');
const sanitizeMiddleware = require('../middlewares/sanitize.middleware');
const { moderateContent } = require('../middlewares/contentModeration.middleware');
const {
    postCreateLimiter: postLimiter,
    commentLimiter,
    voteLimiter,
    reportLimiter
} = require('../middlewares/rateLimit.middleware');
const {
    postSpamCheck: antiSpamPost,
    commentSpamCheck: antiSpamComment,
    voteSpamCheck: antiSpamVote,
    reportSpamCheck: antiSpamReport
} = require('../middlewares/antiSpam.middleware');
const { checkPostOwnership: verifyPostOwnership } = require('../middlewares/ownership.middleware');
const postController = require('../controllers/post.controller');
const {
    createPostSchema,
    voteSchema: voteOnPostSchema,
    commentOnPostSchema,
    reportPostSchema
} = require('../validators/post.validator');
const { objectIdSchema } = require('../validators/common.validator');

/**
 * Post Routes
 * All routes under /api/v1/posts
 */

// @route   POST /api/v1/posts
// @desc    Create new post
// @access  Private
router.post(
    '/',
    protect,
    postLimiter,
    antiSpamPost,
    sanitizeMiddleware,
    validateBody(createPostSchema),
    moderateContent(['content']),    // Phase-5: content moderation gate
    postController.createPost
);

// @route   GET /api/v1/posts/feed
// @desc    Get personalized feed
// @access  Public (optional auth)
router.get('/feed', optionalAuth, postController.getFeed);

// @route   GET /api/v1/posts/trending
// @desc    Get trending posts
// @access  Public
router.get('/trending', postController.getTrending);

// @route   GET /api/v1/posts/search
// @desc    Search posts
// @access  Public
router.get('/search', postController.searchPosts);

// @route   GET /api/v1/posts/:postId
// @desc    Get post by ID
// @access  Public (optional auth)
router.get(
    '/:postId',
    optionalAuth,
    validateParams(objectIdSchema('postId')),
    postController.getPostById
);

// @route   PATCH /api/v1/posts/:postId/hide
// @desc    Hide post globally (owner only)
// @access  Private (post owner)
router.patch(
    '/:postId/hide',
    protect,
    validateParams(objectIdSchema('postId')),
    verifyPostOwnership,
    postController.hidePost
);

// @route   POST /api/v1/posts/:postId/hide-from-feed
// @desc    Hide post from personal feed (any user)
// @access  Private
router.post(
    '/:postId/hide-from-feed',
    protect,
    validateParams(objectIdSchema('postId')),
    postController.hideFromFeed
);

// @route   DELETE /api/v1/posts/:postId/hide-from-feed
// @desc    Unhide post from personal feed
// @access  Private
router.delete(
    '/:postId/hide-from-feed',
    protect,
    validateParams(objectIdSchema('postId')),
    postController.unhideFromFeed
);

// @route   PATCH /api/v1/posts/:postId/vote
// @desc    Vote on post
// @access  Private
router.patch(
    '/:postId/vote',
    protect,
    voteLimiter,
    antiSpamVote,
    sanitizeMiddleware,
    validateParams(objectIdSchema('postId')),
    validateBody(voteOnPostSchema),
    postController.voteOnPost
);

// @route   POST /api/v1/posts/:postId/comment
// @desc    Comment on post
// @access  Private
router.post(
    '/:postId/comment',
    protect,
    commentLimiter,
    antiSpamComment,
    sanitizeMiddleware,
    validateParams(objectIdSchema('postId')),
    validateBody(commentOnPostSchema),
    moderateContent(['content']),    // Phase-5: content moderation gate
    postController.commentOnPost
);

// @route   POST /api/v1/posts/:postId/report
// @desc    Report post
// @access  Private
router.post(
    '/:postId/report',
    protect,
    reportLimiter,
    antiSpamReport,
    sanitizeMiddleware,
    validateParams(objectIdSchema('postId')),
    validateBody(reportPostSchema),
    postController.reportPost
);

module.exports = router;
