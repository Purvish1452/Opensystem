const Post = require('../../models/Post');
const { CONTENT_TYPES } = require('../../constants');

/**
 * Feed Service - Production Grade
 * 
 * Features:
 * - Hybrid ranking algorithm (vote + recency + engagement)
 * - User personalization factor (ready for future ML)
 * - Caching readiness
 */

/**
 * Ranking weights for hybrid algorithm
 */
const RANKING_WEIGHTS = {
    VOTE_SCORE: 0.4,
    RECENCY: 0.3,
    ENGAGEMENT: 0.3
};

/**
 * Get personalized feed
 * 
 * @param {String} userId - User ID (optional)
 * @param {Object} filters - Feed filters
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Feed posts
 */
const getFeed = async (userId = null, filters = {}, pagination = {}) => {
    const { page = 1, limit = 20, contentType, tags } = filters;
    const skip = (page - 1) * limit;

    // Build filter query
    const query = {
        visibility: 'public',
        isHidden: false
    };

    if (contentType) {
        query.contentType = contentType;
    }

    if (tags && tags.length > 0) {
        query.tags = { $in: tags };
    }

    // Fetch posts
    const posts = await Post.find(query)
        .populate('author', 'username fullname profileImage')
        .sort({ createdAt: -1 }) // Initial sort by recency
        .skip(skip)
        .limit(limit * 2); // Fetch more for ranking

    // Apply hybrid ranking algorithm
    const rankedPosts = posts.map(post => {
        const score = calculateRankingScore(post, userId);
        return { post, score };
    })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.post);

    const total = await Post.countDocuments(query);

    return {
        posts: rankedPosts,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get trending posts
 * 
 * @param {String} timeWindow - Time window (24h, 7d, 30d)
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Trending posts
 */
const getTrendingPosts = async (timeWindow = '24h', pagination = {}) => {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    // Calculate time cutoff
    const timeMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
    };
    const cutoff = Date.now() - (timeMap[timeWindow] || timeMap['24h']);

    // Fetch trending posts
    const posts = await Post.find({
        visibility: 'public',
        isHidden: false,
        createdAt: { $gte: cutoff }
    })
        .populate('author', 'username fullname profileImage')
        .sort({ 'votes.voteScore': -1, 'engagement.commentCount': -1 })
        .skip(skip)
        .limit(limit);

    const total = await Post.countDocuments({
        visibility: 'public',
        isHidden: false,
        createdAt: { $gte: cutoff }
    });

    return {
        posts,
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
 * @returns {Promise<Object>} Search results
 */
const searchPosts = async (query, filters = {}, pagination = {}) => {
    const { page = 1, limit = 20, contentType, tags } = filters;
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = {
        $text: { $search: query },
        visibility: 'public',
        isHidden: false
    };

    if (contentType) {
        searchQuery.contentType = contentType;
    }

    if (tags && tags.length > 0) {
        searchQuery.tags = { $in: tags };
    }

    // Execute search
    const [posts, total] = await Promise.all([
        Post.find(searchQuery)
            .populate('author', 'username fullname profileImage')
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit),
        Post.countDocuments(searchQuery)
    ]);

    return {
        posts,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Calculate hybrid ranking score
 * 
 * @param {Object} post - Post object
 * @param {String} userId - User ID (for personalization)
 * @returns {Number} Ranking score
 */
const calculateRankingScore = (post, userId = null) => {
    // Vote score component (normalized)
    const voteScore = post.votes.voteScore / 100; // Normalize to 0-1 range
    const voteComponent = voteScore * RANKING_WEIGHTS.VOTE_SCORE;

    // Recency component (decay over time)
    const ageInHours = (Date.now() - post.createdAt) / (1000 * 60 * 60);
    const recencyScore = Math.exp(-ageInHours / 24); // Exponential decay
    const recencyComponent = recencyScore * RANKING_WEIGHTS.RECENCY;

    // Engagement component
    const totalEngagement =
        post.engagement.commentCount +
        post.engagement.bookmarkCount +
        (post.engagement.shareCount || 0);
    const engagementScore = Math.min(totalEngagement / 50, 1); // Normalize to 0-1
    const engagementComponent = engagementScore * RANKING_WEIGHTS.ENGAGEMENT;

    // TODO: User personalization factor (followed tags, interests)
    // const personalizationComponent = calculatePersonalization(post, userId);

    return voteComponent + recencyComponent + engagementComponent;
};

module.exports = {
    getFeed,
    getTrendingPosts,
    searchPosts
};
