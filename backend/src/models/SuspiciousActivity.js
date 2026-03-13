const mongoose = require('mongoose');
const { SUSPICIOUS_TYPES, RISK_SCORE_WEIGHTS } = require('../constants');

/**
 * SuspiciousActivity Model — Phase-4
 * Stores flagged suspicious behaviour events per user.
 * Read-heavy: admin triage, risk scoring, deduplication.
 * Soft resolution only — no hard deletes.
 */

const suspiciousActivitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'userId is required'],
            index: true
        },

        type: {
            type: String,
            required: [true, 'Suspicious activity type is required'],
            enum: Object.values(SUSPICIOUS_TYPES)
        },

        // LOW / MEDIUM / HIGH — auto-calculated by detection.service based on frequency
        severity: {
            type: String,
            enum: ['low', 'medium', 'high'],
            required: true
        },

        // How much this flag contributed to the user's riskScore
        riskScoreImpact: {
            type: Number,
            required: true,
            min: 0
        },

        // Arbitrary context (IP, endpoint, counts, etc.)
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        // Admin resolution tracking
        resolved: {
            type: Boolean,
            default: false,
            index: true
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        resolvedAt: {
            type: Date,
            default: null
        },
        resolutionNote: {
            type: String,
            maxlength: [300, 'Resolution note cannot exceed 300 characters'],
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// ============================================
// INDEXES
// ============================================

suspiciousActivitySchema.index({ userId: 1, createdAt: -1 });     // user's flag history (primary)
suspiciousActivitySchema.index({ userId: 1, resolved: 1 });        // fast unresolved lookups
suspiciousActivitySchema.index({ resolved: 1, createdAt: -1 });    // admin queue: all unresolved
suspiciousActivitySchema.index({ type: 1, createdAt: -1 });        // filter by type

// Deduplication index: block same type for same user within 1 hour
// (enforced at service layer via query, not via unique index — allows metadata variation)

// TTL strategy (deferred): { resolvedAt: 1, expireAfterSeconds: 15552000 }
// Add when storage becomes a concern (180 days for resolved records)

// ============================================
// STATIC METHODS
// ============================================

/**
 * Check if a flag of same type exists for this user within timeWindowMs
 * Used to deduplicate noisy flag storms
 */
suspiciousActivitySchema.statics.isDuplicate = async function (userId, type, timeWindowMs = 3600000) {
    const since = new Date(Date.now() - timeWindowMs);
    const count = await this.countDocuments({
        userId,
        type,
        createdAt: { $gte: since }
    });
    return count > 0;
};

/**
 * Get unresolved flags for a user
 */
suspiciousActivitySchema.statics.getUnresolvedByUser = async function (userId) {
    return await this.find({ userId, resolved: false })
        .sort({ createdAt: -1 })
        .lean();
};

/**
 * Get paginated unresolved flags (admin queue)
 */
suspiciousActivitySchema.statics.getAdminQueue = async function (page = 1, limit = 20, filters = {}) {
    const query = { resolved: false, ...filters };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        this.find(query)
            .populate('userId', 'username email riskScore accountStatus')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query)
    ]);
    return { data, total, page, pages: Math.ceil(total / limit) };
};

const SuspiciousActivity = mongoose.model('SuspiciousActivity', suspiciousActivitySchema);

module.exports = SuspiciousActivity;
