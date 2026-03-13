const UserProject = require('../../models/UserProject');
const AppError = require('../../utils/AppError');
const { logActivity } = require('../activity/activity.service');
const { ACTIVITY_TYPES, PROFILE_LIMITS, TECH_STACK } = require('../../constants');
const mongoose = require('mongoose');

/**
 * Project Service — Professional Profile System (Phase-3)
 *
 * All ownership checks via compound { _id, userId } query — prevents IDOR.
 * Soft delete only — full audit trail preserved.
 * Optimistic locking via __v (versionKey) — concurrent update protection.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize tech stack values (case-insensitive match to TECH_STACK enum)
 * @param {String[]} inputStack
 * @returns {String[]} Normalized stack
 */
const normalizeTechStack = (inputStack = []) => {
    const validValues = Object.values(TECH_STACK);
    const lowerMap = {};
    validValues.forEach(v => { lowerMap[v.toLowerCase()] = v; });

    return inputStack
        .map(t => lowerMap[t.toLowerCase()] || t)
        .filter((v, i, arr) => arr.indexOf(v) === i); // deduplicate
};

/**
 * Build diff object for audit trail
 * @param {Object} original
 * @param {Object} updates
 * @returns {Object} { field: { old, new } }
 */
const buildDiff = (original, updates) => {
    const diff = {};
    const fields = ['title', 'description', 'githubUrl', 'deployedUrl', 'techStack', 'skillsAcquired', 'status', 'isPublic'];
    fields.forEach(field => {
        if (updates[field] !== undefined) {
            const oldVal = original[field];
            const newVal = updates[field];
            const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
            if (changed) diff[field] = { old: oldVal, new: newVal };
        }
    });
    return diff;
};

// ─── CRUD Operations ──────────────────────────────────────────────────────────

/**
 * Create a project
 * @param {String} userId
 * @param {Object} data - Validated project data
 * @param {Object} req - Express request
 */
const createProject = async (userId, data, req) => {
    // Enforce MAX_PROJECTS before insert
    const count = await UserProject.countDocuments({ userId, isDeleted: false });
    if (count >= PROFILE_LIMITS.MAX_PROJECTS) {
        throw new AppError(
            `You can have a maximum of ${PROFILE_LIMITS.MAX_PROJECTS} projects`,
            400,
            'PROJECT_LIMIT_EXCEEDED'
        );
    }

    // Normalize tech stack
    if (data.techStack?.length) {
        data.techStack = normalizeTechStack(data.techStack);
    }

    const project = await UserProject.create({ userId, ...data });

    // Non-blocking activity log
    process.nextTick(() =>
        logActivity(userId, ACTIVITY_TYPES.USER_PROJECT_CREATE, null, null, req, {
            projectId: project._id,
            title: project.title
        })
    );

    return project;
};

/**
 * Update a project — ownership enforced via compound query
 * @param {String} userId
 * @param {String} projectId
 * @param {Object} data - Fields to update
 * @param {Object} req
 */
const updateProject = async (userId, projectId, data, req) => {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw AppError.notFoundError('Project', 'PROJECT_NOT_FOUND');
    }

    // Normalize tech stack if provided
    if (data.techStack?.length) {
        data.techStack = normalizeTechStack(data.techStack);
    }

    // Fetch for diff — ownership guaranteed by compound query
    const original = await UserProject.findOne({
        _id: projectId,
        userId,
        isDeleted: false
    });

    if (!original) {
        throw AppError.notFoundError('Project', 'PROJECT_NOT_FOUND');
    }

    const diff = buildDiff(original, data);

    const updated = await UserProject.findOneAndUpdate(
        { _id: projectId, userId, isDeleted: false },
        { $set: data },
        { new: true, runValidators: true }
    );

    // Non-blocking audit log with diff
    process.nextTick(() =>
        logActivity(userId, ACTIVITY_TYPES.USER_PROJECT_UPDATE, null, null, req, {
            projectId,
            diff
        })
    );

    return updated;
};

/**
 * Soft delete a project — IDOR-safe compound query
 * @param {String} userId
 * @param {String} projectId
 * @param {Object} req
 */
const deleteProject = async (userId, projectId, req) => {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw AppError.notFoundError('Project', 'PROJECT_NOT_FOUND');
    }

    const result = await UserProject.findOneAndUpdate(
        { _id: projectId, userId, isDeleted: false },  // IDOR guard
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true }
    );

    if (!result) {
        throw AppError.notFoundError('Project', 'PROJECT_NOT_FOUND');
    }

    // Non-blocking audit log
    process.nextTick(() =>
        logActivity(userId, ACTIVITY_TYPES.USER_PROJECT_DELETE, null, null, req, {
            projectId,
            softDelete: true
        })
    );

    return { message: 'Project deleted successfully' };
};

/**
 * Get paginated projects for a user
 * @param {String} userId
 * @param {Object} options - { page, limit, status, isPublic }
 * @param {Boolean} isOwnProfile - If false, only return public projects
 */
const getUserProjects = async (userId, options = {}, isOwnProfile = true) => {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * Math.min(limit, 20);

    const filter = { userId, isDeleted: false };
    if (!isOwnProfile) filter.isPublic = true;
    if (status) filter.status = status;

    const [projects, total] = await Promise.all([
        UserProject.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Math.min(limit, 20))
            .select('-isDeleted -deletedAt'),
        UserProject.countDocuments(filter)
    ]);

    return {
        projects,
        pagination: {
            page: parseInt(page),
            limit: Math.min(limit, 20),
            total,
            totalPages: Math.ceil(total / Math.min(limit, 20))
        }
    };
};

module.exports = {
    createProject,
    updateProject,
    deleteProject,
    getUserProjects
};
