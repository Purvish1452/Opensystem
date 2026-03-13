const Project = require('../../models/Project');
const AppError = require('../../utils/AppError');
const { logActivity } = require('../activity/activity.service');
const { ACTIVITY_TYPES, PROJECT_STAGES, PROJECT_STATUS } = require('../../constants');

/**
 * Project Service - Production Grade
 * 
 * Features:
 * - Auto-archive inactive projects
 * - Comprehensive project management
 */

/**
 * Create project
 * 
 * @param {String} userId - User ID
 * @param {Object} projectData - Project data
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created project
 */
const createProject = async (userId, projectData, req) => {
    const {
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

    // Create project
    const project = await Project.create({
        title,
        description,
        owner: userId,
        techStack: techStack || [],
        links: links || [],
        projectStage: projectStage || PROJECT_STAGES.IDEA,
        status: PROJECT_STATUS.OPEN,
        requirementType,
        maxMembers: maxMembers || 10,
        timeline,
        rolesNeeded: rolesNeeded || []
    });

    // Log activity
    logActivity(userId, ACTIVITY_TYPES.PROJECT_CREATE, 'Project', project._id, req, {
        title,
        projectStage,
        techStackCount: techStack?.length || 0
    });

    return project;
};

/**
 * Update project (owner only)
 * 
 * @param {String} userId - User ID
 * @param {String} projectId - Project ID
 * @param {Object} updates - Update data
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Updated project
 */
const updateProject = async (userId, projectId, updates, req) => {
    const project = await Project.findById(projectId);

    if (!project) {
        throw AppError.notFoundError('Project', 'PROJECT_NOT_FOUND');
    }

    // Verify ownership
    if (project.owner.toString() !== userId.toString()) {
        throw AppError.forbiddenError('Only project owner can update', 'NOT_PROJECT_OWNER');
    }

    // Update allowed fields
    const allowedFields = ['title', 'description', 'techStack', 'links', 'projectStage', 'status'];
    Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
            project[key] = updates[key];
        }
    });

    await project.save();

    // Log activity
    logActivity(userId, ACTIVITY_TYPES.PROJECT_UPDATE, 'Project', projectId, req, {
        updatedFields: Object.keys(updates)
    });

    return project;
};

/**
 * Delete project (soft delete, owner only)
 * 
 * @param {String} userId - User ID
 * @param {String} projectId - Project ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Success message
 */
const deleteProject = async (userId, projectId, req) => {
    const project = await Project.findById(projectId);

    if (!project) {
        throw AppError.notFoundError('Project', 'PROJECT_NOT_FOUND');
    }

    // Verify ownership
    if (project.owner.toString() !== userId.toString()) {
        throw AppError.forbiddenError('Only project owner can delete', 'NOT_PROJECT_OWNER');
    }

    await project.softDelete();

    // Log activity
    logActivity(userId, ACTIVITY_TYPES.PROJECT_DELETE, 'Project', projectId, req);

    return {
        message: 'Project deleted successfully'
    };
};

/**
 * Get project feed
 * 
 * @param {Object} filters - Feed filters
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Project feed
 */
const getProjectFeed = async (filters = {}, pagination = {}) => {
    const { page = 1, limit = 20, projectStage, status, techStack } = filters;
    const skip = (page - 1) * limit;

    // Build query
    const query = { isDeleted: false };

    if (projectStage) {
        query.projectStage = projectStage;
    }

    if (status) {
        query.status = status;
    }

    if (techStack && techStack.length > 0) {
        query.techStack = { $in: techStack };
    }

    // Fetch projects
    const [projects, total] = await Promise.all([
        Project.find(query)
            .populate('owner', 'username fullname profileImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Project.countDocuments(query)
    ]);

    return {
        projects,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get trending projects
 * 
 * @param {String} timeWindow - Time window
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Trending projects
 */
const getTrendingProjects = async (timeWindow = '24h', pagination = {}) => {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    // Calculate time cutoff
    const timeMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
    };
    const cutoff = Date.now() - (timeMap[timeWindow] || timeMap['24h']);

    // Fetch trending projects
    const [projects, total] = await Promise.all([
        Project.find({
            isDeleted: false,
            createdAt: { $gte: cutoff }
        })
            .populate('owner', 'username fullname profileImage')
            .sort({ 'votes.voteScore': -1, 'engagement.commentCount': -1 })
            .skip(skip)
            .limit(limit),
        Project.countDocuments({
            isDeleted: false,
            createdAt: { $gte: cutoff }
        })
    ]);

    return {
        projects,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Search projects
 * 
 * @param {String} query - Search query
 * @param {Object} filters - Search filters
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Search results
 */
const searchProjects = async (query, filters = {}, pagination = {}) => {
    const { page = 1, limit = 20, projectStage, status, techStack } = filters;
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = {
        $text: { $search: query },
        isDeleted: false
    };

    if (projectStage) {
        searchQuery.projectStage = projectStage;
    }

    if (status) {
        searchQuery.status = status;
    }

    if (techStack && techStack.length > 0) {
        searchQuery.techStack = { $in: techStack };
    }

    // Execute search
    const [projects, total] = await Promise.all([
        Project.find(searchQuery)
            .populate('owner', 'username fullname profileImage')
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit),
        Project.countDocuments(searchQuery)
    ]);

    return {
        projects,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

module.exports = {
    createProject,
    updateProject,
    deleteProject,
    getProjectFeed,
    getTrendingProjects,
    searchProjects
};
