const { STATUS_CODES } = require('../constants');

/**
 * Standard API Response Formatter
 * Ensures consistent response structure across all endpoints
 */

/**
 * Success Response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Object} data - Response data
 */
const successResponse = (res, statusCode = STATUS_CODES.OK, message = 'Success', data = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * Error Response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Object} errors - Validation errors or additional error details
 */
const errorResponse = (res, statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR, message = 'Error', errors = null) => {
    const response = {
        success: false,
        message
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Paginated Response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Object} data - Response data
 * @param {Object} pagination - Pagination metadata
 */
const paginatedResponse = (res, statusCode = STATUS_CODES.OK, message = 'Success', data = [], pagination = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            total: pagination.total || 0,
            totalPages: pagination.totalPages || 0
        }
    });
};

module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse
};
