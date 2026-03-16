const Joi = require('joi');
const { objectId, content } = require('./common.validator');
const { CONTENT_LIMITS } = require('../constants');

/**
 * Comment Validators
 * JOI schemas for comment routes
 */

// Create comment validation
const createCommentSchema = Joi.object({
    parentType: Joi.string().valid('Post', 'Project', 'Comment').required().messages({
        'any.only': 'Parent type must be Post, Project, or Comment',
        'any.required': 'Parent type is required'
    }),
    parentId: objectId.required().messages({
        'any.required': 'Parent ID is required'
    }),
    content: content(CONTENT_LIMITS.COMMENT_CONTENT_MIN, CONTENT_LIMITS.COMMENT_CONTENT_MAX).required(),
    parentComment: objectId.allow(null).messages({
        'string.pattern.name': 'Invalid parent comment ID'
    })
}).options({ stripUnknown: true });

// Update comment validation (commentId comes from URL params)
const updateCommentSchema = Joi.object({
    content: content(CONTENT_LIMITS.COMMENT_CONTENT_MIN, CONTENT_LIMITS.COMMENT_CONTENT_MAX).required()
}).options({ stripUnknown: true });

// Delete comment validation (commentId comes from URL params)
const deleteCommentSchema = Joi.object({}).options({ stripUnknown: true });

// Get comments validation (parentType and parentId come as query params for GET)
const getCommentsSchema = Joi.object({
    parentType: Joi.string().valid('Post', 'Project').required().messages({
        'any.only': 'Parent type must be Post or Project',
        'any.required': 'Parent type is required'
    }),
    parentId: objectId.required().messages({
        'any.required': 'Parent ID is required'
    }),
    maxDepth: Joi.number().integer().min(0).max(CONTENT_LIMITS.MAX_COMMENT_DEPTH).default(CONTENT_LIMITS.MAX_COMMENT_DEPTH)
}).options({ stripUnknown: true });

module.exports = {
    createCommentSchema,
    updateCommentSchema,
    deleteCommentSchema,
    getCommentsSchema
};
