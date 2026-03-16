const Joi = require('joi');
const { objectId, tags, content, pagination } = require('./common.validator');
const { CONTENT_LIMITS, FILE_UPLOAD } = require('../constants');

/**
 * Post Validators
 * JOI schemas for post/problem feed routes
 */

// Create post validation
const createPostSchema = Joi.object({
    content: content(CONTENT_LIMITS.POST_CONTENT_MIN, CONTENT_LIMITS.POST_CONTENT_MAX).required(),
    contentType: Joi.string().valid('discussion', 'problem', 'idea', 'question').default('discussion'),
    tags: tags,
    visibility: Joi.string().valid('public', 'private', 'followers').default('public'),
    allowComments: Joi.boolean().default(true),
    downloadEnabled: Joi.boolean().default(true),
    media: Joi.array().items(
        Joi.object({
            type: Joi.string().valid('image', 'video', 'code', 'document').required(),
            url: Joi.string().uri().required(),
            filename: Joi.string(),
            size: Joi.number().integer(),
            mimeType: Joi.string(),
            cloudinaryId: Joi.string(),
            thumbnail: Joi.string().uri(),
            duration: Joi.number(),
            fileHash: Joi.string()
        })
    ).max(FILE_UPLOAD.MAX_MEDIA_PER_POST).messages({
        'array.max': `Cannot upload more than ${FILE_UPLOAD.MAX_MEDIA_PER_POST} media files`
    }),
    codeSnippets: Joi.array().items(
        Joi.object({
            language: Joi.string().required(),
            code: Joi.string().max(10000).required().messages({
                'string.max': 'Code snippet cannot exceed 10000 characters'
            }),
            filename: Joi.string()
        })
    ).max(FILE_UPLOAD.MAX_CODE_SNIPPETS_PER_POST).messages({
        'array.max': `Cannot add more than ${FILE_UPLOAD.MAX_CODE_SNIPPETS_PER_POST} code snippets`
    })
}).options({ stripUnknown: true });

// Get feed validation
const getFeedSchema = Joi.object({
    page: pagination.page,
    limit: pagination.limit,
    contentType: Joi.string().valid('discussion', 'problem', 'idea', 'question'),
    tags: Joi.array().items(Joi.string()),
    userType: Joi.string().valid('student', 'professional')
}).options({ stripUnknown: true });

// Get post by ID validation
const getPostByIdSchema = Joi.object({
    postId: objectId.required()
}).options({ stripUnknown: true });

// Hide post validation
const hidePostSchema = Joi.object({
    postId: objectId.required()
}).options({ stripUnknown: true });

// Vote validation (postId comes from URL params, not body)
const voteSchema = Joi.object({
    voteType: Joi.string().valid('upvote', 'downvote', 'neutral').required().messages({
        'any.only': 'Vote type must be upvote, downvote, or neutral',
        'any.required': 'Vote type is required'
    })
}).options({ stripUnknown: true });

// Comment on post validation (postId comes from URL params, not body)
const commentOnPostSchema = Joi.object({
    content: content(CONTENT_LIMITS.COMMENT_CONTENT_MIN, CONTENT_LIMITS.COMMENT_CONTENT_MAX).required()
}).options({ stripUnknown: true });

// Report post validation
// Report post validation (postId comes from URL params, not body)
const reportPostSchema = Joi.object({
    reason: Joi.string().valid('spam', 'harassment', 'inappropriate', 'copyright', 'misinformation', 'other').required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    description: Joi.string().trim().max(500).messages({
        'string.max': 'Description cannot exceed 500 characters'
    })
}).options({ stripUnknown: true });

// Search posts validation
const searchPostsSchema = Joi.object({
    query: Joi.string().min(2).max(100).trim().required(),
    tags: Joi.array().items(Joi.string()),
    contentType: Joi.string().valid('discussion', 'problem', 'idea', 'question'),
    page: pagination.page,
    limit: pagination.limit
}).options({ stripUnknown: true });

// Get trending posts validation
const getTrendingSchema = Joi.object({
    timeWindow: Joi.string().valid('24h', '7d', '30d', 'all').default('all'),
    page: pagination.page,
    limit: pagination.limit
}).options({ stripUnknown: true });

module.exports = {
    createPostSchema,
    getFeedSchema,
    getPostByIdSchema,
    hidePostSchema,
    voteSchema,
    commentOnPostSchema,
    reportPostSchema,
    searchPostsSchema,
    getTrendingSchema
};
