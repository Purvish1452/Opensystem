const Joi = require('joi');
const { ADMIN_SECURITY } = require('../../constants');

/**
 * Admin Validators — Phase-4 / Phase-6 (Post & Project CRUD)
 * Joi schemas for all admin route request bodies.
 */

// Suspend user
const suspendSchema = Joi.object({
    reason: Joi.string().trim().min(5).max(500).required()
        .messages({ 'any.required': 'A reason is required to suspend an account' })
});

// Unlock user
const unlockSchema = Joi.object({
    reason: Joi.string().trim().max(500).optional()
});

// Force logout
const forceLogoutSchema = Joi.object({
    reason: Joi.string().trim().max(500).optional()
});

// Manual risk score adjustment
const adjustRiskSchema = Joi.object({
    delta: Joi.number()
        .min(-ADMIN_SECURITY.MAX_RISK_DELTA)
        .max(ADMIN_SECURITY.MAX_RISK_DELTA)
        .integer()
        .required()
        .messages({
            'number.min': `Delta cannot be less than -${ADMIN_SECURITY.MAX_RISK_DELTA}`,
            'number.max': `Delta cannot exceed +${ADMIN_SECURITY.MAX_RISK_DELTA}`
        }),
    reason: Joi.string().trim().max(300).optional()
});

// Resolve suspicious flag
const resolveSchema = Joi.object({
    note: Joi.string().trim().max(300).optional()
});

// ─── Post CRUD Schemas ────────────────────────────────────────────────────────

// Admin create post (on behalf of a user)
const adminCreatePostSchema = Joi.object({
    targetUserId: Joi.string().hex().length(24).required()
        .messages({ 'any.required': 'targetUserId is required to specify the post author' }),
    content: Joi.string().trim().min(1).max(5000).required()
        .messages({ 'any.required': 'Post content is required' }),
    contentType: Joi.string()
        .valid('discussion', 'problem', 'idea', 'question')
        .default('discussion'),
    tags: Joi.array().items(Joi.string().trim().lowercase().max(30)).max(10).default([]),
    visibility: Joi.string().valid('public', 'private', 'followers').default('public')
});

// Admin update post (any field)
const adminUpdatePostSchema = Joi.object({
    content: Joi.string().trim().min(1).max(5000).optional(),
    contentType: Joi.string()
        .valid('discussion', 'problem', 'idea', 'question')
        .optional(),
    tags: Joi.array().items(Joi.string().trim().lowercase().max(30)).max(10).optional(),
    visibility: Joi.string().valid('public', 'private', 'followers').optional(),
    isHidden: Joi.boolean().optional(),
    allowComments: Joi.boolean().optional(),
    moderationStatus: Joi.string()
        .valid('pending', 'approved', 'rejected', 'flagged')
        .optional(),
    reason: Joi.string().trim().max(500).optional()
});

// ─── Project CRUD Schemas ─────────────────────────────────────────────────────

// Admin create project (on behalf of a user)
const adminCreateProjectSchema = Joi.object({
    targetUserId: Joi.string().hex().length(24).required()
        .messages({ 'any.required': 'targetUserId is required to specify the project owner' }),
    title: Joi.string().trim().min(5).max(100).required()
        .messages({ 'any.required': 'Project title is required' }),
    description: Joi.string().trim().min(10).max(2000).required()
        .messages({ 'any.required': 'Project description is required' }),
    techStack: Joi.array().items(Joi.string().trim()).max(15).default([]),
    links: Joi.array().items(Joi.object({
        type: Joi.string().optional(),
        url: Joi.string().uri().required(),
        title: Joi.string().max(60).optional()
    })).optional(),
    projectStage: Joi.string().valid('idea', 'prototype', 'production').default('idea'),
    requirementType: Joi.string().valid('openSource', 'limitedMembers').optional(),
    maxMembers: Joi.number().integer().min(1).max(100).default(10),
    timeline: Joi.string().trim().max(200).optional(),
    rolesNeeded: Joi.array().items(Joi.string().trim()).max(20).default([])
});

// Admin update project (any field)
const adminUpdateProjectSchema = Joi.object({
    title: Joi.string().trim().min(5).max(100).optional(),
    description: Joi.string().trim().min(10).max(2000).optional(),
    techStack: Joi.array().items(Joi.string().trim()).max(15).optional(),
    links: Joi.array().items(Joi.object({
        type: Joi.string().optional(),
        url: Joi.string().uri().required(),
        title: Joi.string().max(60).optional()
    })).optional(),
    projectStage: Joi.string().valid('idea', 'prototype', 'production').optional(),
    status: Joi.string().valid('open', 'active', 'completed', 'archived').optional(),
    requirementType: Joi.string().valid('openSource', 'limitedMembers').optional(),
    maxMembers: Joi.number().integer().min(1).max(100).optional(),
    timeline: Joi.string().trim().max(200).optional(),
    rolesNeeded: Joi.array().items(Joi.string().trim()).max(20).optional(),
    reason: Joi.string().trim().max(500).optional()
});

// Reason schema (for DELETE + other reason-only bodies)
const reasonSchema = Joi.object({
    reason: Joi.string().trim().min(3).max(500).optional()
});

/**
 * Validate helper — throws formatted AppError on failure
 */
const validate = (schema, data) => {
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
    if (error) {
        const message = error.details.map(d => d.message).join('; ');
        const AppError = require('../../utils/AppError');
        const { STATUS_CODES } = require('../../constants');
        throw new AppError(message, STATUS_CODES.BAD_REQUEST);
    }
    return value;
};

module.exports = {
    suspendSchema,
    unlockSchema,
    forceLogoutSchema,
    adjustRiskSchema,
    resolveSchema,
    // Post CRUD
    adminCreatePostSchema,
    adminUpdatePostSchema,
    // Project CRUD
    adminCreateProjectSchema,
    adminUpdateProjectSchema,
    // Shared
    reasonSchema,
    validate
};

