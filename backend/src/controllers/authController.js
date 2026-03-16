const asyncHandler = require('../middlewares/asyncHandler');
const authService = require('../services/authService');
const { successResponse } = require('../utils/apiResponse');
const { STATUS_CODES, MESSAGES } = require('../constants');

/**
 * Authentication Controllers
 * Handle HTTP requests for authentication endpoints
 * Delegates business logic to service layer
 */

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);

    successResponse(
        res,
        STATUS_CODES.CREATED,
        MESSAGES.USER_CREATED,
        result
    );
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    successResponse(
        res,
        STATUS_CODES.OK,
        MESSAGES.LOGIN_SUCCESS,
        result
    );
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
    const user = await authService.getUserById(req.user.id);

    successResponse(
        res,
        STATUS_CODES.OK,
        'Profile retrieved successfully',
        { user }
    );
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);

    successResponse(
        res,
        STATUS_CODES.OK,
        'Token refreshed successfully',
        tokens
    );
});

module.exports = {
    register,
    login,
    getProfile,
    refreshToken
};
