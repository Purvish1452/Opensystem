const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { validateBody, validateParams } = require('../middlewares/validate.middleware');
const sanitizeMiddleware = require('../middlewares/sanitize.middleware');
const { moderateContent } = require('../middlewares/contentModeration.middleware');
const {
    projectCreateLimiter: projectLimiter,
    enrollmentLimiter,
    voteLimiter,
    commentLimiter,
    reportLimiter
} = require('../middlewares/rateLimit.middleware');
const {
    projectSpamCheck: antiSpamProject,
    enrollmentSpamCheck: antiSpamEnrollment,
    voteSpamCheck: antiSpamVote,
    commentSpamCheck: antiSpamComment,
    reportSpamCheck: antiSpamReport
} = require('../middlewares/antiSpam.middleware');
const { checkProjectOwnership: verifyProjectOwnership } = require('../middlewares/ownership.middleware');
const projectController = require('../controllers/project.controller');
const {
    createProjectSchema,
    updateProjectSchema,
    enrollSchema: enrollInProjectSchema,
    approveEnrollmentSchema,
    rejectEnrollmentSchema,
    voteOnProjectSchema,
    commentOnProjectSchema,
    reportProjectSchema
} = require('../validators/project.validator');
const { objectIdSchema } = require('../validators/common.validator');

/**
 * Project Routes
 * All routes under /api/v1/projects
 */

// @route   POST /api/v1/projects
// @desc    Create new project
// @access  Private
router.post(
    '/',
    protect,
    projectLimiter,
    antiSpamProject,
    sanitizeMiddleware,
    validateBody(createProjectSchema),
    moderateContent(['title', 'description']),   // Phase-5: content moderation gate
    projectController.createProject
);

// @route   GET /api/v1/projects/feed
// @desc    Get project feed
// @access  Public
router.get('/feed', projectController.getProjectFeed);

// @route   GET /api/v1/projects/trending
// @desc    Get trending projects
// @access  Public
router.get('/trending', projectController.getTrending);

// @route   GET /api/v1/projects/search
// @desc    Search projects
// @access  Public
router.get('/search', projectController.searchProjects);

// @route   PATCH /api/v1/projects/:projectId
// @desc    Update project (owner only)
// @access  Private
router.patch(
    '/:projectId',
    protect,
    sanitizeMiddleware,
    validateParams(objectIdSchema('projectId')),
    validateBody(updateProjectSchema),
    verifyProjectOwnership,
    moderateContent(['title', 'description']),   // Phase-5: re-check on edit
    projectController.updateProject
);

// @route   DELETE /api/v1/projects/:projectId
// @desc    Delete project (owner only)
// @access  Private
router.delete(
    '/:projectId',
    protect,
    validateParams(objectIdSchema('projectId')),
    verifyProjectOwnership,
    projectController.deleteProject
);

// @route   POST /api/v1/projects/:projectId/enroll
// @desc    Enroll in project
// @access  Private
router.post(
    '/:projectId/enroll',
    protect,
    enrollmentLimiter,
    antiSpamEnrollment,
    sanitizeMiddleware,
    validateParams(objectIdSchema('projectId')),
    validateBody(enrollInProjectSchema),
    projectController.enrollInProject
);

// @route   PATCH /api/v1/projects/:projectId/enroll/:userId/approve
// @desc    Approve enrollment (owner only)
// @access  Private
router.patch(
    '/:projectId/enroll/:userId/approve',
    protect,
    validateParams(objectIdSchema('projectId')),
    validateParams(objectIdSchema('userId')),
    verifyProjectOwnership,
    projectController.approveEnrollment
);

// @route   PATCH /api/v1/projects/:projectId/enroll/:userId/reject
// @desc    Reject enrollment (owner only)
// @access  Private
router.patch(
    '/:projectId/enroll/:userId/reject',
    protect,
    sanitizeMiddleware,
    validateParams(objectIdSchema('projectId')),
    validateParams(objectIdSchema('userId')),
    validateBody(rejectEnrollmentSchema),
    verifyProjectOwnership,
    projectController.rejectEnrollment
);

// @route   POST /api/v1/projects/:projectId/comment
// @desc    Comment on project
// @access  Private
router.post(
    '/:projectId/comment',
    protect,
    commentLimiter,
    antiSpamComment,
    sanitizeMiddleware,
    validateParams(objectIdSchema('projectId')),
    validateBody(commentOnProjectSchema),
    moderateContent(['content']),               // Phase-5: content moderation gate
    projectController.commentOnProject
);

// @route   PATCH /api/v1/projects/:projectId/vote
// @desc    Vote on project
// @access  Private
router.patch(
    '/:projectId/vote',
    protect,
    voteLimiter,
    antiSpamVote,
    sanitizeMiddleware,
    validateParams(objectIdSchema('projectId')),
    validateBody(voteOnProjectSchema),
    projectController.voteOnProject
);

// @route   POST /api/v1/projects/:projectId/report
// @desc    Report project
// @access  Private
router.post(
    '/:projectId/report',
    protect,
    reportLimiter,
    antiSpamReport,
    sanitizeMiddleware,
    validateParams(objectIdSchema('projectId')),
    validateBody(reportProjectSchema),
    projectController.reportProject
);

module.exports = router;
