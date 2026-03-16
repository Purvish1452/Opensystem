const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { validateBody } = require('../middlewares/validate.middleware');
const sanitizeMiddleware = require('../middlewares/sanitize.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');
const { protect } = require('../middlewares/authMiddleware');
const authController = require('../controllers/auth.controller');
const {
    registerSchema,
    loginSchema,
    logoutSchema,
    verifyEmailSchema,
    verifyOtpSchema,
    resendOtpSchema
} = require('../validators/auth.validator');

/**
 * Authentication Routes
 * All routes under /api/v1/auth
 *
 * Manual auth:
 *   POST /register       — Register with email + password
 *   POST /login          — Login with email + password
 *   POST /logout         — Logout from current device
 *   POST /logout-all     — Logout from all devices
 *   POST /verify-email   — Verify email via token
 *   POST /verify-otp     — Verify 6-digit OTP (works for ALL signup methods)
 *   POST /resend-otp     — Resend OTP to email
 *
 * Google OAuth:
 *   GET  /google          — Initiate Google OAuth
 *   GET  /google/callback — Google OAuth callback
 *
 * GitHub OAuth:
 *   GET  /github          — Initiate GitHub OAuth
 *   GET  /github/callback — GitHub OAuth callback
 */

// ─── MANUAL AUTHENTICATION ──────────────────────────────────────────────────

// @route   POST /api/v1/auth/register
// @desc    Register new user manually
// @access  Public
router.post(
    '/register',
    authLimiter,
    sanitizeMiddleware,
    validateBody(registerSchema),
    authController.register
);

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post(
    '/login',
    authLimiter,
    sanitizeMiddleware,
    validateBody(loginSchema),
    authController.login
);

// @route   POST /api/v1/auth/logout
// @desc    Logout user from current device
// @access  Private
router.post(
    '/logout',
    protect,
    sanitizeMiddleware,
    validateBody(logoutSchema),
    authController.logout
);

// @route   POST /api/v1/auth/logout-all
// @desc    Logout user from all devices
// @access  Private
router.post(
    '/logout-all',
    protect,
    authController.logoutAll
);

// @route   POST /api/v1/auth/verify-email
// @desc    Verify email with token (legacy)
// @access  Public
router.post(
    '/verify-email',
    sanitizeMiddleware,
    validateBody(verifyEmailSchema),
    authController.verifyEmail
);

// @route   POST /api/v1/auth/verify-otp
// @desc    Verify OTP — works for manual, Google, AND GitHub signups
// @access  Public
router.post(
    '/verify-otp',
    authLimiter,
    sanitizeMiddleware,
    validateBody(verifyOtpSchema),
    authController.verifyOTP
);

// @route   POST /api/v1/auth/resend-otp
// @desc    Resend OTP to registered email
// @access  Public
router.post(
    '/resend-otp',
    authLimiter,
    sanitizeMiddleware,
    validateBody(resendOtpSchema),
    authController.resendOTP
);

// ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────────

// @route   GET /api/v1/auth/google
// @desc    Initiate Google OAuth flow
// @access  Public
router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })
);

// @route   GET /api/v1/auth/google/callback
// @desc    Google OAuth callback — redirects to client with JWT
// @access  Public
router.get(
    '/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/error?provider=google`
    }),
    authController.googleCallback
);

// ─── GITHUB OAUTH ─────────────────────────────────────────────────────────────

// @route   GET /api/v1/auth/github
// @desc    Initiate GitHub OAuth flow
// @access  Public
router.get(
    '/github',
    passport.authenticate('github', {
        scope: ['user:email'],
        session: false
    })
);

// @route   GET /api/v1/auth/github/callback
// @desc    GitHub OAuth callback — redirects to client with JWT
// @access  Public
router.get(
    '/github/callback',
    passport.authenticate('github', {
        session: false,
        failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/error?provider=github`
    }),
    authController.githubCallback
);

module.exports = router;
