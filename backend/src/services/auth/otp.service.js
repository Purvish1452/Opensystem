const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const { logActivity } = require('../activity/activity.service');
const { ACTIVITY_TYPES, ACCOUNT_STATUS } = require('../../constants');
const emailService = require('../email/email.service');

/**
 * OTP Service - Production Grade
 * 
 * Features:
 * - Rate limiting per email + IP
 * - OTP locking after 5 failed attempts
 * - Secure OTP generation and verification
 */

// In-memory rate limiting (should use Redis in production)
const otpAttempts = new Map(); // email:ip -> { count, lockedUntil }

/**
 * Generate OTP for user
 * 
 * @param {String} email - User email
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Success message
 */
const generateOTP = async (email, req) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw AppError.notFoundError('User', 'USER_NOT_FOUND');
    }

    // Check rate limiting
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const rateLimitKey = `${email}:${ipAddress}`;
    checkRateLimit(rateLimitKey);

    // Generate OTP using User model method
    const otp = user.generateOTP();
    await user.save();

    // Log OTP generation
    logActivity(user._id, ACTIVITY_TYPES.OTP_GENERATED, null, null, req);

    // Send OTP via email
    const displayName = user.fullname?.firstName || user.username;
    emailService.sendOTPEmail(user.email, otp, displayName).catch(err => {
        console.error('[OTP SERVICE] Failed to send OTP email:', err.message);
    });

    return {
        message: 'OTP sent to your registered email address',
        // otp returned ONLY in dev mode (when email is not configured)
        ...(emailService.isEmailConfigured() ? {} : { otp })
    };
};

/**
 * Verify OTP
 * 
 * @param {String} email - User email
 * @param {String} otp - OTP code
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Success message
 */
const verifyOTP = async (email, otp, req) => {
    const user = await User.findOne({ email }).select('+otp +otpExpires');

    if (!user) {
        throw AppError.notFoundError('User', 'USER_NOT_FOUND');
    }

    // Check rate limiting
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const rateLimitKey = `${email}:${ipAddress}`;
    checkRateLimit(rateLimitKey);

    // Check if OTP exists and not expired
    if (!user.otp || !user.otpExpires) {
        throw AppError.authError('No OTP found. Please request a new one.', 'OTP_NOT_FOUND');
    }

    if (user.otpExpires < Date.now()) {
        throw AppError.authError('OTP expired. Please request a new one.', 'OTP_EXPIRED');
    }

    // Verify OTP — model stores SHA-256 hash, so hash incoming OTP for comparison
    const crypto = require('crypto');
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    if (user.otp !== hashedOtp) {
        // Increment failed attempts
        incrementFailedAttempts(rateLimitKey);

        // Log failed OTP attempt
        logActivity(user._id, ACTIVITY_TYPES.FAILED_LOGIN, null, null, req, {
            reason: 'invalid_otp'
        });

        throw AppError.authError('Invalid OTP', 'INVALID_OTP');
    }

    // OTP verified - clear OTP fields and activate account
    user.otp = undefined;
    user.otpExpires = undefined;
    user.emailVerified = true;
    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    await user.save();

    // Clear rate limit attempts
    otpAttempts.delete(rateLimitKey);

    // Log successful OTP verification
    logActivity(user._id, ACTIVITY_TYPES.EMAIL_VERIFICATION, null, null, req);

    return {
        message: 'OTP verified successfully',
        user: {
            id: user._id,
            email: user.email,
            isEmailVerified: user.isEmailVerified
        }
    };
};

/**
 * Resend OTP
 * 
 * @param {String} email - User email
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Success message
 */
const resendOTP = async (email, req) => {
    return await generateOTP(email, req);
};

/**
 * Check rate limit for OTP attempts
 * 
 * @param {String} rateLimitKey - Rate limit key (email:ip)
 * @throws {AppError} If rate limit exceeded or locked
 */
const checkRateLimit = (rateLimitKey) => {
    const attempt = otpAttempts.get(rateLimitKey);

    if (attempt) {
        // Check if locked
        if (attempt.lockedUntil && attempt.lockedUntil > Date.now()) {
            const remainingTime = Math.ceil((attempt.lockedUntil - Date.now()) / 1000 / 60);
            throw AppError.rateLimitError(
                `Too many failed attempts. Try again in ${remainingTime} minutes.`,
                'OTP_LOCKED'
            );
        }

        // Reset if lock expired
        if (attempt.lockedUntil && attempt.lockedUntil <= Date.now()) {
            otpAttempts.delete(rateLimitKey);
        }
    }
};

/**
 * Increment failed OTP attempts
 * Lock after 5 failed attempts for 15 minutes
 * 
 * @param {String} rateLimitKey - Rate limit key (email:ip)
 */
const incrementFailedAttempts = (rateLimitKey) => {
    const attempt = otpAttempts.get(rateLimitKey) || { count: 0, lockedUntil: null };
    attempt.count += 1;

    // Lock after 5 failed attempts
    if (attempt.count >= 5) {
        attempt.lockedUntil = Date.now() + (15 * 60 * 1000); // 15 minutes
    }

    otpAttempts.set(rateLimitKey, attempt);
};

module.exports = {
    generateOTP,
    verifyOTP,
    resendOTP
};
