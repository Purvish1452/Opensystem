const asyncHandler = require('../../middlewares/asyncHandler');
const adminService = require('./admin.service');
const { resolveSuspicious, getSuspiciousUsers } = require('../security/detection.service');
const { adjustRiskScore } = require('../security/risk.service');
const AdminAuditLog = require('../../models/AdminAuditLog');
const {
    suspendSchema, unlockSchema, forceLogoutSchema, adjustRiskSchema, resolveSchema,
    adminCreatePostSchema, adminUpdatePostSchema, adminCreateProjectSchema, adminUpdateProjectSchema,
    reasonSchema, validate
} = require('./admin.validator');
const { STATUS_CODES, MESSAGES } = require('../../constants');
const adminPostService = require('./admin.post.service');
const adminProjectService = require('./admin.project.service');

/**
 * Admin Controller — Phase-4
 * Thin handlers: validate → service → respond
 * Response schema: { success, message, data, auditId? }
 */

// GET /admin/overview
const getOverview = asyncHandler(async (req, res) => {
    const data = await adminService.getOverview();
    res.status(STATUS_CODES.OK).json({ success: true, message: 'Overview retrieved', data });
});

// GET /admin/users
const listUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, riskScore, accountStatus, search } = req.query;
    const data = await adminService.listUsers(
        { riskScore, accountStatus, search },
        parseInt(page),
        Math.min(parseInt(limit), 100)
    );
    res.status(STATUS_CODES.OK).json({ success: true, message: 'User list retrieved', data });
});

// GET /admin/users/:userId
const getUserDetail = asyncHandler(async (req, res) => {
    const data = await adminService.getUserDetail(req.params.userId);
    res.status(STATUS_CODES.OK).json({ success: true, message: 'User detail retrieved', data });
});

// PATCH /admin/users/:userId/suspend
const suspendUser = asyncHandler(async (req, res) => {
    const { reason } = validate(suspendSchema, req.body);
    const { user, auditId } = await adminService.suspendUser(
        req.params.userId, req.adminId, reason, req
    );
    res.status(STATUS_CODES.OK).json({
        success: true, message: MESSAGES.USER_SUSPENDED,
        data: { userId: user._id, accountStatus: user.accountStatus },
        auditId
    });
});

// PATCH /admin/users/:userId/unlock
const unlockUser = asyncHandler(async (req, res) => {
    const { reason } = validate(unlockSchema, req.body);
    const { user, auditId } = await adminService.unlockUser(
        req.params.userId, req.adminId, reason, req
    );
    res.status(STATUS_CODES.OK).json({
        success: true, message: MESSAGES.USER_UNLOCKED,
        data: { userId: user._id, accountStatus: user.accountStatus },
        auditId
    });
});

// PATCH /admin/users/:userId/force-logout
const forceLogout = asyncHandler(async (req, res) => {
    const { reason } = validate(forceLogoutSchema, req.body);
    const { user, auditId } = await adminService.forceLogout(
        req.params.userId, req.adminId, reason, req
    );
    res.status(STATUS_CODES.OK).json({
        success: true, message: MESSAGES.FORCE_LOGOUT_SUCCESS,
        data: { userId: user._id },
        auditId
    });
});

// PATCH /admin/users/:userId/risk
const adjustRisk = asyncHandler(async (req, res) => {
    const { delta, reason } = validate(adjustRiskSchema, req.body);
    const result = await adjustRiskScore(req.params.userId, delta, req.adminId, req);
    res.status(STATUS_CODES.OK).json({
        success: true, message: MESSAGES.RISK_ADJUSTED, data: result
    });
});

// GET /admin/suspicious
const getSuspicious = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type } = req.query;
    const data = await getSuspiciousUsers(parseInt(page), Math.min(parseInt(limit), 100), type ? { type } : {});
    res.status(STATUS_CODES.OK).json({ success: true, message: 'Suspicious activity queue', data });
});

// GET /admin/suspicious/:userId
const getSuspiciousForUser = asyncHandler(async (req, res) => {
    const SuspiciousActivity = require('../../models/SuspiciousActivity');
    const flags = await SuspiciousActivity.find({ userId: req.params.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
    res.status(STATUS_CODES.OK).json({ success: true, message: 'User suspicious flags', data: { flags } });
});

// PATCH /admin/suspicious/:flagId/resolve
const resolveFlag = asyncHandler(async (req, res) => {
    const { note } = validate(resolveSchema, req.body);
    const flag = await resolveSuspicious(req.params.flagId, req.adminId, note, req);
    res.status(STATUS_CODES.OK).json({
        success: true, message: MESSAGES.SUSPICIOUS_RESOLVED, data: { flagId: flag._id }
    });
});

// GET /admin/audit
const getAuditLog = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const logs = await AdminAuditLog.getAdminActions(req.adminId, parseInt(page), Math.min(parseInt(limit), 100));
    res.status(STATUS_CODES.OK).json({ success: true, message: 'Admin audit trail', data: { logs } });
});

module.exports = {
    getOverview, listUsers, getUserDetail,
    suspendUser, unlockUser, forceLogout, adjustRisk,
    getSuspicious, getSuspiciousForUser, resolveFlag,
    getAuditLog,
    // ─── Admin Post CRUD ──────────────────────────────────────────────────────
    listAllPosts: asyncHandler(async (req, res) => {
        const { page = 1, limit = 20, author, visibility, moderationStatus, includeDeleted } = req.query;
        const data = await adminPostService.listAllPosts(
            { author, visibility, moderationStatus, includeDeleted: includeDeleted === 'true' },
            parseInt(page), Math.min(parseInt(limit), 100)
        );
        res.status(STATUS_CODES.OK).json({ success: true, message: 'Posts retrieved', data });
    }),

    listPostsByUser: asyncHandler(async (req, res) => {
        const { page = 1, limit = 20 } = req.query;
        const data = await adminPostService.listPostsByUser(
            req.params.userId, parseInt(page), Math.min(parseInt(limit), 100)
        );
        res.status(STATUS_CODES.OK).json({ success: true, message: 'User posts retrieved', data });
    }),

    adminGetPost: asyncHandler(async (req, res) => {
        const data = await adminPostService.adminGetPost(req.params.postId);
        res.status(STATUS_CODES.OK).json({ success: true, message: 'Post retrieved', data });
    }),

    adminCreatePost: asyncHandler(async (req, res) => {
        const body = validate(adminCreatePostSchema, req.body);
        const data = await adminPostService.adminCreatePost(req.adminId, body, req);
        res.status(STATUS_CODES.CREATED).json({ success: true, message: MESSAGES.ADMIN_POST_CREATED, data });
    }),

    adminUpdatePost: asyncHandler(async (req, res) => {
        const { reason, ...updates } = validate(adminUpdatePostSchema, req.body);
        const data = await adminPostService.adminUpdatePost(req.adminId, req.params.postId, updates, reason, req);
        res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.ADMIN_POST_UPDATED, data });
    }),

    adminDeletePost: asyncHandler(async (req, res) => {
        const { reason } = validate(reasonSchema, req.body);
        const data = await adminPostService.adminDeletePost(req.adminId, req.params.postId, reason, req);
        res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.ADMIN_POST_DELETED, data });
    }),

    // ─── Admin Project CRUD ───────────────────────────────────────────────────
    listAllProjects: asyncHandler(async (req, res) => {
        const { page = 1, limit = 20, owner, status, projectStage, techStack, includeDeleted } = req.query;
        const data = await adminProjectService.listAllProjects(
            { owner, status, projectStage, techStack, includeDeleted: includeDeleted === 'true' },
            parseInt(page), Math.min(parseInt(limit), 100)
        );
        res.status(STATUS_CODES.OK).json({ success: true, message: 'Projects retrieved', data });
    }),

    listProjectsByUser: asyncHandler(async (req, res) => {
        const { page = 1, limit = 20 } = req.query;
        const data = await adminProjectService.listProjectsByUser(
            req.params.userId, parseInt(page), Math.min(parseInt(limit), 100)
        );
        res.status(STATUS_CODES.OK).json({ success: true, message: 'User projects retrieved', data });
    }),

    adminGetProject: asyncHandler(async (req, res) => {
        const data = await adminProjectService.adminGetProject(req.params.projectId);
        res.status(STATUS_CODES.OK).json({ success: true, message: 'Project retrieved', data });
    }),

    adminCreateProject: asyncHandler(async (req, res) => {
        const body = validate(adminCreateProjectSchema, req.body);
        const data = await adminProjectService.adminCreateProject(req.adminId, body, req);
        res.status(STATUS_CODES.CREATED).json({ success: true, message: MESSAGES.ADMIN_PROJECT_CREATED, data });
    }),

    adminUpdateProject: asyncHandler(async (req, res) => {
        const { reason, ...updates } = validate(adminUpdateProjectSchema, req.body);
        const data = await adminProjectService.adminUpdateProject(req.adminId, req.params.projectId, updates, reason, req);
        res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.ADMIN_PROJECT_UPDATED, data });
    }),

    adminDeleteProject: asyncHandler(async (req, res) => {
        const { reason } = validate(reasonSchema, req.body);
        const data = await adminProjectService.adminDeleteProject(req.adminId, req.params.projectId, reason, req);
        res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.ADMIN_PROJECT_DELETED, data });
    }),
};

