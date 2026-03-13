const Project = require('../../models/Project');
const AppError = require('../../utils/AppError');
const { logActivity, detectRapidVoting } = require('../activity/activity.service');
const { ACTIVITY_TYPES } = require('../../constants');

/**
 * Project Vote Service - Production Grade
 * Mirrors post vote logic for consistency
 */

/**
 * Vote on project
 * 
 * @param {String} userId - User ID
 * @param {String} projectId - Project ID
 * @param {String} voteType - Vote type (upvote/downvote/neutral)
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Updated project
 */
const voteOnProject = async (userId, projectId, voteType, req) => {
    const project = await Project.findById(projectId);

    if (!project) {
        throw AppError.notFoundError('Project', 'PROJECT_NOT_FOUND');
    }

    // Check for rapid voting
    const rapidVoteCheck = await detectRapidVoting(userId);
    if (rapidVoteCheck.isAbuse) {
        throw AppError.rateLimitError(
            'Too many votes in a short time. Please slow down.',
            'RAPID_VOTING'
        );
    }

    // Idempotency check
    const existingVote = project.votes.voters.find(v => v.user.toString() === userId);

    // If same vote type, do nothing (idempotent)
    if (existingVote && existingVote.voteType === voteType) {
        return project;
    }

    // Add or update vote
    await project.addVote(userId, voteType);

    // Log activity
    logActivity(userId, ACTIVITY_TYPES.VOTE, 'Project', projectId, req, {
        voteType,
        previousVote: existingVote?.voteType || 'none'
    });

    return project;
};

module.exports = {
    voteOnProject
};
