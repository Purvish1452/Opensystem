const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const { logActivity } = require('../activity/activity.service');
const { ACTIVITY_TYPES, SECURITY_LIMITS } = require('../../constants');

/**
 * Profile Service - Production Grade
 * 
 * Features:
 * - Password change invalidates all refresh tokens
 * - Profile changes logged for audit compliance
 */

/**
 * Update user profile
 * 
 * @param {String} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Updated user
 */
const updateProfile = async (userId, profileData, req) => {
    const user = await User.findById(userId);

    if (!user) {
        throw AppError.notFoundError('User', 'USER_NOT_FOUND');
    }

    const { firstName, lastName, age, profession, profileImage, bio, userType } = profileData;

    // Update fields
    if (firstName) user.fullname.firstName = firstName;
    if (lastName) user.fullname.lastName = lastName;
    if (age !== undefined) user.age = age;
    if (profession) user.profession = profession;
    if (profileImage) user.profileImage = profileImage;
    if (bio) user.bio = bio;
    if (userType) user.userType = userType;

    await user.save();

    // Log profile update for audit compliance
    logActivity(userId, ACTIVITY_TYPES.PROFILE_UPDATE, null, null, req, {
        updatedFields: Object.keys(profileData)
    });

    return user;
};

/**
 * Update password - Invalidates all refresh tokens
 * 
 * @param {String} userId - User ID
 * @param {String} currentPassword - Current password
 * @param {String} newPassword - New password
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Success message
 */
const updatePassword = async (userId, currentPassword, newPassword, req) => {
    const user = await User.findById(userId).select('+password');

    if (!user) {
        throw AppError.notFoundError('User', 'USER_NOT_FOUND');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
        throw AppError.authError('Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Validate new password complexity
    const passwordValidation = User.validatePasswordComplexity(newPassword);
    if (!passwordValidation.isValid) {
        throw AppError.validationError(
            passwordValidation.errors,
            'Password does not meet complexity requirements'
        );
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save middleware

    // CRITICAL: Invalidate all refresh tokens for security
    user.refreshTokens = [];

    await user.save();

    // Log password change for audit compliance
    logActivity(userId, ACTIVITY_TYPES.PASSWORD_CHANGE, null, null, req, {
        allSessionsRevoked: true
    });

    return {
        message: 'Password updated successfully. All sessions have been logged out.'
    };
};

/**
 * Update skills
 * 
 * @param {String} userId - User ID
 * @param {Array} skills - Skills array
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Updated user
 */
const updateSkills = async (userId, skills, req) => {
    const user = await User.findById(userId);

    if (!user) {
        throw AppError.notFoundError('User', 'USER_NOT_FOUND');
    }

    // Validate skills limit
    if (skills.length > 20) {
        throw AppError.validationError(
            [{ field: 'skills', message: 'Maximum 20 skills allowed' }],
            'Skills limit exceeded'
        );
    }

    user.skills = skills;
    await user.save();

    // Log skills update
    logActivity(userId, ACTIVITY_TYPES.PROFILE_UPDATE, null, null, req, {
        updatedFields: ['skills'],
        skillsCount: skills.length
    });

    return user;
};

module.exports = {
    updateProfile,
    updatePassword,
    updateSkills
};
