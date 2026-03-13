const mongoose = require('mongoose');
const { REPORT_SEVERITY, MODERATION_STATUS } = require('../constants');

/**
 * Report Model Schema - Phase-2
 * User reporting system for content moderation
 */

const reportSchema = new mongoose.Schema(
    {
        // Reporter
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Reporter is required'],
            index: true
        },

        // Target (what's being reported)
        targetType: {
            type: String,
            required: true,
            enum: ['Post', 'Project', 'User', 'Comment']
        },

        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'targetType'
        },

        // Report Details
        reason: {
            type: String,
            required: [true, 'Reason is required'],
            enum: ['spam', 'harassment', 'inappropriate', 'copyright', 'misinformation', 'other']
        },

        severity: {
            type: String,
            enum: Object.values(REPORT_SEVERITY),
            default: REPORT_SEVERITY.MEDIUM
        },

        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters']
        },

        // Review Status
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'actionTaken', 'dismissed'],
            default: 'pending'
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        reviewedAt: Date,

        actionTaken: {
            type: String,
            maxlength: [200, 'Action description cannot exceed 200 characters']
        },

        // ML Detection Flag
        autoFlagged: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// ============================================
// INDEXES
// ============================================

// Target-specific reports
reportSchema.index({ targetType: 1, targetId: 1, status: 1 });

// User's report history
reportSchema.index({ reporter: 1, createdAt: -1 });

// Priority moderation queue
reportSchema.index({ status: 1, severity: -1, createdAt: -1 });

// High-severity pending reports
reportSchema.index({ severity: 1, status: 1 });

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Sanitize description
 */
reportSchema.pre('save', function (next) {
    if (this.isModified('description') && this.description) {
        this.description = this.description.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    next();
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get moderation queue
 */
reportSchema.statics.getModerationQueue = async function (page = 1, limit = 10, severityFilter = null) {
    const query = { status: 'pending' };

    if (severityFilter) {
        query.severity = severityFilter;
    }

    const skip = (page - 1) * limit;

    return await this.find(query)
        .populate('reporter', 'username email')
        .populate('targetType targetId')
        .sort({ severity: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

/**
 * Get reports for a specific target
 */
reportSchema.statics.getReportsByTarget = async function (targetType, targetId) {
    return await this.find({
        targetType,
        targetId
    })
        .populate('reporter', 'username email')
        .sort({ createdAt: -1 });
};

/**
 * Get auto-flagged reports
 */
reportSchema.statics.getAutoFlaggedReports = async function (page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    return await this.find({
        autoFlagged: true,
        status: 'pending'
    })
        .populate('reporter', 'username email')
        .populate('targetType targetId')
        .sort({ severity: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
