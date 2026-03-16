const catchAsync = require('../utils/catchAsync');
const commentService = require('../services/comment/comment.service');

/**
 * Comment Controller
 * Thin layer - no business logic
 */

/**
 * Create comment
 * POST /api/v1/comments
 */
const createComment = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { parentType, parentId, content, parentComment } = req.body;

    const comment = await commentService.createComment(userId, parentType, parentId, content, parentComment, req);

    res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: { comment }
    });
}, 'controller');

/**
 * Get comments
 * GET /api/v1/comments
 */
const getComments = catchAsync(async (req, res) => {
    const { parentType, parentId, maxDepth } = req.query;

    const comments = await commentService.getCommentTree(parentType, parentId, parseInt(maxDepth));

    res.status(200).json({
        success: true,
        message: 'Comments retrieved successfully',
        data: { comments }
    });
}, 'controller');

/**
 * Update comment
 * PATCH /api/v1/comments/:commentId
 */
const updateComment = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await commentService.updateComment(userId, commentId, content, req);

    res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: { comment }
    });
}, 'controller');

/**
 * Delete comment
 * DELETE /api/v1/comments/:commentId
 */
const deleteComment = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { commentId } = req.params;

    const result = await commentService.deleteComment(userId, commentId, req);

    res.status(200).json({
        success: true,
        message: result.message,
        data: null
    });
}, 'controller');

module.exports = {
    createComment,
    getComments,
    updateComment,
    deleteComment
};
