const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const { logActivity } = require('../activity/activity.service');
const sessionService = require('./session.service');
const otpService = require('./otp.service');
const emailService = require('../email/email.service');
const { ACTIVITY_TYPES, ACCOUNT_STATUS } = require('../../constants');
const crypto = require('crypto');

/**
 * Auth Service - Production Grade
 * 
 * Features:
 * - Timing attack prevention on login
 * - Account status enforcement
 * - Risk scoring (new IP/device flagged)
 * - Comprehensive activity logging
 */

/**
 * Register new user
 * 
 * @param {Object} userData - User registration data
 * @param {String} deviceId - Device identifier
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created user and tokens
 */
const registerUser = async (userData, deviceId, req) => {
    const { username, email, password, firstName, lastName, age, profession, userType } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        if (existingUser.email === email) {
            throw AppError.conflictError('Email already registered', 'EMAIL_EXISTS');
        }
        throw AppError.conflictError('Username already taken', 'USERNAME_EXISTS');
    }

    // Create user
    const user = await User.create({
        username,
        email,
        password, // Will be hashed by pre-save middleware
        fullname: {
            firstName,
            lastName
        },
        age,
        profession,
        userType: userType || 'student',
        accountStatus: ACCOUNT_STATUS.PENDING_VERIFICATION
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Log registration activity
    logActivity(user._id, ACTIVITY_TYPES.REGISTER, null, null, req, {
        username,
        email,
        userType: user.userType
    });

    // Generate OTP and send via email for verification
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    const displayName = user.fullname?.firstName || user.username;
    emailService.sendOTPEmail(user.email, otp, displayName).catch(err => {
        console.error('[AUTH SERVICE] Failed to send OTP email on register:', err.message);
    });

    // Create session
    const tokens = await sessionService.createSession(user, deviceId, req);

    return {
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            accountStatus: user.accountStatus,
            isEmailVerified: user.emailVerified
        },
        tokens,
        // OTP only shown in dev mode (when SMTP is not configured)
        ...(emailService.isEmailConfigured() ? {} : { otp }),
        message: 'Registration successful. Please check your email for the OTP to verify your account.'
    };
};

/**
 * Login user - Timing attack prevention
 * 
 * @param {String} email - User email
 * @param {String} password - User password
 * @param {String} deviceId - Device identifier
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} User and tokens
 */
const loginUser = async (email, password, deviceId, req) => {
    // Timing attack prevention: Always perform same operations
    const user = await User.findOne({ email }).select('+password');

    let isPasswordValid = false;
    if (user) {
        isPasswordValid = await user.comparePassword(password);
    } else {
        // Prevent timing attack: hash dummy password even if user doesn't exist
        const bcrypt = require('bcryptjs');
        await bcrypt.compare(password, '$2a$10$dummyhashtopreventtimingattack1234567890');
    }

    // Check credentials
    if (!user || !isPasswordValid) {
        // Log failed login attempt
        if (user) {
            logActivity(user._id, ACTIVITY_TYPES.FAILED_LOGIN, null, null, req);
        }
        throw AppError.authError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Account status enforcement
    if (user.accountStatus === ACCOUNT_STATUS.PENDING_VERIFICATION) {
        throw AppError.forbiddenError(
            'Email not verified. Please verify your email with the OTP sent to your inbox.',
            'EMAIL_NOT_VERIFIED'
        );
    }

    if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
        throw AppError.forbiddenError('Account suspended. Contact support.', 'ACCOUNT_SUSPENDED');
    }

    if (user.accountStatus === ACCOUNT_STATUS.BANNED) {
        throw AppError.forbiddenError('Account banned.', 'ACCOUNT_BANNED');
    }

    // Risk scoring: Check for new IP/device
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const isNewDevice = !user.deviceLogins.some(d => d.deviceId === deviceId);
    const isNewIP = user.lastLoginIP !== ipAddress;

    if (isNewDevice || isNewIP) {
        // Flag in activity log for monitoring
        logActivity(user._id, ACTIVITY_TYPES.LOGIN, null, null, req, {
            riskScore: 'medium',
            reason: isNewDevice ? 'new_device' : 'new_ip',
            previousIP: user.lastLoginIP,
            currentIP: ipAddress
        });
    } else {
        // Normal login
        logActivity(user._id, ACTIVITY_TYPES.LOGIN, null, null, req);
    }

    // Update login details
    await user.updateLastLogin(ipAddress, deviceId);

    // Create session
    const tokens = await sessionService.createSession(user, deviceId, req);

    return {
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullname: user.fullname,
            profileImage: user.profileImage,
            accountStatus: user.accountStatus,
            isEmailVerified: user.emailVerified,
            userType: user.userType
        },
        tokens
    };
};

/**
 * Verify email with token
 * 
 * @param {String} token - Verification token
 * @returns {Promise<Object>} Success message
 */
const verifyEmail = async (token) => {
    // Hash token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw AppError.authError('Invalid or expired verification token', 'INVALID_TOKEN');
    }

    // Mark email as verified
    user.emailVerified = true;
    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return {
        message: 'Email verified successfully',
        user: {
            id: user._id,
            email: user.email,
            isEmailVerified: user.emailVerified,
            accountStatus: user.accountStatus
        }
    };
};

module.exports = {
    registerUser,
    loginUser,
    verifyEmail
};
