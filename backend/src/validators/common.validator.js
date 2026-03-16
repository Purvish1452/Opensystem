const Joi = require('joi');
const { SECURITY_LIMITS, CONTENT_LIMITS, SEARCH } = require('../constants');

/**
 * Common Validation Patterns
 * Reusable JOI schemas for consistent validation across the application
 */

// MongoDB ObjectId validation
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ID format');

// Email validation
const email = Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required()
    .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    });

// Password validation with complexity requirements
const password = Joi.string()
    .min(SECURITY_LIMITS.PASSWORD_MIN_LENGTH)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .required()
    .messages({
        'string.min': `Password must be at least ${SECURITY_LIMITS.PASSWORD_MIN_LENGTH} characters`,
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
    });

// Username validation
const username = Joi.string()
    .min(SECURITY_LIMITS.USERNAME_MIN_LENGTH)
    .max(SECURITY_LIMITS.USERNAME_MAX_LENGTH)
    .lowercase()
    .pattern(/^[a-z0-9_]+$/)
    .required()
    .messages({
        'string.min': `Username must be at least ${SECURITY_LIMITS.USERNAME_MIN_LENGTH} characters`,
        'string.max': `Username cannot exceed ${SECURITY_LIMITS.USERNAME_MAX_LENGTH} characters`,
        'string.pattern.base': 'Username can only contain lowercase letters, numbers, and underscores',
        'any.required': 'Username is required'
    });

// Device ID validation
const deviceId = Joi.string()
    .min(10)
    .max(100)
    .required()
    .messages({
        'any.required': 'Device ID is required for security tracking'
    });

// OTP validation
const otp = Joi.string()
    .length(SECURITY_LIMITS.OTP_LENGTH)
    .pattern(/^\d+$/)
    .required()
    .messages({
        'string.length': `OTP must be exactly ${SECURITY_LIMITS.OTP_LENGTH} digits`,
        'string.pattern.base': 'OTP must contain only numbers',
        'any.required': 'OTP is required'
    });

// URL validation
const url = Joi.string()
    .uri()
    .trim()
    .messages({
        'string.uri': 'Please provide a valid URL'
    });

// Pagination validation
const pagination = {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
};

// Search query validation
const searchQuery = Joi.string()
    .min(SEARCH.MIN_LENGTH)
    .max(SEARCH.MAX_LENGTH)
    .trim()
    .required()
    .messages({
        'string.min': `Search query must be at least ${SEARCH.MIN_LENGTH} characters`,
        'string.max': `Search query cannot exceed ${SEARCH.MAX_LENGTH} characters`,
        'any.required': 'Search query is required'
    });

// Tags array validation
const tags = Joi.array()
    .items(
        Joi.string()
            .trim()
            .lowercase()
            .max(CONTENT_LIMITS.TAG_MAX_LENGTH)
            .pattern(/^[a-z0-9-_]+$/)
            .messages({
                'string.max': `Each tag cannot exceed ${CONTENT_LIMITS.TAG_MAX_LENGTH} characters`,
                'string.pattern.base': 'Tags can only contain lowercase letters, numbers, hyphens, and underscores'
            })
    )
    .max(CONTENT_LIMITS.TAGS_MAX_COUNT)
    .messages({
        'array.max': `Cannot add more than ${CONTENT_LIMITS.TAGS_MAX_COUNT} tags`
    });

// Skills array validation
const skills = Joi.array()
    .items(
        Joi.string()
            .trim()
            .max(CONTENT_LIMITS.SKILL_MAX_LENGTH)
            .messages({
                'string.max': `Each skill cannot exceed ${CONTENT_LIMITS.SKILL_MAX_LENGTH} characters`
            })
    )
    .max(CONTENT_LIMITS.SKILLS_MAX_COUNT)
    .messages({
        'array.max': `Cannot add more than ${CONTENT_LIMITS.SKILLS_MAX_COUNT} skills`
    });

// Tech stack validation
const techStack = Joi.array()
    .items(
        Joi.string()
            .trim()
            .lowercase()
            .max(50)
    )
    .max(CONTENT_LIMITS.TECH_STACK_MAX_COUNT)
    .messages({
        'array.max': `Cannot add more than ${CONTENT_LIMITS.TECH_STACK_MAX_COUNT} technologies`
    });

// Content validation (with XSS prevention)
const content = (min, max) => Joi.string()
    .trim()
    .min(min)
    .max(max)
    .pattern(/^(?!.*<script).*$/, { name: 'no-script-tags' })
    .messages({
        'string.min': `Content must be at least ${min} characters`,
        'string.max': `Content cannot exceed ${max} characters`,
        'string.pattern.name': 'Content contains prohibited HTML tags'
    });

// ObjectId schema factory — produces a Joi params schema for a named route parameter
// Usage: objectIdSchema('postId') → validates req.params.postId as a valid MongoDB ObjectId
const objectIdSchema = (paramName) =>
    Joi.object({
        [paramName]: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': `Invalid ${paramName} format`,
                'any.required': `${paramName} is required`
            })
    });

module.exports = {
    objectId,
    objectIdSchema,
    email,
    password,
    username,
    deviceId,
    otp,
    url,
    pagination,
    searchQuery,
    tags,
    skills,
    techStack,
    content
};
