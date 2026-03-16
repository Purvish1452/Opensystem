const jwt = require('jsonwebtoken');
const { TOKEN_EXPIRY } = require('../constants');

/**
 * JWT Token Generation Utilities
 * Handles creation of access and refresh tokens
 */

/**
 * Generate Access Token
 * @param {Object} payload - Data to encode in token (usually user id and role)
 * @returns {String} - JWT access token
 */
const generateAccessToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN }
    );
};

/**
 * Generate Refresh Token
 * @param {Object} payload - Data to encode in token (usually user id)
 * @returns {String} - JWT refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN }
    );
};

/**
 * Generate Both Tokens
 * @param {Object} user - User object
 * @returns {Object} - Object containing access and refresh tokens
 */
const generateTokens = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ id: user._id });

    return {
        accessToken,
        refreshToken
    };
};

/**
 * Verify Access Token
 * @param {String} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify Refresh Token
 * @param {String} token - JWT refresh token to verify
 * @returns {Object} - Decoded token payload
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken
};
