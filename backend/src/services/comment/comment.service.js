const Comment = require('../../models/Comment');
const Post = require('../../models/Post');
const Project = require('../../models/Project');
const AppError = require('../../utils/AppError');
const { logActivity } = require('../activity/activity.service');
const { ACTIVITY_TYPES, CONTENT_LIMITS } = require('../../constants');

/**
 * Comment Service - Production Grade
 * 
 * Features:
 * - Auto collapse deep threads beyond depth 5
 * - Nested comment support
 */

/**
 * Create comment
 * 
 * @param {String} userId - User ID
 * @param {String} parentType - Parent type (Post/Project)
 * @param {String} parentId - Parent ID
 * @param {String} content - Comment content
 * @param {String} parentComment - Parent comment ID (for nested comments)
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created comment
 */
const createComment = async (userId, parentType, parentId, content, parentComment = null, req) => {
    // Verify parent exists
    const ParentModel = parentType === 'Post' ? Post : Project;
    const parent = await ParentModel.findById(parentId);

    if (!parent) {
        throw AppError.notFoundError(parentType, `${parentType.toUpperCase()}_NOT_FOUND`);
    }

    // If nested comment, verify parent comment exists
    let depth = 0;
    let path = [];

    if (parentComment) {
        const parentCommentDoc = await Comment.findById(parentComment);
        if (!parentCommentDoc) {
            throw AppError.notFoundError('Parent comment', 'PARENT_COMMENT_NOT_FOUND');
        }

        depth = parentCommentDoc.depth + 1;
        path = [...parentCommentDoc.path, parentCommentDoc._id];

        // Auto collapse beyond depth 5
        if (depth > CONTENT_LIMITS.MAX_COMMENT_DEPTH) {
            throw AppError.validationError(
                [{ field: 'depth', message: `Maximum comment depth is ${CONTENT_LIMITS.MAX_COMMENT_DEPTH}` }],
                'Max depth exceeded'
            );
        }
    }

    // Create comment
    const comment = await Comment.create({
        author: userId,
        content,
        parentType,
        parentId,
        parentComment,
        depth,
        path
    });

    // Log activity
    logActivity(userId, ACTIVITY_TYPES.COMMENT, parentType, parentId, req, {
        commentId: comment._id,
        depth,
        isNested: !!parentComment
    });

    return comment;
};

/**
 * Update comment (owner only)
 * 
 * @param {String} userId - User ID
 * @param {String} commentId - Comment ID
 * @param {String} content - New content
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Updated comment
 */
const updateComment = async (userId, commentId, content, req) => {
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw AppError.notFoundError('Comment', 'COMMENT_NOT_FOUND');
    }

    // Verify ownership
    if (comment.author.toString() !== userId.toString()) {
        throw AppError.forbiddenError('You can only edit your own comments', 'NOT_COMMENT_OWNER');
    }

    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = Date.now();
    await comment.save();

    // Log activity
    logActivity(userId, ACTIVITY_TYPES.COMMENT_UPDATE, 'Comment', commentId, req);

    return comment;
};

/**
 * Delete comment (soft delete, owner only)
 * 
 * @param {String} userId - User ID
 * @param {String} commentId - Comment ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Success message
 */
const deleteComment = async (userId, commentId, req) => {
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw AppError.notFoundError('Comment', 'COMMENT_NOT_FOUND');
    }

    // Verify ownership
    if (comment.author.toString() !== userId.toString()) {
        throw AppError.forbiddenError('You can only delete your own comments', 'NOT_COMMENT_OWNER');
    }

    await comment.softDelete();

    // Log activity
    logActivity(userId, ACTIVITY_TYPES.COMMENT_DELETE, 'Comment', commentId, req);

    return {
        message: 'Comment deleted successfully'
    };
};

/**
 * Get comment tree
 * 
 * @param {String} parentType - Parent type (Post/Project)
 * @param {String} parentId - Parent ID
 * @param {Number} maxDepth - Maximum depth to fetch
 * @returns {Promise<Array>} Comment tree
 */
const getCommentTree = async (parentType, parentId, maxDepth = CONTENT_LIMITS.MAX_COMMENT_DEPTH) => {
    const comments = await Comment.getCommentTree(parentType, parentId, maxDepth);
    return comments;
};

module.exports = {
    createComment,
    updateComment,
    deleteComment,
    getCommentTree
};
