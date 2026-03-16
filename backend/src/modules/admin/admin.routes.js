const express = require('express');
const router = express.Router();
const { requireAdmin } = require('./admin.middleware');
const { adminLimiter, adminWriteLimiter } = require('../../middlewares/rateLimit.middleware');
const ctrl = require('./admin.controller');

/**
 * Admin Routes — Phase-4
 * All routes (except /login) require: adminLimiter → protect → authorize('admin') → injectAuditContext
 * Destructive write routes additionally use adminWriteLimiter
 */

// ─── Overview & Stats ─────────────────────────────────────────────────────────
router.get('/overview', ...requireAdmin, ctrl.getOverview);

// ─── User Management ──────────────────────────────────────────────────────────
// GET  /admin/users?riskScore=high&accountStatus=suspended&search=...&page=1&limit=20
router.get('/users', ...requireAdmin, ctrl.listUsers);
// GET  /admin/users/:userId
router.get('/users/:userId', ...requireAdmin, ctrl.getUserDetail);

// PATCH: state-mutating routes — additional write limiter
router.patch('/users/:userId/suspend', adminWriteLimiter, ...requireAdmin, ctrl.suspendUser);
router.patch('/users/:userId/unlock', adminWriteLimiter, ...requireAdmin, ctrl.unlockUser);
router.patch('/users/:userId/force-logout', adminWriteLimiter, ...requireAdmin, ctrl.forceLogout);
router.patch('/users/:userId/risk', adminWriteLimiter, ...requireAdmin, ctrl.adjustRisk);

// ─── Suspicious Activity ──────────────────────────────────────────────────────
router.get('/suspicious', ...requireAdmin, ctrl.getSuspicious);
router.get('/suspicious/:userId', ...requireAdmin, ctrl.getSuspiciousForUser);
router.patch('/suspicious/:flagId/resolve', adminWriteLimiter, ...requireAdmin, ctrl.resolveFlag);

// ─── Audit Trail ──────────────────────────────────────────────────────────────
router.get('/audit', ...requireAdmin, ctrl.getAuditLog);

// ─── Admin Post CRUD ──────────────────────────────────────────────────────────
router.get('/posts', ...requireAdmin, ctrl.listAllPosts);
router.get('/posts/user/:userId', ...requireAdmin, ctrl.listPostsByUser);
router.get('/posts/:postId', ...requireAdmin, ctrl.adminGetPost);
router.post('/posts', adminWriteLimiter, ...requireAdmin, ctrl.adminCreatePost);
router.patch('/posts/:postId', adminWriteLimiter, ...requireAdmin, ctrl.adminUpdatePost);
router.delete('/posts/:postId', adminWriteLimiter, ...requireAdmin, ctrl.adminDeletePost);

// ─── Admin Project CRUD ───────────────────────────────────────────────────────
router.get('/projects', ...requireAdmin, ctrl.listAllProjects);
router.get('/projects/user/:userId', ...requireAdmin, ctrl.listProjectsByUser);
router.get('/projects/:projectId', ...requireAdmin, ctrl.adminGetProject);
router.post('/projects', adminWriteLimiter, ...requireAdmin, ctrl.adminCreateProject);
router.patch('/projects/:projectId', adminWriteLimiter, ...requireAdmin, ctrl.adminUpdateProject);
router.delete('/projects/:projectId', adminWriteLimiter, ...requireAdmin, ctrl.adminDeleteProject);

module.exports = router;

