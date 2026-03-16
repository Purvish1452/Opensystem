const Joi = require('joi');
const { LINK_TYPES, TECH_STACK, EXPERTISE_TAGS, DOMAIN_TAGS, PROFILE_LIMITS } = require('../constants');

/**
 * Profile Validator
 * Joi schemas for Professional Profile System (Phase-3)
 *
 * Security:
 *   - All URLs must be https:// (no http, javascript:, data:)
 *   - Private IP ranges blocked (SSRF prevention)
 *   - Enum validation on tech stack, expertise, domains
 */

// ─── Shared URL Validator ────────────────────────────────────────────────────

// Private IP / localhost patterns to block (SSRF prevention)
const BLOCKED_PATTERNS = [
    /^https?:\/\/localhost/i,
    /^https?:\/\/127\./,
    /^https?:\/\/192\.168\./,
    /^https?:\/\/10\./,
    /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
    /^https?:\/\/::1/,
    /^https?:\/\/0\.0\.0\.0/,
];

const validateSafeUrl = (value, helpers) => {
    // Must be https
    if (!/^https:\/\/.+/.test(value)) {
        return helpers.error('any.invalid', { message: 'URL must start with https://' });
    }
    // Block private IPs / localhost (SSRF prevention)
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(value)) {
            return helpers.error('any.invalid', { message: 'Private or local URLs are not allowed' });
        }
    }
    // Block dangerous schemes embedded in URL
    if (/javascript:|data:|vbscript:/i.test(value)) {
        return helpers.error('any.invalid', { message: 'Dangerous URL scheme detected' });
    }
    return value;
};

const safeUrl = Joi.string()
    .uri({ scheme: ['https'] })
    .max(500)
    .custom(validateSafeUrl)
    .messages({
        'string.uri': 'Must be a valid https:// URL',
        'string.max': 'URL cannot exceed 500 characters'
    });

// ─── Link Schemas ─────────────────────────────────────────────────────────────

const addLinkSchema = Joi.object({
    type: Joi.string()
        .valid(...Object.values(LINK_TYPES))
        .required()
        .messages({
            'any.only': `Link type must be one of: ${Object.values(LINK_TYPES).join(', ')}`,
            'any.required': 'Link type is required'
        }),
    url: safeUrl.required().messages({
        'any.required': 'URL is required'
    }),
    title: Joi.when('type', {
        is: LINK_TYPES.CUSTOM,
        then: Joi.string().trim().max(PROFILE_LIMITS.LINK_TITLE_MAX).required().messages({
            'any.required': 'Title is required for custom links',
            'string.max': `Title cannot exceed ${PROFILE_LIMITS.LINK_TITLE_MAX} characters`
        }),
        otherwise: Joi.string().trim().max(PROFILE_LIMITS.LINK_TITLE_MAX).optional().allow('', null)
    }),
    isPublic: Joi.boolean().default(true)
}).options({ stripUnknown: true });

const updateLinkSchema = Joi.object({
    url: safeUrl.optional(),
    title: Joi.string().trim().max(PROFILE_LIMITS.LINK_TITLE_MAX).optional().allow('', null),
    isPublic: Joi.boolean().optional()
}).custom((value, helpers) => {
    if (Object.keys(value).length === 0) {
        return helpers.error('object.min', { message: 'Provide at least one field to update: url, title, or isPublic' });
    }
    return value;
}).messages({
    'object.min': 'Provide at least one field to update: url, title, or isPublic'
}).options({ stripUnknown: true });

// ─── Project Schemas ──────────────────────────────────────────────────────────

const createProjectSchema = Joi.object({
    title: Joi.string()
        .trim()
        .min(2)
        .max(PROFILE_LIMITS.PROJECT_TITLE_MAX)
        .required()
        .messages({
            'string.min': 'Title must be at least 2 characters',
            'string.max': `Title cannot exceed ${PROFILE_LIMITS.PROJECT_TITLE_MAX} characters`,
            'any.required': 'Project title is required'
        }),
    description: Joi.string()
        .trim()
        .min(10)
        .max(PROFILE_LIMITS.PROJECT_DESC_MAX)
        .required()
        .messages({
            'string.min': 'Description must be at least 10 characters',
            'string.max': `Description cannot exceed ${PROFILE_LIMITS.PROJECT_DESC_MAX} characters`,
            'any.required': 'Project description is required'
        }),
    githubUrl: safeUrl.optional().allow('', null),
    deployedUrl: safeUrl.optional().allow('', null),
    techStack: Joi.array()
        .items(Joi.string().valid(...Object.values(TECH_STACK)))
        .max(PROFILE_LIMITS.MAX_TECH_STACK_PER_PROJECT)
        .default([])
        .messages({
            'any.only': 'One or more tech stack values are invalid',
            'array.max': `Tech stack cannot exceed ${PROFILE_LIMITS.MAX_TECH_STACK_PER_PROJECT} items`
        }),
    skillsAcquired: Joi.array()
        .items(Joi.string().trim().max(50))
        .max(PROFILE_LIMITS.MAX_SKILLS_ACQUIRED_PER_PROJECT)
        .default([])
        .messages({
            'array.max': `Skills acquired cannot exceed ${PROFILE_LIMITS.MAX_SKILLS_ACQUIRED_PER_PROJECT} items`
        }),
    status: Joi.string()
        .valid('ongoing', 'completed', 'archived')
        .default('ongoing'),
    startDate: Joi.date().iso().optional().allow(null),
    endDate: Joi.date().iso().optional().allow(null).custom((value, helpers) => {
        if (!value) return value;
        const { startDate } = helpers.state.ancestors[0];
        if (startDate && value < new Date(startDate)) {
            return helpers.error('date.min', { message: 'End date must be after start date' });
        }
        return value;
    }).messages({
        'date.min': 'End date must be after start date'
    }),
    isPublic: Joi.boolean().default(true)
}).options({ stripUnknown: true });

const updateProjectSchema = createProjectSchema.fork(
    ['title', 'description'],
    field => field.optional()
).custom((value, helpers) => {
    if (Object.keys(value).length === 0) {
        return helpers.error('object.min');
    }
    return value;
}).messages({
    'object.min': 'Provide at least one field to update'
});

// ─── Expertise / Domains Schemas ──────────────────────────────────────────────

const updateExpertiseSchema = Joi.object({
    expertise: Joi.array()
        .items(
            Joi.string()
                .trim()
                .lowercase()
                .max(50)
                .valid(...Object.values(EXPERTISE_TAGS))
                .messages({ 'any.only': 'One or more expertise tags are invalid' })
        )
        .max(PROFILE_LIMITS.MAX_EXPERTISE)
        .required()
        .messages({
            'array.max': `Maximum ${PROFILE_LIMITS.MAX_EXPERTISE} expertise tags allowed`,
            'any.required': 'Expertise array is required'
        })
}).options({ stripUnknown: true });

const updateDomainsSchema = Joi.object({
    domains: Joi.array()
        .items(
            Joi.string()
                .trim()
                .lowercase()
                .max(50)
                .valid(...Object.values(DOMAIN_TAGS))
                .messages({ 'any.only': 'One or more domain values are invalid' })
        )
        .max(PROFILE_LIMITS.MAX_DOMAINS)
        .required()
        .messages({
            'array.max': `Maximum ${PROFILE_LIMITS.MAX_DOMAINS} domains allowed`,
            'any.required': 'Domains array is required'
        })
}).options({ stripUnknown: true });

module.exports = {
    addLinkSchema,
    updateLinkSchema,
    createProjectSchema,
    updateProjectSchema,
    updateExpertiseSchema,
    updateDomainsSchema,
    safeUrl          // exported for reuse in other validators
};
