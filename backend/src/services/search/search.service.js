const User = require('../../models/User');
const Post = require('../../models/Post');
const Project = require('../../models/Project');
const { logActivity } = require('../activity/activity.service');
const { ACTIVITY_TYPES } = require('../../constants');

/**
 * Search Service - Production Grade
 * 
 * Features:
 * - Case-insensitive $regex search (substring match for all entity types)
 * - Search analytics logging
 * - Pagination optimization
 */

/**
 * Search users
 * 
 * @param {String} query - Search query
 * @param {Object} filters - Search filters
 * @param {Object} pagination - Pagination options
 * @param {String} userId - User ID (for analytics)
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Search results
 */
const searchUsers = async (query, filters = {}, pagination = {}, userId = null, req = {}) => {
    const { userType } = filters;
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    // Build regex for case-insensitive partial/prefix matching
    // $text only matches whole words — "yugm" won't match "yugmchaudhary"
    const searchRegex = new RegExp(query, 'i');

    const matchStage = {
        $or: [
            { username: searchRegex },
            { 'fullname.firstName': searchRegex },
            { 'fullname.lastName': searchRegex },
            { bio: searchRegex },
            { skills: searchRegex }
        ]
    };
    if (userType) matchStage.userType = userType;

    const pipeline = [
        { $match: matchStage },
        { $sort: { followersCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: Number(limit) },
        {
            $project: {
                username: 1, fullname: 1, profileImage: 1,
                bio: 1, userType: 1, skills: 1,
                followersCount: 1, followingCount: 1,
                accountStatus: 1, createdAt: 1
            }
        }
    ];

    const [users, countResult] = await Promise.all([
        User.aggregate(pipeline),
        User.aggregate([{ $match: matchStage }, { $count: 'total' }])
    ]);

    const total = countResult[0]?.total || 0;

    // Log search analytics
    if (userId) {
        logActivity(userId, ACTIVITY_TYPES.SEARCH, null, null, req, {
            searchType: 'users',
            query,
            resultsCount: total
        });
    }

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};


/**
 * Search posts
 * 
 * @param {String} query - Search query
 * @param {Object} filters - Search filters
 * @param {Object} pagination - Pagination options
 * @param {String} userId - User ID (for analytics)
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Search results
 */
const searchPosts = async (query, filters = {}, pagination = {}, userId = null, req = {}) => {
    const { contentType, tags } = filters;
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const searchRegex = new RegExp(query, 'i');

    // Build search query using regex for substring matching
    const searchQuery = {
        $or: [
            { title: searchRegex },
            { content: searchRegex },
            { tags: searchRegex }
        ],
        visibility: 'public',
        isHidden: { $ne: true }   // match docs where isHidden is false OR missing
    };

    if (contentType) searchQuery.contentType = contentType;
    if (tags && tags.length > 0) searchQuery.tags = { $in: tags };

    const [posts, total] = await Promise.all([
        Post.find(searchQuery)
            .populate('author', 'username fullname profileImage')
            .sort({ 'votes.voteScore': -1, createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Post.countDocuments(searchQuery)
    ]);

    if (userId) {
        logActivity(userId, ACTIVITY_TYPES.SEARCH, null, null, req, {
            searchType: 'posts', query, resultsCount: total
        });
    }

    return {
        posts,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
};

/**
 * Search projects
 * 
 * @param {String} query - Search query
 * @param {Object} filters - Search filters
 * @param {Object} pagination - Pagination options
 * @param {String} userId - User ID (for analytics)
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Search results
 */
const searchProjects = async (query, filters = {}, pagination = {}, userId = null, req = {}) => {
    const { projectStage, status, techStack } = filters;
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const searchRegex = new RegExp(query, 'i');

    // Build search query using regex for substring matching
    const searchQuery = {
        $or: [
            { title: searchRegex },
            { description: searchRegex },
            { techStack: searchRegex }
        ],
        isDeleted: { $ne: true }  // match docs where isDeleted is false OR missing
    };

    if (projectStage) searchQuery.projectStage = projectStage;
    if (status) searchQuery.status = status;
    if (techStack && techStack.length > 0) searchQuery.techStack = { $in: techStack };

    const [projects, total] = await Promise.all([
        Project.find(searchQuery)
            .populate('owner', 'username fullname profileImage')
            .sort({ 'votes.voteScore': -1, createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Project.countDocuments(searchQuery)
    ]);

    if (userId) {
        logActivity(userId, ACTIVITY_TYPES.SEARCH, null, null, req, {
            searchType: 'projects', query, resultsCount: total
        });
    }

    return {
        projects,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
};


/**
 * Normalize rankings to prevent spam boosting
 * Ensures fair distribution of scores
 * 
 * @param {Array} results - Search results
 * @returns {Array} Normalized results
 */
const normalizeRankings = (results) => {
    if (results.length === 0) return results;

    // Find min and max scores
    const scores = results.map(r => r._doc?.score || 0);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // Normalize to 0-1 range
    if (maxScore === minScore) return results;

    return results.map(result => {
        const score = result._doc?.score || 0;
        const normalizedScore = (score - minScore) / (maxScore - minScore);

        return {
            ...result._doc,
            searchScore: normalizedScore
        };
    });
};

module.exports = {
    searchUsers,
    searchPosts,
    searchProjects
};
