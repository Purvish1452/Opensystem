const mongoose = require('mongoose');
const {
    CONTENT_TYPE,
    POST_VISIBILITY,
    MODERATION_STATUS,
    VOTE_TYPES,
    MEDIA_TYPES,
    CONTENT_LIMITS,
    FILE_UPLOAD
} = require('../constants');

/**
 * Post Model Schema - Phase-2
 * Problem Feed module with multimedia, voting, and moderation
 */

const postSchema = new mongoose.Schema(
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
            minlength: [CONTENT_LIMITS.POST_CONTENT_MIN, 'Content must be at least 1 character'],
            maxlength: [CONTENT_LIMITS.POST_CONTENT_MAX, 'Content cannot exceed 5000 characters']
        },

        contentType: {
            type: String,
            enum: Object.values(CONTENT_TYPE),
            default: CONTENT_TYPE.DISCUSSION
        },

        // Media Attachments
        media: [{
            type: {
                type: String,
                enum: Object.values(MEDIA_TYPES),
                required: true
            },
            url: {
                type: String,
                required: true
            },
            filename: String,
            size: Number,
            mimeType: String,
            cloudinaryId: String, // For deletion
            thumbnail: String, // For video previews
            duration: Number, // For videos in seconds
            fileHash: String, // SHA256 for duplicate detection
            isScanned: {
                type: Boolean,
                default: false
            }
        }],

        // Code Snippets
        codeSnippets: [{
            language: {
                type: String,
                required: true
            },
            code: {
                type: String,
                required: true,
                maxlength: [10000, 'Code snippet cannot exceed 10000 characters']
            },
            filename: String
        }],

        // Tags
        tags: [{
            type: String,
            trim: true,
            lowercase: true,
            maxlength: [CONTENT_LIMITS.TAG_MAX_LENGTH, 'Tag cannot exceed 30 characters']
        }],

        // Visibility & Settings
        visibility: {
            type: String,
            enum: Object.values(POST_VISIBILITY),
            default: POST_VISIBILITY.PUBLIC
        },

        isHidden: {
            type: Boolean,
            default: false
        },

        downloadEnabled: {
            type: Boolean,
            default: true
        },

        allowComments: {
            type: Boolean,
            default: true
        },

        isPinned: {
            type: Boolean,
            default: false
        },

        // Voting System
        votes: {
            upvotes: {
                type: Number,
                default: 0
            },
            downvotes: {
                type: Number,
                default: 0
            },
            voteScore: {
                type: Number,
                default: 0,
                index: true // For trending queries
            },
            voters: [{
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                voteType: {
                    type: String,
                    enum: [VOTE_TYPES.UPVOTE, VOTE_TYPES.DOWNVOTE]
                },
                votedAt: {
                    type: Date,
                    default: Date.now
                }
            }]
        },

        // Engagement Metrics
        commentCount: {
            type: Number,
            default: 0
        },

        bookmarksCount: {
            type: Number,
            default: 0
        },

        shareCount: {
            type: Number,
            default: 0
        },

        viewCount: {
            type: Number,
            default: 0
        },

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

        moderatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        moderatedAt: Date,

        isSpamSuspected: {
            type: Boolean,
            default: false
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

        deletedAt: Date,

        editedAt: Date,

        // PDF Export Metadata
        pdfExportMetadata: {
            authorUsername: String, // Denormalized for performance
            exportedAt: Date,
            version: Number
        }
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

// User timeline
postSchema.index({ author: 1, createdAt: -1 });

// Tag filtering
postSchema.index({ tags: 1 });

// Trending algorithm (optimized with voteScore)
postSchema.index({ 'votes.voteScore': -1, createdAt: -1 });

// Feed queries
postSchema.index({ isDeleted: 1, visibility: 1, createdAt: -1 });

// Filter by content type
postSchema.index({ contentType: 1, createdAt: -1 });

// Duplicate detection
postSchema.index({ 'media.fileHash': 1 });

// Text search
postSchema.index({ content: 'text', tags: 'text' });

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Sanitize content before saving
 */
postSchema.pre('save', function (next) {
    if (this.isModified('content')) {
        // Strip script tags and prevent XSS
        this.content = this.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    next();
});

/**
 * Validate media array length
 */
postSchema.pre('save', function (next) {
    if (this.media && this.media.length > FILE_UPLOAD.MAX_MEDIA_PER_POST) {
        return next(new Error(`Cannot upload more than ${FILE_UPLOAD.MAX_MEDIA_PER_POST} media files`));
    }
    next();
});

/**
 * Validate code snippets length
 */
postSchema.pre('save', function (next) {
    if (this.codeSnippets && this.codeSnippets.length > FILE_UPLOAD.MAX_CODE_SNIPPETS_PER_POST) {
        return next(new Error(`Cannot add more than ${FILE_UPLOAD.MAX_CODE_SNIPPETS_PER_POST} code snippets`));
    }
    next();
});

/**
 * Validate tags length
 */
postSchema.pre('save', function (next) {
    if (this.tags && this.tags.length > CONTENT_LIMITS.TAGS_MAX_COUNT) {
        return next(new Error(`Cannot add more than ${CONTENT_LIMITS.TAGS_MAX_COUNT} tags`));
    }
    next();
});

/**
 * Calculate and update voteScore
 */
postSchema.pre('save', function (next) {
    if (this.isModified('votes.upvotes') || this.isModified('votes.downvotes')) {
        this.votes.voteScore = this.votes.upvotes - this.votes.downvotes;
    }
    next();
});

/**
 * Denormalize author username for PDF export
 */
postSchema.pre('save', async function (next) {
    if (this.isNew && this.populated('author')) {
        this.pdfExportMetadata = {
            authorUsername: this.author.username,
            version: 1
        };
    }
    next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Add or update vote
 * @param {ObjectId} userId - User ID
 * @param {String} voteType - 'upvote' or 'downvote'
 */
postSchema.methods.addVote = async function (userId, voteType) {
    // Find existing vote
    const existingVoteIndex = this.votes.voters.findIndex(
        v => v.user.toString() === userId.toString()
    );

    if (existingVoteIndex !== -1) {
        const existingVote = this.votes.voters[existingVoteIndex];

        // If same vote type, remove vote (undo)
        if (existingVote.voteType === voteType) {
            this.votes.voters.splice(existingVoteIndex, 1);
            if (voteType === VOTE_TYPES.UPVOTE) {
                this.votes.upvotes -= 1;
            } else {
                this.votes.downvotes -= 1;
            }
        } else {
            // Change vote type
            existingVote.voteType = voteType;
            existingVote.votedAt = Date.now();

            if (voteType === VOTE_TYPES.UPVOTE) {
                this.votes.upvotes += 1;
                this.votes.downvotes -= 1;
            } else {
                this.votes.downvotes += 1;
                this.votes.upvotes -= 1;
            }
        }
    } else {
        // Add new vote
        this.votes.voters.push({
            user: userId,
            voteType,
            votedAt: Date.now()
        });

        if (voteType === VOTE_TYPES.UPVOTE) {
            this.votes.upvotes += 1;
        } else {
            this.votes.downvotes += 1;
        }
    }

    // Recalculate vote score
    this.votes.voteScore = this.votes.upvotes - this.votes.downvotes;

    await this.save();
};

/**
 * Remove vote
 * @param {ObjectId} userId - User ID
 */
postSchema.methods.removeVote = async function (userId) {
    const voteIndex = this.votes.voters.findIndex(
        v => v.user.toString() === userId.toString()
    );

    if (voteIndex !== -1) {
        const vote = this.votes.voters[voteIndex];

        if (vote.voteType === VOTE_TYPES.UPVOTE) {
            this.votes.upvotes -= 1;
        } else {
            this.votes.downvotes -= 1;
        }

        this.votes.voters.splice(voteIndex, 1);
        this.votes.voteScore = this.votes.upvotes - this.votes.downvotes;

        await this.save();
    }
};

/**
 * Hide post (user self-hiding)
 */
postSchema.methods.hide = async function () {
    this.isHidden = true;
    await this.save();
};

/**
 * Soft delete
 */
postSchema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.deletedAt = Date.now();
    await this.save();
};

/**
 * Increment view count atomically
 */
postSchema.methods.incrementViewCount = async function () {
    await this.constructor.updateOne(
        { _id: this._id },
        { $inc: { viewCount: 1 } }
    );
};

/**
 * Toggle comments
 */
postSchema.methods.toggleComments = async function () {
    this.allowComments = !this.allowComments;
    await this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get feed with filters
 * @param {ObjectId} userId - Current user ID (optional)
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @param {Object} filters - Filter options
 */
postSchema.statics.getFeed = async function (userId, page = 1, limit = 10, filters = {}) {
    const query = {
        isDeleted: false
    };

    // Visibility filtering
    if (userId) {
        query.$or = [
            { visibility: POST_VISIBILITY.PUBLIC },
            { visibility: POST_VISIBILITY.PRIVATE, author: userId }
        ];
    } else {
        query.visibility = POST_VISIBILITY.PUBLIC;
    }

    // Content type filter
    if (filters.contentType) {
        query.contentType = filters.contentType;
    }

    // Tag filter
    if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
    }

    // User type filter (requires population)
    const skip = (page - 1) * limit;

    return await this.find(query)
        .populate('author', 'username fullname profileImage userType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

/**
 * Get trending posts
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @param {String} timeWindow - '24h', '7d', '30d', 'all'
 */
postSchema.statics.getTrending = async function (page = 1, limit = 10, timeWindow = 'all') {
    const query = {
        isDeleted: false,
        visibility: POST_VISIBILITY.PUBLIC
    };

    // Time window filter
    if (timeWindow !== 'all') {
        const timeMap = {
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };

        query.createdAt = { $gte: new Date(Date.now() - timeMap[timeWindow]) };
    }

    const skip = (page - 1) * limit;

    return await this.find(query)
        .populate('author', 'username fullname profileImage')
        .sort({ 'votes.voteScore': -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

/**
 * Search posts
 * @param {String} query - Search query
 * @param {Object} filters - Filter options
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 */
postSchema.statics.searchPosts = async function (query, filters = {}, page = 1, limit = 10) {
    const searchQuery = {
        $text: { $search: query },
        isDeleted: false,
        visibility: POST_VISIBILITY.PUBLIC
    };

    if (filters.tags && filters.tags.length > 0) {
        searchQuery.tags = { $in: filters.tags };
    }

    const skip = (page - 1) * limit;

    return await this.find(searchQuery)
        .populate('author', 'username fullname profileImage')
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

/**
 * Detect duplicate media uploads
 * @param {String} fileHash - SHA256 hash of file
 */
postSchema.statics.detectDuplicate = async function (fileHash) {
    return await this.findOne({
        'media.fileHash': fileHash,
        isDeleted: false
    });
};

// ============================================
// QUERY MIDDLEWARE
// ============================================

/**
 * Exclude soft-deleted posts by default
 */
postSchema.pre(/^find/, function (next) {
    if (!this.getOptions().includeSoftDeleted) {
        this.where({ isDeleted: false });
    }
    next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
