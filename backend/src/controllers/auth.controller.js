const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth/auth.service');
const otpService = require('../services/auth/otp.service');
const sessionService = require('../services/auth/session.service');
const { handleGoogleCallback } = require('../services/auth/google.oauth.service');
const { handleGitHubCallback } = require('../services/auth/github.oauth.service');
const { ACCOUNT_STATUS } = require('../constants');

/**
 * Auth Controller
 * Thin layer — only handles request/response formatting.
 * All business logic lives in services.
 */

// ─── MANUAL AUTH ──────────────────────────────────────────────────────────────

/**
 * Register new user (manual)
 * POST /api/v1/auth/register
 */
const register = catchAsync(async (req, res) => {
    const { username, email, password, firstName, lastName, age, profession, userType, deviceId } = req.body;

    const result = await authService.registerUser(
        { username, email, password, firstName, lastName, age, profession, userType },
        deviceId,
        req
    );

    res.status(201).json({
        success: true,
        message: result.message || 'User registered successfully. Check your email for the OTP.',
        data: {
            user: result.user,
            tokens: result.tokens,
            // Only present in dev mode (no SMTP configured)
            ...(result.otp ? { otp: result.otp, devModeNote: 'OTP shown because SMTP is not configured' } : {})
        }
    });
}, 'controller');

/**
 * Login user
 * POST /api/v1/auth/login
 */
const login = catchAsync(async (req, res) => {
    const { email, password, deviceId } = req.body;

    const result = await authService.loginUser(email, password, deviceId, req);

    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
    });
}, 'controller');

/**
 * Logout from current device
 * POST /api/v1/auth/logout
 */
const logout = catchAsync(async (req, res) => {
    const { deviceId } = req.body;
    const userId = req.user._id;

    const result = await sessionService.revokeSession(userId, deviceId, req);

    res.status(200).json({
        success: true,
        message: result.message,
        data: null
    });
}, 'controller');

/**
 * Logout from all devices
 * POST /api/v1/auth/logout-all
 */
const logoutAll = catchAsync(async (req, res) => {
    const userId = req.user._id;

    const result = await sessionService.revokeAllSessions(userId, req);

    res.status(200).json({
        success: true,
        message: result.message,
        data: null
    });
}, 'controller');

/**
 * Verify email (token)
 * POST /api/v1/auth/verify-email
 */
const verifyEmail = catchAsync(async (req, res) => {
    const { token } = req.body;

    const result = await authService.verifyEmail(token);

    res.status(200).json({
        success: true,
        message: result.message,
        data: result.user
    });
}, 'controller');

/**
 * Verify OTP — works for ALL signup methods (manual, Google, GitHub)
 * POST /api/v1/auth/verify-otp
 */
const verifyOTP = catchAsync(async (req, res) => {
    const { email, otp } = req.body;

    const result = await otpService.verifyOTP(email, otp, req);

    res.status(200).json({
        success: true,
        message: result.message,
        data: result.user
    });
}, 'controller');

/**
 * Resend OTP
 * POST /api/v1/auth/resend-otp
 */
const resendOTP = catchAsync(async (req, res) => {
    const { email } = req.body;

    const result = await otpService.resendOTP(email, req);

    res.status(200).json({
        success: true,
        message: result.message,
        data: result.otp
            ? { otp: result.otp, devModeNote: 'OTP shown because SMTP is not configured' }
            : null
    });
}, 'controller');

// ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────────

/**
 * Google OAuth callback handler
 * GET /api/v1/auth/google/callback
 * Called after passport.authenticate('google') succeeds.
 * Redirects to client with JWT tokens.
 */
const googleCallback = catchAsync(async (req, res, next) => {
    await handleGoogleCallback(req, res, next);
}, 'controller');

// ─── GITHUB OAUTH ─────────────────────────────────────────────────────────────

/**
 * GitHub OAuth callback handler
 * GET /api/v1/auth/github/callback
 * Called after passport.authenticate('github') succeeds.
 * Redirects to client with JWT tokens.
 */
const githubCallback = catchAsync(async (req, res, next) => {
    await handleGitHubCallback(req, res, next);
}, 'controller');

module.exports = {
    register,
    login,
    logout,
    logoutAll,
    verifyEmail,
    verifyOTP,
    resendOTP,
    googleCallback,
    githubCallback
};
