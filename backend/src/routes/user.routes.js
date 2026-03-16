const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { validateBody } = require('../middlewares/validate.middleware');
const sanitizeMiddleware = require('../middlewares/sanitize.middleware');
const { authLimiter, generalLimiter } = require('../middlewares/rateLimit.middleware');
const userController = require('../controllers/user.controller');
const {
    updateProfileSchema,
    updatePasswordSchema,
    updateSkillsSchema
} = require('../validators/user.validator');
const {
    addLinkSchema,
    updateLinkSchema,
    createProjectSchema,
    updateProjectSchema,
    updateExpertiseSchema,
    updateDomainsSchema
} = require('../validators/profile.validator');

/**
 * User Routes — All under /api/v1/users
 *
 * Rate Limiters:
 *   authLimiter    → used as profileWriteLimiter for write endpoints
 *   generalLimiter → used for read endpoints
 */

// ─── Existing Routes (unchanged) ─────────────────────────────────────────────

// GET /api/v1/users/me
router.get('/me', protect, userController.getMe);

// PATCH /api/v1/users/profile
router.patch(
    '/profile',
    protect, authLimiter, sanitizeMiddleware,
    validateBody(updateProfileSchema),
    userController.updateProfile
);

// PATCH /api/v1/users/password
router.patch(
    '/password',
    protect, authLimiter, sanitizeMiddleware,
    validateBody(updatePasswordSchema),
    userController.updatePassword
);

// PATCH /api/v1/users/skills
router.patch(
    '/skills',
    protect, authLimiter, sanitizeMiddleware,
    validateBody(updateSkillsSchema),
    userController.updateSkills
);

// GET /api/v1/users/search?query=&userType=&expertise=&domains=
// enhanced: now supports expertise and domains filter (comma-separated)
router.get('/search', generalLimiter, userController.searchUsers);

// ─── Professional Links ───────────────────────────────────────────────────────

// POST /api/v1/users/links  (add a new link)
router.post(
    '/links',
    protect, authLimiter, sanitizeMiddleware,
    validateBody(addLinkSchema),
    userController.addLink
);

// PATCH /api/v1/users/links/:linkId  (update existing link)
router.patch(
    '/links/:linkId',
    protect, authLimiter, sanitizeMiddleware,
    validateBody(updateLinkSchema),
    userController.updateLink
);

// DELETE /api/v1/users/links/:linkId  (remove a link)
router.delete(
    '/links/:linkId',
    protect, authLimiter,
    userController.removeLink
);

// ─── Projects ─────────────────────────────────────────────────────────────────

// GET /api/v1/users/projects?page=&limit=&status=
router.get('/projects', protect, generalLimiter, userController.getMyProjects);

// POST /api/v1/users/projects  (create)
router.post(
    '/projects',
    protect, authLimiter, sanitizeMiddleware,
    validateBody(createProjectSchema),
    userController.createProject
);

// PATCH /api/v1/users/projects/:projectId  (update)
router.patch(
    '/projects/:projectId',
    protect, authLimiter, sanitizeMiddleware,
    validateBody(updateProjectSchema),
    userController.updateProject
);

// DELETE /api/v1/users/projects/:projectId  (soft delete)
router.delete(
    '/projects/:projectId',
    protect, authLimiter,
    userController.deleteProject
);

// ─── Expertise & Domains ──────────────────────────────────────────────────────

// PATCH /api/v1/users/expertise
router.patch(
    '/expertise',
    protect, authLimiter, sanitizeMiddleware,
    validateBody(updateExpertiseSchema),
    userController.updateExpertise
);

// PATCH /api/v1/users/domains
router.patch(
    '/domains',
    protect, authLimiter, sanitizeMiddleware,
    validateBody(updateDomainsSchema),
    userController.updateDomains
);

module.exports = router;
