const Joi = require('joi');
const { objectId, url, techStack, content, pagination } = require('./common.validator');
const { CONTENT_LIMITS } = require('../constants');

/**
 * Project Validators
 * JOI schemas for project/developer mode routes
 */

// Create project validation
const createProjectSchema = Joi.object({
    title: Joi.string().trim()
        .min(CONTENT_LIMITS.PROJECT_TITLE_MIN)
        .max(CONTENT_LIMITS.PROJECT_TITLE_MAX)
        .required()
        .messages({
            'string.min': `Title must be at least ${CONTENT_LIMITS.PROJECT_TITLE_MIN} characters`,
            'string.max': `Title cannot exceed ${CONTENT_LIMITS.PROJECT_TITLE_MAX} characters`,
            'any.required': 'Title is required'
        }),
    description: content(CONTENT_LIMITS.PROJECT_DESCRIPTION_MIN, CONTENT_LIMITS.PROJECT_DESCRIPTION_MAX).required(),
    techStack: techStack,
    githubLink: Joi.string().uri().pattern(/^https?:\/\/(www\.)?github\.com\/.+/).allow('', null).messages({
        'string.pattern.base': 'Invalid GitHub URL'
    }),
    demoLink: url.allow('', null),
    projectStage: Joi.string().valid('idea', 'prototype', 'production').required().messages({
        'any.required': 'Project stage is required'
    }),
    requirementType: Joi.string().valid('openSource', 'limitedMembers').required().messages({
        'any.required': 'Requirement type is required'
    }),
    maxMembers: Joi.number().integer().min(1).max(CONTENT_LIMITS.MAX_PROJECT_MEMBERS).when('requirementType', {
        is: 'limitedMembers',
        then: Joi.required(),
        otherwise: Joi.optional()
    }).messages({
        'number.min': 'Max members must be at least 1',
        'number.max': `Max members cannot exceed ${CONTENT_LIMITS.MAX_PROJECT_MEMBERS}`,
        'any.required': 'Max members is required for limited member projects'
    }),
    timeline: Joi.object({
        startDate: Joi.date().iso(),
        expectedEndDate: Joi.date().iso().min(Joi.ref('startDate')).messages({
            'date.min': 'Expected end date must be after start date'
        })
    }),
    rolesNeeded: Joi.array().items(
        Joi.object({
            role: Joi.string().valid('contributor', 'designer', 'backend', 'frontend', 'tester').required(),
            count: Joi.number().integer().min(1).required(),
            description: Joi.string().max(200).messages({
                'string.max': 'Role description cannot exceed 200 characters'
            })
        })
    )
}).options({ stripUnknown: true });

// Update project validation (projectId comes from URL params)
const updateProjectSchema = Joi.object({
    title: Joi.string().trim().min(CONTENT_LIMITS.PROJECT_TITLE_MIN).max(CONTENT_LIMITS.PROJECT_TITLE_MAX),
    description: content(CONTENT_LIMITS.PROJECT_DESCRIPTION_MIN, CONTENT_LIMITS.PROJECT_DESCRIPTION_MAX),
    techStack: techStack,
    githubLink: Joi.string().uri().pattern(/^https?:\/\/(www\.)?github\.com\/.+/).allow('', null),
    demoLink: url.allow('', null),
    projectStage: Joi.string().valid('idea', 'prototype', 'production'),
    projectStatus: Joi.string().valid('active', 'completed', 'archived')
}).options({ stripUnknown: true });

// Delete project validation (projectId comes from URL params)
const deleteProjectSchema = Joi.object({}).options({ stripUnknown: true });

// Get project feed validation
const getProjectFeedSchema = Joi.object({
    page: pagination.page,
    limit: pagination.limit,
    stage: Joi.string().valid('idea', 'prototype', 'production'),
    status: Joi.string().valid('active', 'completed', 'archived'),
    techStack: Joi.array().items(Joi.string())
}).options({ stripUnknown: true });

// Enroll in project validation (projectId comes from URL params)
const enrollSchema = Joi.object({
    requestedRole: Joi.string().valid('contributor', 'designer', 'backend', 'frontend', 'tester').required(),
    message: Joi.string().trim().max(300).messages({
        'string.max': 'Message cannot exceed 300 characters'
    })
}).options({ stripUnknown: true });

// Approve enrollment validation (projectId from URL params, userId from URL params)
const approveEnrollmentSchema = Joi.object({}).options({ stripUnknown: true });

// Reject enrollment validation (projectId + userId from URL params)
const rejectEnrollmentSchema = Joi.object({
    reason: Joi.string().trim().max(200)
}).options({ stripUnknown: true });

// Comment on project validation (projectId comes from URL params)
const commentOnProjectSchema = Joi.object({
    content: content(CONTENT_LIMITS.COMMENT_CONTENT_MIN, CONTENT_LIMITS.COMMENT_CONTENT_MAX).required()
}).options({ stripUnknown: true });

// Vote on project validation (projectId comes from URL params)
const voteOnProjectSchema = Joi.object({
    voteType: Joi.string().valid('upvote', 'downvote', 'neutral').required()
}).options({ stripUnknown: true });

// Report project validation (projectId comes from URL params)
const reportProjectSchema = Joi.object({
    reason: Joi.string().valid('spam', 'harassment', 'inappropriate', 'copyright', 'misinformation', 'other').required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    description: Joi.string().trim().max(500)
}).options({ stripUnknown: true });

// Search projects validation
const searchProjectsSchema = Joi.object({
    query: Joi.string().min(2).max(100).trim().required(),
    techStack: Joi.array().items(Joi.string()),
    stage: Joi.string().valid('idea', 'prototype', 'production'),
    page: pagination.page,
    limit: pagination.limit
}).options({ stripUnknown: true });

// Get trending projects validation
const getTrendingProjectsSchema = Joi.object({
    timeWindow: Joi.string().valid('24h', '7d', '30d', 'all').default('all'),
    page: pagination.page,
    limit: pagination.limit
}).options({ stripUnknown: true });

module.exports = {
    createProjectSchema,
    updateProjectSchema,
    deleteProjectSchema,
    getProjectFeedSchema,
    enrollSchema,
    approveEnrollmentSchema,
    rejectEnrollmentSchema,
    commentOnProjectSchema,
    voteOnProjectSchema,
    reportProjectSchema,
    searchProjectsSchema,
    getTrendingProjectsSchema
};
