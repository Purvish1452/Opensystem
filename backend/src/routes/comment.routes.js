const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validate.middleware');
const sanitizeMiddleware = require('../middlewares/sanitize.middleware');
const { moderateContent } = require('../middlewares/contentModeration.middleware');
const { commentLimiter } = require('../middlewares/rateLimit.middleware');
const { commentSpamCheck: antiSpamComment } = require('../middlewares/antiSpam.middleware');
const { checkCommentOwnership: verifyCommentOwnership } = require('../middlewares/ownership.middleware');
const commentController = require('../controllers/comment.controller');
const {
    createCommentSchema,
    updateCommentSchema,
    getCommentsSchema
} = require('../validators/comment.validator');
const { objectIdSchema } = require('../validators/common.validator');

/**
 * Comment Routes
 * All routes under /api/v1/comments
 */

// @route   POST /api/v1/comments
// @desc    Create comment
// @access  Private
router.post(
    '/',
    protect,
    commentLimiter,
    antiSpamComment,
    sanitizeMiddleware,
    validateBody(createCommentSchema),
    moderateContent(['content']),    // Phase-5: content moderation gate
    commentController.createComment
);

// @route   GET /api/v1/comments
// @desc    Get comments
// @access  Public
router.get(
    '/',
    validateQuery(getCommentsSchema),
    commentController.getComments
);

// @route   PATCH /api/v1/comments/:commentId
// @desc    Update comment (owner only)
// @access  Private
router.patch(
    '/:commentId',
    protect,
    sanitizeMiddleware,
    validateParams(objectIdSchema('commentId')),
    validateBody(updateCommentSchema),
    verifyCommentOwnership,
    moderateContent(['content']),    // Phase-5: re-check on edit
    commentController.updateComment
);

// @route   DELETE /api/v1/comments/:commentId
// @desc    Delete comment (owner only)
// @access  Private
router.delete(
    '/:commentId',
    protect,
    validateParams(objectIdSchema('commentId')),
    verifyCommentOwnership,
    commentController.deleteComment
);

module.exports = router;
