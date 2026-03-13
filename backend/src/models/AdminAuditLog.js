const mongoose = require('mongoose');
const { ADMIN_ACTIONS, ADMIN_SECURITY } = require('../constants');

/**
 * Admin Audit Log Model — Phase-4
 * Immutable forensic trail of all admin actions.
 * NO update or delete operations allowed (enforced at schema level).
 */

const adminAuditLogSchema = new mongoose.Schema(
    {
        // Admin who performed the action
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Admin is required'],
            index: true
        },

        // Action performed
        action: {
            type: String,
            required: [true, 'Action is required'],
            enum: Object.values(ADMIN_ACTIONS),
            index: true
        },

        // Target type
        targetType: {
            type: String,
            required: [true, 'Target type is required'],
            enum: ['User', 'Post', 'Project', 'Report', 'SuspiciousActivity', 'System']
        },

        // Target ID
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Target ID is required']
        },

        // Optional reason / description
        reason: {
            type: String,
            trim: true,
            maxlength: [500, 'Reason cannot exceed 500 characters']
        },

        // Additional structured context (max 5KB — validated at service layer)
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        // IP + user agent for forensics
        ipAddress: { type: String, default: null },
        userAgent: { type: String, default: null },

        // Correlation ID linking to the HTTP request
        requestId: { type: String, default: null }
    },
    {
        timestamps: true,     // createdAt/updatedAt auto-managed
        versionKey: false     // no __v noise on immutable records
    }
);

// ============================================
// INDEXES
// ============================================

adminAuditLogSchema.index({ admin: 1, createdAt: -1 });                          // admin's own history
adminAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });        // per-target forensic trace
adminAuditLogSchema.index({ action: 1, createdAt: -1 });                         // action-based queries

// ============================================
// IMMUTABILITY GUARDS
// Schema-level enforcement — no update or delete allowed
// ============================================

const IMMUTABLE_ERROR = 'AdminAuditLog is immutable — records cannot be modified or deleted';

adminAuditLogSchema.pre('updateOne', function () {
    throw new Error(IMMUTABLE_ERROR);
});
adminAuditLogSchema.pre('findOneAndUpdate', function () {
    throw new Error(IMMUTABLE_ERROR);
});
adminAuditLogSchema.pre('updateMany', function () {
    throw new Error(IMMUTABLE_ERROR);
});
adminAuditLogSchema.pre('deleteOne', function () {
    throw new Error(IMMUTABLE_ERROR);
});
adminAuditLogSchema.pre('findOneAndDelete', function () {
    throw new Error(IMMUTABLE_ERROR);
});
adminAuditLogSchema.pre('deleteMany', function () {
    throw new Error(IMMUTABLE_ERROR);
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Log admin action — only write method allowed
 * @param {Object} params
 */
adminAuditLogSchema.statics.logAdminAction = async function ({
    adminId, action, targetType, targetId, reason = '', metadata = {}, req = {}
}) {
    return await this.create({
        admin: adminId,
        action,
        targetType,
        targetId,
        reason,
        metadata,
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.headers?.['user-agent'] || null,
        requestId: req.requestId || null
    });
};

/**
 * Get admin's action history (paginated)
 */
adminAuditLogSchema.statics.getAdminActions = async function (adminId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return await this.find({ admin: adminId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
};

/**
 * Get all admin actions on a specific target
 */
adminAuditLogSchema.statics.getTargetHistory = async function (targetType, targetId) {
    return await this.find({ targetType, targetId })
        .populate('admin', 'username email role')
        .sort({ createdAt: -1 })
        .lean();
};

const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);

module.exports = AdminAuditLog;
