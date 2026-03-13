const User = require('../models/User');
const AppError = require('../utils/AppError');
const { generateTokens, verifyRefreshToken } = require('../utils/generateToken');
const { STATUS_CODES, MESSAGES } = require('../constants');

/**
 * Authentication Service Layer
 * Contains business logic for authentication operations
 * Separates business logic from controllers
 */

class AuthService {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} - Created user and tokens
     */
    async register(userData) {
        const { name, email, password } = userData;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError(MESSAGES.USER_EXISTS, STATUS_CODES.CONFLICT);
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password
        });

        // Generate tokens
        const tokens = generateTokens(user);

        // Return user without password
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };

        return {
            user: userResponse,
            ...tokens
        };
    }

    /**
     * Login user
     * @param {String} email - User email
     * @param {String} password - User password
     * @returns {Promise<Object>} - User and tokens
     */
    async login(email, password) {
        // Find user and include password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            throw new AppError(MESSAGES.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
        }

        // Check if password matches
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            throw new AppError(MESSAGES.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
        }

        // Update last login
        await user.updateLastLogin();

        // Generate tokens
        const tokens = generateTokens(user);

        // Return user without password
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin
        };

        return {
            user: userResponse,
            ...tokens
        };
    }

    /**
     * Get user by ID
     * @param {String} userId - User ID
     * @returns {Promise<Object>} - User data
     */
    async getUserById(userId) {
        const user = await User.findById(userId);

        if (!user) {
            throw new AppError(MESSAGES.USER_NOT_FOUND, STATUS_CODES.NOT_FOUND);
        }

        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }

    /**
     * Refresh access token using refresh token
     * @param {String} refreshToken - Refresh token
     * @returns {Promise<Object>} - New access token
     */
    async refreshAccessToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = verifyRefreshToken(refreshToken);

            // Get user
            const user = await User.findById(decoded.id);

            if (!user) {
                throw new AppError(MESSAGES.USER_NOT_FOUND, STATUS_CODES.UNAUTHORIZED);
            }

            // Generate new tokens
            const tokens = generateTokens(user);

            return tokens;
        } catch (error) {
            throw new AppError(MESSAGES.INVALID_TOKEN, STATUS_CODES.UNAUTHORIZED);
        }
    }
}

module.exports = new AuthService();
