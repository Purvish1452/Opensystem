const catchAsync = require('../utils/catchAsync');
const projectService = require('../services/project/project.service');
const enrollmentService = require('../services/project/enrollment.service');
const voteService = require('../services/project/vote.service');
const commentService = require('../services/comment/comment.service');
const reportService = require('../services/report/report.service');

/**
 * Project Controller
 * Thin layer - no business logic
 */

/**
 * Create project
 * POST /api/v1/projects
 */
const createProject = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const projectData = req.body;

    const project = await projectService.createProject(userId, projectData, req);

    res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: { project }
    });
}, 'controller');

/**
 * Get project feed
 * GET /api/v1/projects/feed
 */
const getProjectFeed = catchAsync(async (req, res) => {
    const { page, limit, projectStage, status, techStack } = req.query;

    const result = await projectService.getProjectFeed(
        { projectStage, status, techStack: techStack ? techStack.split(',') : [] },
        { page: parseInt(page), limit: parseInt(limit) }
    );

    res.status(200).json({
        success: true,
        message: 'Project feed retrieved successfully',
        data: result.projects,
        meta: { pagination: result.pagination }
    });
}, 'controller');

/**
 * Get trending projects
 * GET /api/v1/projects/trending
 */
const getTrending = catchAsync(async (req, res) => {
    const { timeWindow, page, limit } = req.query;

    const result = await projectService.getTrendingProjects(
        timeWindow,
        { page: parseInt(page), limit: parseInt(limit) }
    );

    res.status(200).json({
        success: true,
        message: 'Trending projects retrieved successfully',
        data: result.projects,
        meta: { pagination: result.pagination }
    });
}, 'controller');

/**
 * Search projects
 * GET /api/v1/projects/search
 */
const searchProjects = catchAsync(async (req, res) => {
    const { query, projectStage, status, techStack, page, limit } = req.query;

    const result = await projectService.searchProjects(
        query,
        { projectStage, status, techStack: techStack ? techStack.split(',') : [] },
        { page: parseInt(page), limit: parseInt(limit) }
    );

    res.status(200).json({
        success: true,
        message: 'Search results retrieved successfully',
        data: result.projects,
        meta: { pagination: result.pagination }
    });
}, 'controller');

/**
 * Update project
 * PATCH /api/v1/projects/:projectId
 */
const updateProject = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { projectId } = req.params;
    const updates = req.body;

    const project = await projectService.updateProject(userId, projectId, updates, req);

    res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: { project }
    });
}, 'controller');

/**
 * Delete project
 * DELETE /api/v1/projects/:projectId
 */
const deleteProject = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { projectId } = req.params;

    const result = await projectService.deleteProject(userId, projectId, req);

    res.status(200).json({
        success: true,
        message: result.message,
        data: null
    });
}, 'controller');

/**
 * Enroll in project
 * POST /api/v1/projects/:projectId/enroll
 */
const enrollInProject = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { projectId } = req.params;
    const { requestedRole, message } = req.body;

    const result = await enrollmentService.enrollInProject(userId, projectId, requestedRole, message, req);

    res.status(201).json({
        success: true,
        message: result.message,
        data: null
    });
}, 'controller');

/**
 * Approve enrollment
 * PATCH /api/v1/projects/:projectId/enroll/:userId/approve
 */
const approveEnrollment = catchAsync(async (req, res) => {
    const ownerId = req.user._id;
    const { projectId, userId } = req.params;

    const result = await enrollmentService.approveEnrollment(ownerId, projectId, userId, req);

    res.status(200).json({
        success: true,
        message: result.message,
        data: null
    });
}, 'controller');

/**
 * Reject enrollment
 * PATCH /api/v1/projects/:projectId/enroll/:userId/reject
 */
const rejectEnrollment = catchAsync(async (req, res) => {
    const ownerId = req.user._id;
    const { projectId, userId } = req.params;
    const { reason } = req.body;

    const result = await enrollmentService.rejectEnrollment(ownerId, projectId, userId, reason, req);

    res.status(200).json({
        success: true,
        message: result.message,
        data: null
    });
}, 'controller');

/**
 * Comment on project
 * POST /api/v1/projects/:projectId/comment
 */
const commentOnProject = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { projectId } = req.params;
    const { content } = req.body;

    const comment = await commentService.createComment(userId, 'Project', projectId, content, null, req);

    res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: { comment }
    });
}, 'controller');

/**
 * Vote on project
 * PATCH /api/v1/projects/:projectId/vote
 */
const voteOnProject = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { projectId } = req.params;
    const { voteType } = req.body;

    const project = await voteService.voteOnProject(userId, projectId, voteType, req);

    res.status(200).json({
        success: true,
        message: 'Vote recorded successfully',
        data: { project }
    });
}, 'controller');

/**
 * Report project
 * POST /api/v1/projects/:projectId/report
 */
const reportProject = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { projectId } = req.params;
    const { reason, severity, description } = req.body;

    const result = await reportService.submitReport(userId, 'Project', projectId, reason, severity, description, req);

    res.status(201).json({
        success: true,
        message: result.message,
        data: result.report
    });
}, 'controller');

module.exports = {
    createProject,
    getProjectFeed,
    getTrending,
    searchProjects,
    updateProject,
    deleteProject,
    enrollInProject,
    approveEnrollment,
    rejectEnrollment,
    commentOnProject,
    voteOnProject,
    reportProject
};
