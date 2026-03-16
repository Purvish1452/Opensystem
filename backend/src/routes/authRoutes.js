const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    refreshToken
} = require('../controllers/authController');
const {
    validateRegister,
    validateLogin,
    validateRefreshToken
} = require('../validators/authValidator');
const { protect } = require('../middlewares/authMiddleware');

/**
 * Authentication Routes
 * Defines all authentication-related endpoints
 */

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegister, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, getProfile);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', validateRefreshToken, refreshToken);

module.exports = router;
