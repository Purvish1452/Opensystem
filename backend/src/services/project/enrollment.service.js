const Project = require('../../models/Project');
const AppError = require('../../utils/AppError');
const { logActivity } = require('../activity/activity.service');
const { ACTIVITY_TYPES } = require('../../constants');

/**
 * Enrollment Service - Production Grade
 * 
 * Features:
 * - Prevent owner self-approval
 * - Notification service hooks
 * - Comprehensive enrollment management
 */

/**
 * Enroll in project
 * 
 * @param {String} userId - User ID
 * @param {String} projectId - Project ID
 * @param {String} requestedRole - Requested role
 * @param {String} message - Enrollment message
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Success message
 */
const enrollInProject = async (userId, projectId, requestedRole, message, req) => {
    const project = await Project.findById(projectId);

    if (!project) {
        throw AppError.notFoundError('Project', 'PROJECT_NOT_FOUND');
    }

    // Prevent owner from enrolling in own project
    if (project.owner.toString() === userId.toString()) {
        throw AppError.forbiddenError('Project owner cannot enroll in own project', 'OWNER_CANNOT_ENROLL');
    }

    // Check if already enrolled
    const isEnrolled = project.enrolledUsers.some(u => u.user.toString() === userId.toString());
    if (isEnrolled) {
        throw AppError.conflictError('Already enrolled in this project', 'ALREADY_ENROLLED');
    }

    // Check if already has pending request
    const hasPendingRequest = project.pendingRequests.some(r => r.user.toString() === userId.toString());
    if (hasPendingRequest) {
        throw AppError.conflictError('Enrollment request already pending', 'REQUEST_PENDING');
    }

    // Add to pending requests
    project.pendingRequests.push({
        user: userId,
        requestedRole,
        message,
        requestedAt: Date.now()
    });

    await project.save();

    // Log activity
    logActivity(userId, ACTIVITY_TYPES.ENROLL, 'Project', projectId, req, {
        requestedRole,
        message
    });

    // TODO: Notify project owner
    // await notificationService.notifyEnrollmentRequest(project.owner, userId, projectId);

    return {
        message: 'Enrollment request submitted successfully'
    };
};

/**
 * Approve enrollment (owner only)
 * 
 * @param {String} ownerId - Owner user ID
 * @param {String} projectId - Project ID
 * @param {String} userId - User ID to approve
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Success message
 */
const approveEnrollment = async (ownerId, projectId, userId, req) => {
    const project = await Project.findById(projectId);

    if (!project) {
        throw AppError.notFoundError('Project', 'PROJECT_NOT_FOUND');
    }

    // Verify ownership
    if (project.owner.toString() !== ownerId.toString()) {
        throw AppError.forbiddenError('Only project owner can approve enrollments', 'NOT_PROJECT_OWNER');
    }

    // Prevent owner from approving themselves
    if (userId.toString() === ownerId.toString()) {
        throw AppError.forbiddenError('Owner cannot approve themselves', 'INVALID_OPERATION');
    }

    // Find pending request
    const requestIndex = project.pendingRequests.findIndex(r => r.user.toString() === userId.toString());
    if (requestIndex === -1) {
        throw AppError.notFoundError('Enrollment request not found', 'REQUEST_NOT_FOUND');
    }

    const request = project.pendingRequests[requestIndex];

    // Enroll user
    await project.enrollUser(userId, request.requestedRole, ownerId);

    // Log activity
    logActivity(ownerId, ACTIVITY_TYPES.ENROLL_APPROVE, 'Project', projectId, req, {
        enrolledUser: userId,
        role: request.requestedRole
    });

    // TODO: Notify user of approval
    // await notificationService.notifyEnrollmentApproved(userId, projectId);

    return {
        message: 'Enrollment approved successfully'
    };
};

/**
 * Reject enrollment (owner only)
 * 
 * @param {String} ownerId - Owner user ID
 * @param {String} projectId - Project ID
 * @param {String} userId - User ID to reject
 * @param {String} reason - Rejection reason
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Success message
 */
const rejectEnrollment = async (ownerId, projectId, userId, reason, req) => {
    const project = await Project.findById(projectId);

    if (!project) {
        throw AppError.notFoundError('Project', 'PROJECT_NOT_FOUND');
    }

    // Verify ownership
    if (project.owner.toString() !== ownerId.toString()) {
        throw AppError.forbiddenError('Only project owner can reject enrollments', 'NOT_PROJECT_OWNER');
    }

    // Find and remove pending request
    const requestIndex = project.pendingRequests.findIndex(r => r.user.toString() === userId.toString());
    if (requestIndex === -1) {
        throw AppError.notFoundError('Enrollment request not found', 'REQUEST_NOT_FOUND');
    }

    project.pendingRequests.splice(requestIndex, 1);
    await project.save();

    // Log activity
    logActivity(ownerId, ACTIVITY_TYPES.ENROLL_REJECT, 'Project', projectId, req, {
        rejectedUser: userId,
        reason
    });

    // TODO: Notify user of rejection
    // await notificationService.notifyEnrollmentRejected(userId, projectId, reason);

    return {
        message: 'Enrollment rejected successfully'
    };
};

module.exports = {
    enrollInProject,
    approveEnrollment,
    rejectEnrollment
};
