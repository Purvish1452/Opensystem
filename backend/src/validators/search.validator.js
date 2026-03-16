const Joi = require('joi');
const { searchQuery, pagination } = require('./common.validator');

/**
 * Search Validators
 * JOI schemas for search routes
 */

// Search users validation
const searchUsersSchema = Joi.object({
    query: searchQuery,
    userType: Joi.string().valid('student', 'professional'),
    page: pagination.page,
    limit: pagination.limit
}).options({ stripUnknown: true });

// Search posts validation
const searchPostsSchema = Joi.object({
    query: searchQuery,
    tags: Joi.array().items(Joi.string()),
    contentType: Joi.string().valid('discussion', 'problem', 'idea', 'question'),
    page: pagination.page,
    limit: pagination.limit
}).options({ stripUnknown: true });

// Search projects validation
const searchProjectsSchema = Joi.object({
    query: searchQuery,
    techStack: Joi.array().items(Joi.string()),
    stage: Joi.string().valid('idea', 'prototype', 'production'),
    status: Joi.string().valid('active', 'completed', 'archived'),
    page: pagination.page,
    limit: pagination.limit
}).options({ stripUnknown: true });

module.exports = {
    searchUsersSchema,
    searchPostsSchema,
    searchProjectsSchema
};
