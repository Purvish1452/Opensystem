const asyncHandler = require('./asyncHandler');
const AppError = require('../utils/AppError');
const { STATUS_CODES, MESSAGES } = require('../constants');
const Post = require('../models/Post');
const Project = require('../models/Project');
const Comment = require('../models/Comment');

/**
 * Ownership Middleware
 * Verifies user owns the resource before allowing modification
 */

/**
 * Check if user owns a post
 */
const checkPostOwnership = asyncHandler(async (req, res, next) => {
    const postId = req.params.postId || req.body.postId;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
        return next(new AppError('Post not found', STATUS_CODES.NOT_FOUND));
    }

    if (post.author.toString() !== userId.toString()) {
        return next(new AppError(MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN));
    }

    req.post = post; // Attach post to request for reuse
    next();
});

/**
 * Check if user owns a project
 */
const checkProjectOwnership = asyncHandler(async (req, res, next) => {
    const projectId = req.params.projectId || req.body.projectId;
    const userId = req.user._id;

    const project = await Project.findById(projectId);

    if (!project) {
        return next(new AppError('Project not found', STATUS_CODES.NOT_FOUND));
    }

    if (project.owner.toString() !== userId.toString()) {
        return next(new AppError(MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN));
    }

    req.project = project; // Attach project to request for reuse
    next();
});

/**
 * Check if user owns a comment
 */
const checkCommentOwnership = asyncHandler(async (req, res, next) => {
    const commentId = req.params.commentId || req.body.commentId;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);

    if (!comment) {
        return next(new AppError('Comment not found', STATUS_CODES.NOT_FOUND));
    }

    if (comment.author.toString() !== userId.toString()) {
        return next(new AppError(MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN));
    }

    req.comment = comment; // Attach comment to request for reuse
    next();
});

module.exports = {
    checkPostOwnership,
    checkProjectOwnership,
    checkCommentOwnership
};
