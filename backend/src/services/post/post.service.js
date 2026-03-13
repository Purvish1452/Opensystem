const Post = require('../../models/Post');
const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const { logActivity, detectRepeatedContent } = require('../activity/activity.service');
const { ACTIVITY_TYPES, MODERATION_STATUS } = require('../../constants');
const mediaService = require('./media.service');
const crypto = require('crypto');

/**
 * Post Service - Production Grade
 * 
 * Features:
 * - Duplicate content spam detection using content hashing
 * - Auto-flag hook for suspicious content patterns
 * - Comprehensive media validation
 */

/**
 * Create post
 * 
 * @param {String} userId - User ID
 * @param {Object} postData - Post data
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created post
 */
const createPost = async (userId, postData, req) => {
    const { content, contentType, tags, visibility, media, codeSnippets } = postData;

    // Validate media if present
    if (media && media.length > 0) {
        await mediaService.validateMedia(media);
    }

    // Detect duplicate content spam
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    const spamCheck = await detectRepeatedContent(userId, contentHash);

    if (spamCheck.isSpam) {
        throw AppError.rateLimitError(
            'Duplicate content detected. Please post original content.',
            'SPAM_DETECTED'
        );
    }

    // Auto-flag suspicious content patterns
    const moderationStatus = detectSuspiciousPatterns(content);

    // Create post
    const post = await Post.create({
        author: userId,
        content,
        contentType,
        tags: tags || [],
        visibility: visibility || 'public',
        media: media || [],
        codeSnippets: codeSnippets || [],
        moderation: {
            status: moderationStatus,
            flaggedAt: moderationStatus === MODERATION_STATUS.FLAGGED ? Date.now() : null
        }
    });

    // Log activity with content hash
    logActivity(userId, ACTIVITY_TYPES.POST_CREATE, 'Post', post._id, req, {
        contentHash,
        contentType,
        tagsCount: tags?.length || 0,
        mediaCount: media?.length || 0
    });

    return post;
};

/**
 * Get post by ID
 * 
 * @param {String} postId - Post ID
 * @param {String} userId - User ID (optional, for view tracking)
 * @returns {Promise<Object>} Post
 */
const getPostById = async (postId, userId = null) => {
    const post = await Post.findById(postId)
        .populate('author', 'username fullname profileImage');

    if (!post) {
        throw AppError.notFoundError('Post', 'POST_NOT_FOUND');
    }

    // Check if post is hidden and user is not the author
    if (post.isHidden && (!userId || post.author._id.toString() !== userId.toString())) {
        throw AppError.notFoundError('Post', 'POST_NOT_FOUND');
    }

    // Increment view count (async, non-blocking)
    if (userId && post.author._id.toString() !== userId.toString()) {
        post.incrementViewCount().catch(() => { }); // Fire and forget
    }

    return post;
};

/**
 * Hide post (owner only)
 * 
 * @param {String} userId - User ID
 * @param {String} postId - Post ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Success message
 */
const hidePost = async (userId, postId, req) => {
    const post = await Post.findById(postId);

    if (!post) {
        throw AppError.notFoundError('Post', 'POST_NOT_FOUND');
    }

    // Verify ownership
    if (post.author.toString() !== userId.toString()) {
        throw AppError.forbiddenError('You can only hide your own posts', 'NOT_POST_OWNER');
    }

    await post.hidePost();

    // Log activity
    logActivity(userId, ACTIVITY_TYPES.POST_DELETE, 'Post', postId, req, {
        action: 'hide'
    });

    return {
        message: 'Post hidden successfully'
    };
};

/**
 * Hide post from personal feed (any user)
 * Different from hidePost — only hides for THIS user, not globally
 *
 * @param {String} userId - User ID
 * @param {String} postId - Post ID
 * @returns {Promise<Object>} Success message
 */
const hideFromFeed = async (userId, postId) => {
    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
        throw AppError.notFoundError('Post', 'POST_NOT_FOUND');
    }

    // Add to user's hiddenPosts (addToSet prevents duplicates)
    await User.findByIdAndUpdate(
        userId,
        { $addToSet: { hiddenPosts: postId } },
        { new: true }
    );

    return { message: 'Post hidden from your feed' };
};

/**
 * Unhide post from personal feed
 *
 * @param {String} userId - User ID
 * @param {String} postId - Post ID
 * @returns {Promise<Object>} Success message
 */
const unhideFromFeed = async (userId, postId) => {
    await User.findByIdAndUpdate(
        userId,
        { $pull: { hiddenPosts: postId } }
    );

    return { message: 'Post restored to your feed' };
};

/**
 * Detect suspicious content patterns
 * Auto-flag for moderation
 * 
 * @param {String} content - Post content
 * @returns {String} Moderation status
 */
const detectSuspiciousPatterns = (content) => {
    // Excessive caps (>50% uppercase)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5 && content.length > 20) {
        return MODERATION_STATUS.FLAGGED;
    }

    // Excessive special characters
    const specialCharsRatio = (content.match(/[!@#$%^&*()]/g) || []).length / content.length;
    if (specialCharsRatio > 0.3) {
        return MODERATION_STATUS.FLAGGED;
    }

    // Suspicious keywords (basic implementation)
    const suspiciousKeywords = ['spam', 'click here', 'buy now', 'limited offer'];
    const lowerContent = content.toLowerCase();
    if (suspiciousKeywords.some(keyword => lowerContent.includes(keyword))) {
        return MODERATION_STATUS.FLAGGED;
    }

    return MODERATION_STATUS.APPROVED;
};

module.exports = {
    createPost,
    getPostById,
    hidePost,
    hideFromFeed,
    unhideFromFeed
};
