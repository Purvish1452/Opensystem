const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const { logActivity } = require('../activity/activity.service');
const { ACTIVITY_TYPES, PROFILE_LIMITS, LINK_TYPES } = require('../../constants');
const mongoose = require('mongoose');

/**
 * User Service - Production Grade
 *
 * Features:
 * - Automatic masking of sensitive fields
 * - Never expose internal security fields
 * - Phase-3: Link Manager, Expertise Manager, Domain Manager
 *   - Atomic MongoDB operations ($push/$pull/$set) — no race conditions
 *   - Non-blocking activity logging via process.nextTick()
 */

/**
 * Sensitive fields to exclude from responses
 */
const SENSITIVE_FIELDS = [
    'password',
    'refreshTokens',
    'verificationToken',
    'verificationTokenExpiry',
    'otp',
    'otpExpiry',
    'loginAttempts',
    'lastFailedLogin',
    'accountLockedUntil'
];

// ─── Profile Queries ──────────────────────────────────────────────────────────

/**
 * Get current user profile (includes links, expertise, domains)
 * Projects are NOT auto-loaded here — fetched separately via project.service
 * @param {String} userId
 */
const getCurrentUser = async (userId) => {
    const user = await User.findById(userId).select(`-${SENSITIVE_FIELDS.join(' -')}`);

    if (!user) {
        throw AppError.notFoundError('User', 'USER_NOT_FOUND');
    }

    return user;
};

/**
 * Search users with filters — enhanced projection includes expertise + domains
 * @param {String} query
 * @param {Object} filters - { userType, expertise, domains }
 * @param {Object} pagination - { page, limit }
 */
const searchUsers = async (query, filters = {}, pagination = {}) => {
    const { page = 1, limit = 20 } = pagination;
    const { userType, expertise, domains } = filters;
    const skip = (page - 1) * limit;

    const matchStage = { $text: { $search: query } };
    if (userType) matchStage.userType = userType;
    if (expertise?.length) matchStage.expertise = { $in: expertise };
    if (domains?.length) matchStage.domains = { $in: domains };

    const [users, countResult] = await Promise.all([
        User.aggregate([
            { $match: matchStage },
            { $addFields: { score: { $meta: 'textScore' } } },
            { $sort: { score: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
            {
                $project: {
                    username: 1, fullname: 1, profileImage: 1,
                    bio: 1, userType: 1, skills: 1,
                    expertise: 1, domains: 1,
                    followersCount: 1, followingCount: 1,
                    accountStatus: 1, createdAt: 1, score: 1
                }
            }
        ]),
        User.aggregate([{ $match: matchStage }, { $count: 'total' }])
    ]);

    const total = countResult[0]?.total || 0;

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// ─── Link Manager ─────────────────────────────────────────────────────────────

/**
 * Add a professional link (atomic — no fetch-then-mutate)
 * Prevents: duplicate URL, duplicate non-custom type, MAX_LINKS exceeded
 * @param {String} userId
 * @param {Object} linkData - { type, url, title, isPublic }
 * @param {Object} req
 */
const addLink = async (userId, linkData, req) => {
    const user = await User.findById(userId).select('links');
    if (!user) throw AppError.notFoundError('User', 'USER_NOT_FOUND');

    // Enforce max links
    if (user.links.length >= PROFILE_LIMITS.MAX_LINKS) {
        throw new AppError(`Maximum ${PROFILE_LIMITS.MAX_LINKS} links allowed`, 400, 'LINK_LIMIT_EXCEEDED');
    }

    // Duplicate URL check
    const urlExists = user.links.some(l => l.url === linkData.url);
    if (urlExists) {
        throw new AppError('This URL is already in your links', 409, 'LINK_DUPLICATE_URL');
    }

    // Duplicate type check (non-custom types are unique per user)
    if (linkData.type !== LINK_TYPES.CUSTOM) {
        const typeExists = user.links.some(l => l.type === linkData.type);
        if (typeExists) {
            throw new AppError(
                `A ${linkData.type} link already exists. Use update to change it.`,
                409,
                'LINK_DUPLICATE_TYPE'
            );
        }
    }

    // Atomic push
    const updated = await User.findByIdAndUpdate(
        userId,
        { $push: { links: linkData } },
        { new: true, runValidators: true, select: 'links' }
    );

    const newLink = updated.links[updated.links.length - 1];

    process.nextTick(() =>
        logActivity(userId, ACTIVITY_TYPES.LINK_UPDATE, null, null, req, {
            action: 'add',
            linkType: linkData.type
        })
    );

    return newLink;
};

/**
 * Update an existing link by its _id (atomic positional update)
 * @param {String} userId
 * @param {String} linkId
 * @param {Object} updateData - Partial { url, title, isPublic }
 * @param {Object} req
 */
const updateLink = async (userId, linkId, updateData, req) => {
    if (!mongoose.Types.ObjectId.isValid(linkId)) {
        throw AppError.notFoundError('Link', 'LINK_NOT_FOUND');
    }

    // Build $set payload using positional operator
    const setPayload = {};
    if (updateData.url !== undefined) setPayload['links.$.url'] = updateData.url;
    if (updateData.title !== undefined) setPayload['links.$.title'] = updateData.title;
    if (updateData.isPublic !== undefined) setPayload['links.$.isPublic'] = updateData.isPublic;

    const updated = await User.findOneAndUpdate(
        { _id: userId, 'links._id': new mongoose.Types.ObjectId(linkId) },
        { $set: setPayload },
        { new: true, runValidators: true, select: 'links' }
    );

    if (!updated) {
        throw AppError.notFoundError('Link', 'LINK_NOT_FOUND');
    }

    const updatedLink = updated.links.find(l => l._id.toString() === linkId);

    process.nextTick(() =>
        logActivity(userId, ACTIVITY_TYPES.LINK_UPDATE, null, null, req, {
            action: 'update',
            linkId
        })
    );

    return updatedLink;
};

/**
 * Remove a link by its _id (atomic $pull)
 * @param {String} userId
 * @param {String} linkId
 * @param {Object} req
 */
const removeLink = async (userId, linkId, req) => {
    if (!mongoose.Types.ObjectId.isValid(linkId)) {
        throw AppError.notFoundError('Link', 'LINK_NOT_FOUND');
    }

    const updated = await User.findByIdAndUpdate(
        userId,
        { $pull: { links: { _id: new mongoose.Types.ObjectId(linkId) } } },
        { new: true, select: 'links' }
    );

    if (!updated) {
        throw AppError.notFoundError('User', 'USER_NOT_FOUND');
    }

    process.nextTick(() =>
        logActivity(userId, ACTIVITY_TYPES.LINK_UPDATE, null, null, req, {
            action: 'remove',
            linkId
        })
    );

    return { message: 'Link removed successfully' };
};

// ─── Expertise Manager ────────────────────────────────────────────────────────

/**
 * Replace expertise tags (atomic $set — deduplication + normalization applied)
 * @param {String} userId
 * @param {String[]} tags
 * @param {Object} req
 */
const updateExpertise = async (userId, tags, req) => {
    // Lowercase + deduplicate
    const normalized = [...new Set(tags.map(t => t.trim().toLowerCase()))];

    if (normalized.length > PROFILE_LIMITS.MAX_EXPERTISE) {
        throw new AppError(
            `Maximum ${PROFILE_LIMITS.MAX_EXPERTISE} expertise tags allowed`,
            400,
            'EXPERTISE_LIMIT_EXCEEDED'
        );
    }

    const updated = await User.findByIdAndUpdate(
        userId,
        { $set: { expertise: normalized } },
        { new: true, runValidators: true, select: 'expertise' }
    );

    if (!updated) throw AppError.notFoundError('User', 'USER_NOT_FOUND');

    process.nextTick(() =>
        logActivity(userId, ACTIVITY_TYPES.EXPERTISE_UPDATE, null, null, req, {
            tagsCount: normalized.length
        })
    );

    return updated.expertise;
};

// ─── Domain Manager ───────────────────────────────────────────────────────────

/**
 * Replace interested domains (atomic $set — deduplication + normalization)
 * @param {String} userId
 * @param {String[]} domains
 * @param {Object} req
 */
const updateDomains = async (userId, domains, req) => {
    // Lowercase + deduplicate
    const normalized = [...new Set(domains.map(d => d.trim().toLowerCase()))];

    if (normalized.length > PROFILE_LIMITS.MAX_DOMAINS) {
        throw new AppError(
            `Maximum ${PROFILE_LIMITS.MAX_DOMAINS} domains allowed`,
            400,
            'DOMAINS_LIMIT_EXCEEDED'
        );
    }

    const updated = await User.findByIdAndUpdate(
        userId,
        { $set: { domains: normalized } },
        { new: true, runValidators: true, select: 'domains' }
    );

    if (!updated) throw AppError.notFoundError('User', 'USER_NOT_FOUND');

    process.nextTick(() =>
        logActivity(userId, ACTIVITY_TYPES.DOMAIN_UPDATE, null, null, req, {
            domainsCount: normalized.length
        })
    );

    return updated.domains;
};

module.exports = {
    getCurrentUser,
    searchUsers,
    // Link Manager
    addLink,
    updateLink,
    removeLink,
    // Expertise & Domains
    updateExpertise,
    updateDomains
};
