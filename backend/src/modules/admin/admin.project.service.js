const Project = require('../../models/Project');
const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const { logAudit } = require('./audit.service');
const { ADMIN_ACTIONS, PROJECT_STAGES, PROJECT_STATUS, STATUS_CODES } = require('../../constants');

/**
 * Admin Project Service
 *
 * CRUD operations on projects performed by an admin.
 * All mutating actions write an audit log entry.
 * Admin bypasses ownership checks and soft-delete filters.
 */

// ─── LIST ALL PROJECTS ────────────────────────────────────────────────────────

/**
 * Paginated list of all projects (includes soft-deleted when requested).
 *
 * @param {Object} filters - { owner, status, projectStage, techStack, includeDeleted }
 * @param {Number} page
 * @param {Number} limit
 */
const listAllProjects = async (filters = {}, page = 1, limit = 20) => {
    const query = {};

    if (!filters.includeDeleted) {
        query.isDeleted = false;
    }

    if (filters.owner) query.owner = filters.owner;
    if (filters.status) query.status = filters.status;
    if (filters.projectStage) query.projectStage = filters.projectStage;
    if (filters.techStack) query.techStack = { $in: filters.techStack.split(',') };

    const skip = (page - 1) * limit;
    const [projects, total] = await Promise.all([
        Project.find(query)
            .populate('owner', 'username fullname profileImage email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Project.countDocuments(query)
    ]);

    return { projects, total, page, pages: Math.ceil(total / limit) };
};

// ─── LIST PROJECTS BY USER ────────────────────────────────────────────────────

/**
 * List all projects owned by a specific user (admin view — includes soft-deleted).
 *
 * @param {String} userId
 * @param {Number} page
 * @param {Number} limit
 */
const listProjectsByUser = async (userId, page = 1, limit = 20) => {
    // Verify user exists
    const user = await User.findById(userId).select('username email').lean();
    if (!user) throw new AppError('User not found', STATUS_CODES.NOT_FOUND);

    const skip = (page - 1) * limit;
    const query = { owner: userId };

    const [projects, total] = await Promise.all([
        Project.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Project.countDocuments(query)
    ]);

    return { user, projects, total, page, pages: Math.ceil(total / limit) };
};

// ─── GET SINGLE PROJECT ───────────────────────────────────────────────────────

/**
 * Fetch any project by ID (admin view — bypasses soft-delete).
 *
 * @param {String} projectId
 */
const adminGetProject = async (projectId) => {
    // findById bypasses the query middleware that excludes deleted; we use lean + direct field check
    const project = await Project.findOne({ _id: projectId })
        .populate('owner', 'username fullname profileImage email')
        .lean();

    if (!project) throw new AppError('Project not found', STATUS_CODES.NOT_FOUND);
    return project;
};

// ─── CREATE PROJECT ───────────────────────────────────────────────────────────

/**
 * Create a project on behalf of any user.
 * `targetUserId` in projectData specifies the owner.
 *
 * @param {String} adminId
 * @param {Object} projectData - { targetUserId, title, description, techStack, projectStage, requirementType, maxMembers, timeline, rolesNeeded }
 * @param {Object} req
 */
const adminCreateProject = async (adminId, projectData, req) => {
    const {
        targetUserId,
        title,
        description,
        techStack,
        links,
        projectStage,
        requirementType,
        maxMembers,
        timeline,
        rolesNeeded
    } = projectData;

    // Verify target user exists
    const targetUser = await User.findById(targetUserId).select('username email').lean();
    if (!targetUser) throw new AppError('Target user not found', STATUS_CODES.NOT_FOUND);

    const project = await Project.create({
        title,
        description,
        owner: targetUserId,
        techStack: techStack || [],
        links: links || [],
        projectStage: projectStage || PROJECT_STAGES.IDEA,
        status: PROJECT_STATUS.OPEN,
        requirementType,
        maxMembers: maxMembers || 10,
        timeline,
        rolesNeeded: rolesNeeded || []
    });

    await logAudit({
        adminId,
        action: ADMIN_ACTIONS.CREATE_PROJECT,
        targetType: 'Project',
        targetId: project._id,
        reason: `Admin created project on behalf of user ${targetUser.username}`,
        metadata: {
            targetUserId,
            targetUsername: targetUser.username,
            title,
            projectStage: project.projectStage
        },
        req
    });

    return project;
};

// ─── UPDATE PROJECT ───────────────────────────────────────────────────────────

/**
 * Update any project regardless of ownership.
 *
 * @param {String} adminId
 * @param {String} projectId
 * @param {Object} updates - { title, description, techStack, projectStage, status, links, maxMembers, requirementType }
 * @param {String} reason
 * @param {Object} req
 */
const adminUpdateProject = async (adminId, projectId, updates, reason, req) => {
    // Use findOne to bypass the isDeleted query middleware (admin can see/edit deleted projects)
    const project = await Project.findOne({ _id: projectId });
    if (!project) throw new AppError('Project not found', STATUS_CODES.NOT_FOUND);

    const allowedFields = [
        'title', 'description', 'techStack', 'projectStage',
        'status', 'links', 'maxMembers', 'requirementType', 'timeline', 'rolesNeeded'
    ];

    const appliedChanges = {};
    allowedFields.forEach(key => {
        if (updates[key] !== undefined) {
            project[key] = updates[key];
            appliedChanges[key] = updates[key];
        }
    });

    await project.save();

    await logAudit({
        adminId,
        action: ADMIN_ACTIONS.UPDATE_PROJECT,
        targetType: 'Project',
        targetId: projectId,
        reason: reason || 'Updated by admin',
        metadata: {
            projectId,
            updatedFields: Object.keys(appliedChanges)
        },
        req
    });

    return project;
};

// ─── DELETE PROJECT ───────────────────────────────────────────────────────────

/**
 * Soft-delete any project regardless of ownership.
 *
 * @param {String} adminId
 * @param {String} projectId
 * @param {String} reason
 * @param {Object} req
 */
const adminDeleteProject = async (adminId, projectId, reason, req) => {
    const project = await Project.findOne({ _id: projectId });
    if (!project) throw new AppError('Project not found', STATUS_CODES.NOT_FOUND);

    if (project.isDeleted) {
        throw new AppError('Project is already deleted', STATUS_CODES.CONFLICT);
    }

    // Use model's softDelete method if available, otherwise manual
    if (typeof project.softDelete === 'function') {
        await project.softDelete();
    } else {
        project.isDeleted = true;
        project.deletedAt = new Date();
        await project.save();
    }

    await logAudit({
        adminId,
        action: ADMIN_ACTIONS.DELETE_PROJECT,
        targetType: 'Project',
        targetId: projectId,
        reason: reason || 'Deleted by admin',
        metadata: {
            projectId,
            ownerId: project.owner,
            title: project.title
        },
        req
    });

    return { message: 'Project deleted by admin successfully' };
};

module.exports = {
    listAllProjects,
    listProjectsByUser,
    adminGetProject,
    adminCreateProject,
    adminUpdateProject,
    adminDeleteProject
};
