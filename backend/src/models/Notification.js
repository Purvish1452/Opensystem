const mongoose = require('mongoose');
const { NOTIFICATION_TYPES, RETENTION } = require('../constants');

/**
 * Notification Model Schema - Phase-3 Preparation
 * Notification infrastructure for future real-time notification system
 * NOTE: This schema is prepared but NOT actively used in Phase-2
 */

const notificationSchema = new mongoose.Schema(
    {
        // Recipient
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User is required'],
            index: true
        },

        // Notification Type
        type: {
            type: String,
            required: [true, 'Notification type is required'],
            enum: Object.values(NOTIFICATION_TYPES)
        },

        // Content
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters']
        },

        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            maxlength: [500, 'Message cannot exceed 500 characters']
        },

        // Target (optional, what the notification is about)
        targetType: {
            type: String,
            enum: ['Post', 'Project', 'Comment', 'User', null]
        },

        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'targetType'
        },

        // Read Status
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },

        readAt: Date,

        // Timestamp
        createdAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        timestamps: false // Using custom createdAt field
    }
);

// ============================================
// INDEXES
// ============================================

// Unread notifications
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// All notifications
notificationSchema.index({ user: 1, createdAt: -1 });

// TTL index (auto-delete after 30 days)
notificationSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: RETENTION.NOTIFICATION_DAYS * 24 * 60 * 60 }
);

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Mark notification as read
 */
notificationSchema.methods.markAsRead = async function () {
    this.isRead = true;
    this.readAt = Date.now();
    await this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get unread count for user
 */
notificationSchema.statics.getUnreadCount = async function (userId) {
    return await this.countDocuments({
        user: userId,
        isRead: false
    });
};

/**
 * Mark all notifications as read for user
 */
notificationSchema.statics.markAllAsRead = async function (userId) {
    await this.updateMany(
        { user: userId, isRead: false },
        { $set: { isRead: true, readAt: Date.now() } }
    );
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
