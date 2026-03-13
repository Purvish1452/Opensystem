const mongoose = require('mongoose');
const { MODERATION_STATUS, CONTENT_LIMITS } = require('../constants');

/**
 * Comment Model Schema - Phase-2
 * Shared comment system for Posts and Projects with nested threading
 */

const commentSchema = new mongoose.Schema(
    {
        // Author
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author is required'],
            index: true
        },

        // Content
        content: {
            type: String,
            required: [true, 'Content is required'],
            trim: true,
            minlength: [CONTENT_LIMITS.COMMENT_CONTENT_MIN, 'Comment must be at least 1 character'],
            maxlength: [CONTENT_LIMITS.COMMENT_CONTENT_MAX, 'Comment cannot exceed 2000 characters']
        },

        // Parent Reference (Post or Project)
        parentType: {
            type: String,
            required: true,
            enum: ['Post', 'Project', 'Comment']
        },

        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'parentType'
        },

        // Nested Comment Support
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
            default: null
        },

        replies: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }],

        // Reddit-style tree traversal
        path: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }],

        depth: {
            type: Number,
            default: 0,
            max: [CONTENT_LIMITS.MAX_COMMENT_DEPTH, `Comment depth cannot exceed ${CONTENT_LIMITS.MAX_COMMENT_DEPTH}`]
        },

        // Future Features
        likes: {
            type: Number,
            default: 0
        },

        likedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],

        // Edit Tracking
        isEdited: {
            type: Boolean,
            default: false
        },

        editedAt: Date,

        // Moderation
        isModerated: {
            type: Boolean,
            default: false
        },

        moderationStatus: {
            type: String,
            enum: Object.values(MODERATION_STATUS),
            default: MODERATION_STATUS.PENDING
        },

        // Phase-5: Content Moderation Scores
        moderationScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        moderationFlags: [{
            type: String,
            trim: true
        }],

        moderationCheckedAt: Date,

        // Soft Delete
        isDeleted: {
            type: Boolean,
            default: false
        },

        deletedAt: Date
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// ============================================
// INDEXES
// ============================================

// Fetch comments for post/project
commentSchema.index({ parentType: 1, parentId: 1, createdAt: -1 });

// Fetch nested replies
commentSchema.index({ parentComment: 1, createdAt: -1 });

// User's comments
commentSchema.index({ author: 1, createdAt: -1 });

// Tree traversal optimization
commentSchema.index({ path: 1 });

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Sanitize content
 */
commentSchema.pre('save', function (next) {
    if (this.isModified('content')) {
        this.content = this.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    next();
});

/**
 * Enforce max depth
 */
commentSchema.pre('save', function (next) {
    if (this.depth > CONTENT_LIMITS.MAX_COMMENT_DEPTH) {
        return next(new Error(`Comment depth cannot exceed ${CONTENT_LIMITS.MAX_COMMENT_DEPTH}`));
    }
    next();
});

/**
 * Build path array for tree traversal
 */
commentSchema.pre('save', async function (next) {
    if (this.isNew && this.parentComment) {
        try {
            const parentComment = await this.constructor.findById(this.parentComment);
            if (parentComment) {
                this.path = [...parentComment.path, parentComment._id];
                this.depth = parentComment.depth + 1;
            }
        } catch (error) {
            return next(error);
        }
    } else if (this.isNew) {
        this.path = [];
        this.depth = 0;
    }
    next();
});

// ============================================
// POST-SAVE MIDDLEWARE
// ============================================

/**
 * Increment parent's comment count
 */
commentSchema.post('save', async function (doc) {
    try {
        if (doc.parentType === 'Post') {
            await mongoose.model('Post').updateOne(
                { _id: doc.parentId },
                { $inc: { commentCount: 1 } }
            );
        } else if (doc.parentType === 'Project') {
            await mongoose.model('Project').updateOne(
                { _id: doc.parentId },
                { $inc: { commentCount: 1 } }
            );
        }

        // Add to parent comment's replies array if nested
        if (doc.parentComment) {
            await mongoose.model('Comment').updateOne(
                { _id: doc.parentComment },
                { $addToSet: { replies: doc._id } }
            );
        }
    } catch (error) {
        console.error('Error updating comment count:', error);
    }
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Add nested reply with depth validation
 */
commentSchema.methods.addReply = async function (commentId) {
    if (this.depth >= CONTENT_LIMITS.MAX_COMMENT_DEPTH) {
        throw new Error(`Cannot reply beyond depth ${CONTENT_LIMITS.MAX_COMMENT_DEPTH}`);
    }

    this.replies.push(commentId);
    await this.save();
};

/**
 * Soft delete preserving thread structure
 */
commentSchema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.deletedAt = Date.now();
    this.content = '[deleted]'; // Placeholder for UI
    await this.save();
};

/**
 * Mark as edited
 */
commentSchema.methods.markAsEdited = async function () {
    this.isEdited = true;
    this.editedAt = Date.now();
    await this.save();
};

/**
 * Add like (future feature)
 */
commentSchema.methods.addLike = async function (userId) {
    if (!this.likedBy.includes(userId)) {
        this.likedBy.push(userId);
        this.likes += 1;
        await this.save();
    }
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get comment tree using path array
 */
commentSchema.statics.getCommentTree = async function (parentType, parentId, maxDepth = CONTENT_LIMITS.MAX_COMMENT_DEPTH) {
    return await this.find({
        parentType,
        parentId,
        isDeleted: false,
        depth: { $lte: maxDepth }
    })
        .populate('author', 'username fullname profileImage')
        .sort({ createdAt: -1 });
};

/**
 * Get comments by path for efficient tree traversal
 */
commentSchema.statics.getCommentsByPath = async function (pathArray) {
    return await this.find({
        path: { $in: pathArray },
        isDeleted: false
    })
        .populate('author', 'username fullname profileImage')
        .sort({ createdAt: -1 });
};

// ============================================
// QUERY MIDDLEWARE
// ============================================

commentSchema.pre(/^find/, function (next) {
    if (!this.getOptions().includeSoftDeleted) {
        this.where({ isDeleted: false });
    }
    next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
