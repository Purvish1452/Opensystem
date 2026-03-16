const catchAsync = require('../utils/catchAsync');
const userService = require('../services/user/user.service');
const profileService = require('../services/user/profile.service');
const projectService = require('../services/user/project.service');

/**
 * User Controller
 * Thin layer — no business logic, only request/response handling.
 * All responses follow: { success, message, data }
 */

// ─── Existing Handlers (unchanged) ───────────────────────────────────────────

const getMe = catchAsync(async (req, res) => {
    const user = await userService.getCurrentUser(req.user._id);
    res.status(200).json({ success: true, message: 'Profile retrieved successfully', data: { user } });
}, 'controller');

const updateProfile = catchAsync(async (req, res) => {
    const user = await profileService.updateProfile(req.user._id, req.body, req);
    res.status(200).json({ success: true, message: 'Profile updated successfully', data: { user } });
}, 'controller');

const updatePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await profileService.updatePassword(req.user._id, currentPassword, newPassword, req);
    res.status(200).json({ success: true, message: result.message, data: null });
}, 'controller');

const updateSkills = catchAsync(async (req, res) => {
    const user = await profileService.updateSkills(req.user._id, req.body.skills, req);
    res.status(200).json({ success: true, message: 'Skills updated successfully', data: { user } });
}, 'controller');

const searchUsers = catchAsync(async (req, res) => {
    const { query, userType, expertise, domains, page, limit } = req.query;
    const expertiseArr = expertise ? expertise.split(',').map(s => s.trim()) : undefined;
    const domainsArr = domains ? domains.split(',').map(s => s.trim()) : undefined;
    const result = await userService.searchUsers(
        query,
        { userType, expertise: expertiseArr, domains: domainsArr },
        { page: parseInt(page), limit: parseInt(limit) }
    );
    res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result.users,
        meta: { pagination: result.pagination }
    });
}, 'controller');

// ─── Link Handlers ────────────────────────────────────────────────────────────

const addLink = catchAsync(async (req, res) => {
    const link = await userService.addLink(req.user._id, req.body, req);
    res.status(201).json({ success: true, message: 'Link added successfully', data: { link } });
}, 'controller');

const updateLink = catchAsync(async (req, res) => {
    const link = await userService.updateLink(req.user._id, req.params.linkId, req.body, req);
    res.status(200).json({ success: true, message: 'Link updated successfully', data: { link } });
}, 'controller');

const removeLink = catchAsync(async (req, res) => {
    const result = await userService.removeLink(req.user._id, req.params.linkId, req);
    res.status(200).json({ success: true, message: result.message, data: null });
}, 'controller');

// ─── Project Handlers ─────────────────────────────────────────────────────────

const getMyProjects = catchAsync(async (req, res) => {
    const { page, limit, status } = req.query;
    const result = await projectService.getUserProjects(
        req.user._id,
        { page: parseInt(page) || 1, limit: parseInt(limit) || 10, status },
        true // isOwnProfile
    );
    res.status(200).json({
        success: true,
        message: 'Projects retrieved successfully',
        data: result.projects,
        meta: { pagination: result.pagination }
    });
}, 'controller');

const createProject = catchAsync(async (req, res) => {
    const project = await projectService.createProject(req.user._id, req.body, req);
    res.status(201).json({ success: true, message: 'Project created successfully', data: { project } });
}, 'controller');

const updateProject = catchAsync(async (req, res) => {
    const project = await projectService.updateProject(req.user._id, req.params.projectId, req.body, req);
    res.status(200).json({ success: true, message: 'Project updated successfully', data: { project } });
}, 'controller');

const deleteProject = catchAsync(async (req, res) => {
    const result = await projectService.deleteProject(req.user._id, req.params.projectId, req);
    res.status(200).json({ success: true, message: result.message, data: null });
}, 'controller');

// ─── Expertise & Domain Handlers ──────────────────────────────────────────────

const updateExpertise = catchAsync(async (req, res) => {
    const expertise = await userService.updateExpertise(req.user._id, req.body.expertise, req);
    res.status(200).json({ success: true, message: 'Expertise updated successfully', data: { expertise } });
}, 'controller');

const updateDomains = catchAsync(async (req, res) => {
    const domains = await userService.updateDomains(req.user._id, req.body.domains, req);
    res.status(200).json({ success: true, message: 'Interested domains updated successfully', data: { domains } });
}, 'controller');

module.exports = {
    getMe, updateProfile, updatePassword, updateSkills, searchUsers,
    addLink, updateLink, removeLink,
    getMyProjects, createProject, updateProject, deleteProject,
    updateExpertise, updateDomains
};
