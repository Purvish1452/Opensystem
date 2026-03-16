const Post = require('../../models/Post');
const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const { logAudit } = require('./audit.service');
const { ADMIN_ACTIONS, MODERATION_STATUS, STATUS_CODES } = require('../../constants');

/**
 * Admin Post Service
 *
 * CRUD operations on posts performed by an admin.
 * All mutating actions write an audit log entry.
 * Admin bypasses ownership checks and soft-delete filters.
 */

// ─── LIST ALL POSTS ───────────────────────────────────────────────────────────

/**
 * Paginated list of all posts (includes soft-deleted when requested).
 *
 * @param {Object} filters - { author, visibility, moderationStatus, includeDeleted }
 * @param {Number} page
 * @param {Number} limit
 */
const listAllPosts = async (filters = {}, page = 1, limit = 20) => {
    const query = {};

    // Optionally include soft-deleted documents
    if (!filters.includeDeleted) {
        query.isDeleted = false;
    }

    if (filters.author) query.author = filters.author;
    if (filters.visibility) query.visibility = filters.visibility;
    if (filters.moderationStatus) query.moderationStatus = filters.moderationStatus;
    if (filters.contentType) query.contentType = filters.contentType;

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
        Post.find(query)
            .setOptions({ includeSoftDeleted: true })
            .populate('author', 'username fullname profileImage email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Post.countDocuments(query).setOptions({ includeSoftDeleted: true })
    ]);

    return { posts, total, page, pages: Math.ceil(total / limit) };
};

// ─── LIST POSTS BY USER ───────────────────────────────────────────────────────

/**
 * List all posts for a specific user (admin view — includes soft-deleted).
 *
 * @param {String} userId
 * @param {Number} page
 * @param {Number} limit
 */
const listPostsByUser = async (userId, page = 1, limit = 20) => {
    // Verify user exists
    const user = await User.findById(userId).select('username email').lean();
    if (!user) throw new AppError('User not found', STATUS_CODES.NOT_FOUND);

    const skip = (page - 1) * limit;
    const query = { author: userId };

    const [posts, total] = await Promise.all([
        Post.find(query)
            .setOptions({ includeSoftDeleted: true })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Post.countDocuments(query).setOptions({ includeSoftDeleted: true })
    ]);

    return { user, posts, total, page, pages: Math.ceil(total / limit) };
};

// ─── GET SINGLE POST ──────────────────────────────────────────────────────────

/**
 * Fetch any post by ID (admin view — bypasses soft-delete and hidden guards).
 *
 * @param {String} postId
 */
const adminGetPost = async (postId) => {
    const post = await Post.findById(postId)
        .setOptions({ includeSoftDeleted: true })
        .populate('author', 'username fullname profileImage email')
        .lean();

    if (!post) throw new AppError('Post not found', STATUS_CODES.NOT_FOUND);
    return post;
};

// ─── CREATE POST ─────────────────────────────────────────────────────────────

/**
 * Create a post on behalf of any user.
 * `targetUserId` in postData specifies the author.
 *
 * @param {String} adminId
 * @param {Object} postData - { targetUserId, content, contentType, tags, visibility }
 * @param {Object} req
 */
const adminCreatePost = async (adminId, postData, req) => {
    const { targetUserId, content, contentType, tags, visibility } = postData;

    // Verify target user exists
    const targetUser = await User.findById(targetUserId).select('username email').lean();
    if (!targetUser) throw new AppError('Target user not found', STATUS_CODES.NOT_FOUND);

    const post = await Post.create({
        author: targetUserId,
        content,
        contentType: contentType || 'discussion',
        tags: tags || [],
        visibility: visibility || 'public',
        moderationStatus: MODERATION_STATUS.APPROVED, // Admin-created posts auto-approved
        isModerated: true,
        moderatedBy: adminId,
        moderatedAt: new Date()
    });

    // Audit log — non-blocking
    await logAudit({
        adminId,
        action: ADMIN_ACTIONS.CREATE_POST,
        targetType: 'Post',
        targetId: post._id,
        reason: `Admin created post on behalf of user ${targetUser.username}`,
        metadata: {
            targetUserId,
            targetUsername: targetUser.username,
            contentType: post.contentType,
            visibility: post.visibility
        },
        req
    });

    return post;
};

// ─── UPDATE POST ─────────────────────────────────────────────────────────────

/**
 * Update any post regardless of ownership.
 *
 * @param {String} adminId
 * @param {String} postId
 * @param {Object} updates - { content, contentType, tags, visibility, isHidden, allowComments, moderationStatus }
 * @param {String} reason
 * @param {Object} req
 */
const adminUpdatePost = async (adminId, postId, updates, reason, req) => {
    const post = await Post.findById(postId).setOptions({ includeSoftDeleted: true });
    if (!post) throw new AppError('Post not found', STATUS_CODES.NOT_FOUND);

    const allowedFields = [
        'content', 'contentType', 'tags', 'visibility',
        'isHidden', 'allowComments', 'moderationStatus'
    ];

    const appliedChanges = {};
    allowedFields.forEach(key => {
        if (updates[key] !== undefined) {
            post[key] = updates[key];
            appliedChanges[key] = updates[key];
        }
    });

    // Track admin moderation info
    post.isModerated = true;
    post.moderatedBy = adminId;
    post.moderatedAt = new Date();

    await post.save();

    await logAudit({
        adminId,
        action: ADMIN_ACTIONS.UPDATE_POST,
        targetType: 'Post',
        targetId: postId,
        reason: reason || 'Updated by admin',
        metadata: {
            postId,
            updatedFields: Object.keys(appliedChanges)
        },
        req
    });

    return post;
};

// ─── DELETE POST ─────────────────────────────────────────────────────────────

/**
 * Soft-delete any post regardless of ownership.
 *
 * @param {String} adminId
 * @param {String} postId
 * @param {String} reason
 * @param {Object} req
 */
const adminDeletePost = async (adminId, postId, reason, req) => {
    const post = await Post.findById(postId).setOptions({ includeSoftDeleted: true });
    if (!post) throw new AppError('Post not found', STATUS_CODES.NOT_FOUND);

    if (post.isDeleted) {
        throw new AppError('Post is already deleted', STATUS_CODES.CONFLICT);
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    await logAudit({
        adminId,
        action: ADMIN_ACTIONS.DELETE_POST,
        targetType: 'Post',
        targetId: postId,
        reason: reason || 'Deleted by admin',
        metadata: {
            postId,
            authorId: post.author,
            contentType: post.contentType
        },
        req
    });

    return { message: 'Post deleted by admin successfully' };
};

module.exports = {
    listAllPosts,
    listPostsByUser,
    adminGetPost,
    adminCreatePost,
    adminUpdatePost,
    adminDeletePost
};
