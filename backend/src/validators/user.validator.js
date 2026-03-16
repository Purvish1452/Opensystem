const Joi = require('joi');
const { objectId, url, skills, password } = require('./common.validator');
const { CONTENT_LIMITS } = require('../constants');

/**
 * User Validators
 * JOI schemas for user profile routes
 */

// Update profile validation
const updateProfileSchema = Joi.object({
    firstName: Joi.string().trim().min(2).max(30).messages({
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 30 characters'
    }),
    middleName: Joi.string().trim().max(30).allow('', null),
    lastName: Joi.string().trim().min(2).max(30).messages({
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name cannot exceed 30 characters'
    }),
    age: Joi.number().integer().min(13).max(120).messages({
        'number.min': 'You must be at least 13 years old',
        'number.max': 'Invalid age'
    }),
    profession: Joi.string().trim().max(100).allow('', null),
    collegeOrCompany: Joi.string().trim().max(100).allow('', null),
    profileImage: url.allow('', null),
    bio: Joi.string().trim().max(CONTENT_LIMITS.BIO_MAX).allow('', null).messages({
        'string.max': `Bio cannot exceed ${CONTENT_LIMITS.BIO_MAX} characters`
    }),
    userType: Joi.string().valid('student', 'professional')
}).options({ stripUnknown: true });

// Update password validation
const updatePasswordSchema = Joi.object({
    currentPassword: Joi.string().required().messages({
        'any.required': 'Current password is required'
    }),
    newPassword: password
}).options({ stripUnknown: true });

// Update skills validation
const updateSkillsSchema = Joi.object({
    skills: skills.required().messages({
        'any.required': 'Skills array is required'
    })
}).options({ stripUnknown: true });

// Search users validation
const searchUsersSchema = Joi.object({
    query: Joi.string().min(2).max(100).trim().required().messages({
        'string.min': 'Search query must be at least 2 characters',
        'any.required': 'Search query is required'
    }),
    userType: Joi.string().valid('student', 'professional'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
}).options({ stripUnknown: true });

module.exports = {
    updateProfileSchema,
    updatePasswordSchema,
    updateSkillsSchema,
    searchUsersSchema
};
