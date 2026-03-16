const Joi = require('joi');
const { objectId } = require('./common.validator');

/**
 * Report Validators
 * JOI schemas for reporting routes
 */

// Create report validation
const createReportSchema = Joi.object({
    targetType: Joi.string().valid('Post', 'Project', 'User', 'Comment').required().messages({
        'any.only': 'Target type must be Post, Project, User, or Comment',
        'any.required': 'Target type is required'
    }),
    targetId: objectId.required().messages({
        'any.required': 'Target ID is required'
    }),
    reason: Joi.string().valid('spam', 'harassment', 'inappropriate', 'copyright', 'misinformation', 'other').required().messages({
        'any.only': 'Invalid report reason',
        'any.required': 'Reason is required'
    }),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium').messages({
        'any.only': 'Severity must be low, medium, high, or critical'
    }),
    description: Joi.string().trim().max(500).messages({
        'string.max': 'Description cannot exceed 500 characters'
    })
}).options({ stripUnknown: true });

module.exports = {
    createReportSchema,
    submitReportSchema: createReportSchema  // alias for report.routes.js
};
