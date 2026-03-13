const Post = require('../../models/Post');
const AppError = require('../../utils/AppError');
const { logActivity, detectRapidVoting } = require('../activity/activity.service');
const { ACTIVITY_TYPES, VOTE_TYPES } = require('../../constants');

/**
 * Vote Service - Production Grade
 * 
 * Features:
 * - Idempotency enforcement (same vote doesn't double count)
 * - Rapid voting detection
 */

/**
 * Vote on post
 * 
 * @param {String} userId - User ID
 * @param {String} postId - Post ID
 * @param {String} voteType - Vote type (upvote/downvote/neutral)
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Updated post
 */
const voteOnPost = async (userId, postId, voteType, req) => {
    const post = await Post.findById(postId);

    if (!post) {
        throw AppError.notFoundError('Post', 'POST_NOT_FOUND');
    }

    // Check for rapid voting
    const rapidVoteCheck = await detectRapidVoting(userId);
    if (rapidVoteCheck.isAbuse) {
        throw AppError.rateLimitError(
            'Too many votes in a short time. Please slow down.',
            'RAPID_VOTING'
        );
    }

    // Idempotency check: Get current vote
    const existingVote = post.votes.voters.find(v => v.user.toString() === userId);

    // If same vote type, do nothing (idempotent)
    if (existingVote && existingVote.voteType === voteType) {
        return post;
    }

    // Add or update vote
    await post.addVote(userId, voteType);

    // Log activity
    logActivity(userId, ACTIVITY_TYPES.VOTE, 'Post', postId, req, {
        voteType,
        previousVote: existingVote?.voteType || 'none'
    });

    return post;
};

module.exports = {
    voteOnPost
};
