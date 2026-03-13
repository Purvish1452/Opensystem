const { generateTokens, verifyRefreshToken } = require('../../utils/generateToken');
const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const { logActivity } = require('../activity/activity.service');
const { ACTIVITY_TYPES } = require('../../constants');
const bcrypt = require('bcryptjs');

/**
 * Session Service - Production Grade
 * 
 * Features:
 * - Refresh token rotation (old token invalidated on reuse)
 * - tokenHash stored (not plaintext) matching User schema
 * - Secure session management per device
 */

/**
 * Create session
 * 
 * @param {Object} user - User object
 * @param {String} deviceId - Device identifier
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Access and refresh tokens
 */
const createSession = async (user, deviceId, req) => {
    // Generate tokens
    const tokens = generateTokens(user);

    // Hash the refresh token before storing (matching User schema: tokenHash)
    const tokenHash = await bcrypt.hash(tokens.refreshToken, 10);

    // Remove existing token for this device (one session per device)
    user.refreshTokens = user.refreshTokens.filter(rt => rt.deviceId !== deviceId);

    // Push new token entry matching schema: { tokenHash, deviceId, expiresAt }
    user.refreshTokens.push({
        tokenHash,
        deviceId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    // Limit to max 5 sessions
    if (user.refreshTokens.length > 5) {
        user.refreshTokens = user.refreshTokens.slice(-5);
    }

    await user.save({ validateBeforeSave: false });

    return tokens;
};

/**
 * Validate session (access token)
 * 
 * @param {String} token - JWT access token
 * @returns {Promise<Object>} Decoded token
 */
const validateSession = async (token) => {
    try {
        const { verifyAccessToken } = require('../../utils/generateToken');
        const decoded = verifyAccessToken(token);
        return decoded;
    } catch (error) {
        throw AppError.authError('Invalid or expired token', 'INVALID_TOKEN');
    }
};

/**
 * Revoke session (logout from current device)
 * 
 * @param {String} userId - User ID
 * @param {String} deviceId - Device identifier
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Success message
 */
const revokeSession = async (userId, deviceId, req) => {
    const user = await User.findById(userId);
    if (!user) {
        throw AppError.notFoundError('User', 'USER_NOT_FOUND');
    }

    // Remove refresh token for this device
    user.refreshTokens = user.refreshTokens.filter(rt => rt.deviceId !== deviceId);
    await user.save({ validateBeforeSave: false });

    logActivity(userId, ACTIVITY_TYPES.LOGOUT, null, null, req, { deviceId });

    return { message: 'Logged out successfully' };
};

/**
 * Revoke all sessions (logout from all devices)
 * 
 * @param {String} userId - User ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Success message
 */
const revokeAllSessions = async (userId, req) => {
    const user = await User.findById(userId);
    if (!user) {
        throw AppError.notFoundError('User', 'USER_NOT_FOUND');
    }

    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });

    logActivity(userId, ACTIVITY_TYPES.LOGOUT, null, null, req, { allDevices: true });

    return { message: 'Logged out from all devices successfully' };
};

/**
 * Refresh access token with rotation
 * 
 * @param {String} refreshToken - Refresh token (plaintext from client)
 * @param {String} deviceId - Device identifier
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} New tokens
 */
const refreshAccessToken = async (refreshToken, deviceId, req) => {
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
        throw AppError.authError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
        throw AppError.notFoundError('User', 'USER_NOT_FOUND');
    }

    // Find the token entry for this device using bcrypt.compare
    let matchedIndex = -1;

    for (let i = 0; i < user.refreshTokens.length; i++) {
        if (user.refreshTokens[i].deviceId === deviceId) {
            const isMatch = await bcrypt.compare(refreshToken, user.refreshTokens[i].tokenHash);
            if (isMatch) {
                matchedIndex = i;
                break;
            }
        }
    }

    if (matchedIndex === -1) {
        throw AppError.authError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Check expiry
    if (user.refreshTokens[matchedIndex].expiresAt < new Date()) {
        user.refreshTokens.splice(matchedIndex, 1);
        await user.save({ validateBeforeSave: false });
        throw AppError.authError('Refresh token expired', 'TOKEN_EXPIRED');
    }

    // Token rotation: remove old token
    user.refreshTokens.splice(matchedIndex, 1);

    // Generate new tokens
    const tokens = generateTokens(user);

    // Hash and store the NEW refresh token (rotation complete)
    const newTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokens.push({
        tokenHash: newTokenHash,
        deviceId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    await user.save({ validateBeforeSave: false });

    return tokens; // ✅ Return the new access + refresh tokens
};

module.exports = {
    createSession,
    validateSession,
    revokeSession,
    revokeAllSessions,
    refreshAccessToken
};
