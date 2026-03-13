const mongoose = require('mongoose');
const {
    PROJECT_STAGES,
    PROJECT_STATUS,
    REQUIREMENT_TYPES,
    PROJECT_ROLES,
    MODERATION_STATUS,
    VOTE_TYPES,
    CONTENT_LIMITS
} = require('../constants');

/**
 * Project Model Schema - Phase-2
 * Developer Mode module with team enrollment and collaboration
 */

const projectSchema = new mongoose.Schema(
    {
        // Basic Information
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            minlength: [CONTENT_LIMITS.PROJECT_TITLE_MIN, 'Title must be at least 5 characters'],
            maxlength: [CONTENT_LIMITS.PROJECT_TITLE_MAX, 'Title cannot exceed 100 characters'],
            index: true
        },

        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            minlength: [CONTENT_LIMITS.PROJECT_DESCRIPTION_MIN, 'Description must be at least 10 characters'],
            maxlength: [CONTENT_LIMITS.PROJECT_DESCRIPTION_MAX, 'Description cannot exceed 2000 characters']
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Owner is required'],
            index: true
        },

        // Technical Details
        techStack: [{
            type: String,
            trim: true,
            lowercase: true
        }],

        githubLink: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v) return true;
                    return /^https?:\/\/(www\.)?github\.com\/.+/.test(v);
                },
                message: 'Invalid GitHub URL'
            }
        },

        demoLink: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v) return true;
                    return /^https?:\/\/.+/.test(v);
                },
                message: 'Invalid demo URL'
            }
        },

        // Project Classification
        projectStage: {
            type: String,
            enum: Object.values(PROJECT_STAGES),
            required: [true, 'Project stage is required']
        },

        projectStatus: {
            type: String,
            enum: Object.values(PROJECT_STATUS),
            default: PROJECT_STATUS.ACTIVE
        },

        // Timeline
        timeline: {
            startDate: Date,
            expectedEndDate: Date,
            actualEndDate: Date
        },

        // Team Requirements
        requirementType: {
            type: String,
            enum: Object.values(REQUIREMENT_TYPES),
            required: [true, 'Requirement type is required']
        },

        maxMembers: {
            type: Number,
            min: [1, 'Max members must be at least 1'],
            max: [CONTENT_LIMITS.MAX_PROJECT_MEMBERS, `Max members cannot exceed ${CONTENT_LIMITS.MAX_PROJECT_MEMBERS}`]
        },

        currentMemberCount: {
            type: Number,
            default: 1 // Owner counts as first member
        },

        // Roles Needed
        rolesNeeded: [{
            role: {
                type: String,
                enum: Object.values(PROJECT_ROLES),
                required: true
            },
            count: {
                type: Number,
                required: true,
                min: 1
            },
            description: {
                type: String,
                maxlength: [200, 'Role description cannot exceed 200 characters']
            },
            filled: {
                type: Number,
                default: 0
            }
        }],

        // Enrolled Users
        enrolledUsers: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            role: {
                type: String,
                enum: Object.values(PROJECT_ROLES),
                required: true
            },
            enrolledAt: {
                type: Date,
                default: Date.now
            },
            approvedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            status: {
                type: String,
                enum: ['active', 'inactive'],
                default: 'active'
            }
        }],

        // Pending Requests
        pendingRequests: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            requestedRole: {
                type: String,
                enum: Object.values(PROJECT_ROLES),
                required: true
            },
            message: {
                type: String,
                maxlength: [300, 'Message cannot exceed 300 characters']
            },
            requestedAt: {
                type: Date,
                default: Date.now
            },
            status: {
                type: String,
                enum: ['pending', 'approved', 'rejected'],
                default: 'pending'
            }
        }],

        // Discussion
        discussionEnabled: {
            type: Boolean,
            default: true
        },

        discussionThreadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Discussion' // Future chat module
        },

        // Attachments
        attachments: [{
            filename: String,
            url: String,
            size: Number,
            uploadedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],

        // Update Logs
        updateLogs: [{
            title: {
                type: String,
                required: true,
                maxlength: [100, 'Update title cannot exceed 100 characters']
            },
            description: {
                type: String,
                required: true,
                maxlength: [1000, 'Update description cannot exceed 1000 characters']
            },
            updatedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }],

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
                index: true
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

        // Future Features
        starsCount: {
            type: Number,
            default: 0
        },

        forkedFrom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project'
        },

        // Engagement Metrics
        commentCount: {
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

projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ techStack: 1 });
projectSchema.index({ projectStage: 1, requirementType: 1, projectStatus: 1 });
projectSchema.index({ 'votes.voteScore': -1, createdAt: -1 });
projectSchema.index({ projectStatus: 1, currentMemberCount: 1, maxMembers: 1 });
projectSchema.index({ title: 'text', description: 'text', techStack: 'text' });

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Sanitize description and attachment filenames
 */
projectSchema.pre('save', function (next) {
    if (this.isModified('description')) {
        this.description = this.description.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    next();
});

/**
 * Validate tech stack length
 */
projectSchema.pre('save', function (next) {
    if (this.techStack && this.techStack.length > CONTENT_LIMITS.TECH_STACK_MAX_COUNT) {
        return next(new Error(`Cannot add more than ${CONTENT_LIMITS.TECH_STACK_MAX_COUNT} technologies`));
    }
    next();
});

/**
 * Calculate vote score
 */
projectSchema.pre('save', function (next) {
    if (this.isModified('votes.upvotes') || this.isModified('votes.downvotes')) {
        this.votes.voteScore = this.votes.upvotes - this.votes.downvotes;
    }
    next();
});

/**
 * Update current member count
 */
projectSchema.pre('save', function (next) {
    if (this.isModified('enrolledUsers')) {
        this.currentMemberCount = this.enrolledUsers.filter(u => u.status === 'active').length + 1; // +1 for owner
    }
    next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Enroll user with validation
 */
projectSchema.methods.enrollUser = async function (userId, role, approvedBy) {
    // Prevent owner self-enrollment
    if (this.owner.toString() === userId.toString()) {
        throw new Error('Owner cannot enroll in their own project');
    }

    // Check if already enrolled
    const alreadyEnrolled = this.enrolledUsers.some(
        u => u.user.toString() === userId.toString()
    );
    if (alreadyEnrolled) {
        throw new Error('User is already enrolled in this project');
    }

    // Check max members
    if (this.requirementType === REQUIREMENT_TYPES.LIMITED_MEMBERS) {
        if (this.currentMemberCount >= this.maxMembers) {
            throw new Error('Project has reached maximum member capacity');
        }
    }

    // Check role availability
    const roleNeeded = this.rolesNeeded.find(r => r.role === role);
    if (roleNeeded && roleNeeded.filled >= roleNeeded.count) {
        throw new Error(`No more slots available for ${role} role`);
    }

    // Add enrollment
    this.enrolledUsers.push({
        user: userId,
        role,
        enrolledAt: Date.now(),
        approvedBy,
        status: 'active'
    });

    // Update role filled count
    if (roleNeeded) {
        roleNeeded.filled += 1;
    }

    // Remove from pending requests
    this.pendingRequests = this.pendingRequests.filter(
        r => r.user.toString() !== userId.toString()
    );

    await this.save();
};

/**
 * Reject enrollment request
 */
projectSchema.methods.rejectEnrollment = async function (userId, reason) {
    const requestIndex = this.pendingRequests.findIndex(
        r => r.user.toString() === userId.toString()
    );

    if (requestIndex !== -1) {
        this.pendingRequests[requestIndex].status = 'rejected';
        await this.save();
    }
};

/**
 * Remove enrolled user
 */
projectSchema.methods.removeUser = async function (userId) {
    const userIndex = this.enrolledUsers.findIndex(
        u => u.user.toString() === userId.toString()
    );

    if (userIndex !== -1) {
        const user = this.enrolledUsers[userIndex];

        // Update role filled count
        const roleNeeded = this.rolesNeeded.find(r => r.role === user.role);
        if (roleNeeded && roleNeeded.filled > 0) {
            roleNeeded.filled -= 1;
        }

        this.enrolledUsers.splice(userIndex, 1);
        await this.save();
    }
};

/**
 * Add update log
 */
projectSchema.methods.addUpdateLog = async function (title, description, userId) {
    this.updateLogs.push({
        title,
        description,
        updatedBy: userId,
        updatedAt: Date.now()
    });
    await this.save();
};

/**
 * Check role availability
 */
projectSchema.methods.checkRoleAvailability = function (role) {
    const roleNeeded = this.rolesNeeded.find(r => r.role === role);
    if (!roleNeeded) return false;
    return roleNeeded.filled < roleNeeded.count;
};

/**
 * Add vote (same logic as Post)
 */
projectSchema.methods.addVote = async function (userId, voteType) {
    const existingVoteIndex = this.votes.voters.findIndex(
        v => v.user.toString() === userId.toString()
    );

    if (existingVoteIndex !== -1) {
        const existingVote = this.votes.voters[existingVoteIndex];

        if (existingVote.voteType === voteType) {
            this.votes.voters.splice(existingVoteIndex, 1);
            if (voteType === VOTE_TYPES.UPVOTE) {
                this.votes.upvotes -= 1;
            } else {
                this.votes.downvotes -= 1;
            }
        } else {
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

    this.votes.voteScore = this.votes.upvotes - this.votes.downvotes;
    await this.save();
};

/**
 * Soft delete
 */
projectSchema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.deletedAt = Date.now();
    await this.save();
};

/**
 * Archive project
 */
projectSchema.methods.archiveProject = async function () {
    this.projectStatus = PROJECT_STATUS.ARCHIVED;
    await this.save();
};

/**
 * Complete project
 */
projectSchema.methods.completeProject = async function () {
    this.projectStatus = PROJECT_STATUS.COMPLETED;
    this.timeline.actualEndDate = Date.now();
    await this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get project feed with filters
 */
projectSchema.statics.getProjectFeed = async function (filters = {}, page = 1, limit = 10) {
    const query = { isDeleted: false };

    if (filters.stage) query.projectStage = filters.stage;
    if (filters.status) query.projectStatus = filters.status;
    if (filters.techStack) query.techStack = { $in: filters.techStack };

    const skip = (page - 1) * limit;

    return await this.find(query)
        .populate('owner', 'username fullname profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

/**
 * Get trending projects
 */
projectSchema.statics.getTrending = async function (page = 1, limit = 10, timeWindow = 'all') {
    const query = { isDeleted: false };

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
        .populate('owner', 'username fullname profileImage')
        .sort({ 'votes.voteScore': -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

/**
 * Search projects
 */
projectSchema.statics.searchProjects = async function (query, filters = {}, page = 1, limit = 10) {
    const searchQuery = {
        $text: { $search: query },
        isDeleted: false
    };

    if (filters.techStack) searchQuery.techStack = { $in: filters.techStack };
    if (filters.stage) searchQuery.projectStage = filters.stage;

    const skip = (page - 1) * limit;

    return await this.find(searchQuery)
        .populate('owner', 'username fullname profileImage')
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

/**
 * Get open projects accepting members
 */
projectSchema.statics.getOpenProjects = async function (techStack = null, page = 1, limit = 10) {
    const query = {
        isDeleted: false,
        projectStatus: PROJECT_STATUS.ACTIVE,
        $expr: { $lt: ['$currentMemberCount', '$maxMembers'] }
    };

    if (techStack) query.techStack = { $in: techStack };

    const skip = (page - 1) * limit;

    return await this.find(query)
        .populate('owner', 'username fullname profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

// ============================================
// QUERY MIDDLEWARE
// ============================================

projectSchema.pre(/^find/, function (next) {
    if (!this.getOptions().includeSoftDeleted) {
        this.where({ isDeleted: false });
    }
    next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
