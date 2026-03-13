const mongoose = require('mongoose');
const { TECH_STACK, PROFILE_LIMITS } = require('../constants');

/**
 * UserProject Model
 *
 * Separate collection for user portfolio projects.
 * Kept out of User document for scalability:
 *   - Users can have 50+ projects over time
 *   - Supports pagination, recruiter tech-stack search, full-text search
 *   - Enables future engagement metrics without bloating User doc
 *
 * Security:
 *   - Soft delete only (isDeleted) — full audit trail preserved
 *   - Ownership enforced at service layer via compound { _id, userId } query
 *   - versionKey enabled for optimistic locking (concurrency protection)
 */

const userProjectSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true
        },

        title: {
            type: String,
            required: [true, 'Project title is required'],
            trim: true,
            maxlength: [PROFILE_LIMITS.PROJECT_TITLE_MAX, `Title cannot exceed ${PROFILE_LIMITS.PROJECT_TITLE_MAX} characters`]
        },

        description: {
            type: String,
            required: [true, 'Project description is required'],
            trim: true,
            maxlength: [PROFILE_LIMITS.PROJECT_DESC_MAX, `Description cannot exceed ${PROFILE_LIMITS.PROJECT_DESC_MAX} characters`]
        },

        githubUrl: {
            type: String,
            trim: true,
            default: null,
            validate: {
                validator: function (v) {
                    if (!v) return true;
                    return /^https:\/\/.+/.test(v);
                },
                message: 'GitHub URL must start with https://'
            }
        },

        deployedUrl: {
            type: String,
            trim: true,
            default: null,
            validate: {
                validator: function (v) {
                    if (!v) return true;
                    return /^https:\/\/.+/.test(v);
                },
                message: 'Deployed URL must start with https://'
            }
        },

        techStack: {
            type: [String],
            default: [],
            validate: [
                {
                    validator: function (v) {
                        return v.length <= PROFILE_LIMITS.MAX_TECH_STACK_PER_PROJECT;
                    },
                    message: `Tech stack cannot exceed ${PROFILE_LIMITS.MAX_TECH_STACK_PER_PROJECT} items`
                },
                {
                    validator: function (v) {
                        const validValues = Object.values(TECH_STACK);
                        return v.every(t => validValues.includes(t));
                    },
                    message: 'One or more tech stack values are invalid'
                }
            ]
        },

        skillsAcquired: {
            type: [{ type: String, trim: true, maxlength: 50 }],
            default: [],
            validate: [
                v => v.length <= PROFILE_LIMITS.MAX_SKILLS_ACQUIRED_PER_PROJECT,
                `Skills acquired cannot exceed ${PROFILE_LIMITS.MAX_SKILLS_ACQUIRED_PER_PROJECT} items`
            ]
        },

        status: {
            type: String,
            enum: {
                values: ['ongoing', 'completed', 'archived'],
                message: 'Status must be ongoing, completed, or archived'
            },
            default: 'ongoing'
        },

        startDate: {
            type: Date,
            default: null
        },

        endDate: {
            type: Date,
            default: null,
            validate: {
                validator: function (v) {
                    if (!v || !this.startDate) return true;
                    return v >= this.startDate;
                },
                message: 'End date must be after start date'
            }
        },

        isPublic: {
            type: Boolean,
            default: true
        },

        // Soft delete — never hard delete for audit integrity
        isDeleted: {
            type: Boolean,
            default: false,
            select: false
        },
        deletedAt: {
            type: Date,
            default: null,
            select: false
        },

        // Future recruiter engagement metrics
        viewsCount: {
            type: Number,
            default: 0,
            min: 0
        },
        likesCount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
        // versionKey (__v) is ON by default in Mongoose — provides optimistic locking
        // Do not set versionKey: true (invalid), just leave the default
    }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Primary access: paginated project list for a user
userProjectSchema.index({ userId: 1, createdAt: -1 });

// Public profile loading (excludes soft-deleted)
userProjectSchema.index({ userId: 1, isPublic: 1, isDeleted: 1 });

// Recruiter multi-filter search
userProjectSchema.index({ techStack: 1, isPublic: 1, status: 1 });

// Explicit text index (NOT $** wildcard — avoids performance issues)
userProjectSchema.index(
    { title: 'text', description: 'text' },
    { weights: { title: 3, description: 1 }, name: 'project_text_search' }
);

const UserProject = mongoose.model('UserProject', userProjectSchema);

module.exports = UserProject;
