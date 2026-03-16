/**
 * Application-wide Constants
 * Centralized location for all constant values used across the application
 * Phase-2: Extended with comprehensive enums for Problem Feed and Developer Mode
 * Phase-3: Professional Profile System — Links, Projects, Expertise, Domains
 * Phase-4: Admin Role System — RBAC, Audit, Risk Scoring, Suspicious Activity
 * Phase-5: Content Moderation & Verification System
 */

// Re-export external config enums (kept in separate files to avoid bloat)
const { TECH_STACK } = require('./techStack.config');
const { EXPERTISE_TAGS } = require('./expertiseTags.config');
const { DOMAIN_TAGS } = require('./domainTags.config');

// User Roles
const ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator'
});

/**
 * isAdmin — centralized role check helper
 * Use this instead of raw string comparison across the codebase
 * @param {Object} user - req.user from protect middleware
 * @returns {Boolean}
 */
const isAdmin = (user) => user?.role === ROLES.ADMIN;

// User Types
const USER_TYPES = {
  STUDENT: 'student',
  PROFESSIONAL: 'professional'
};

// Account Status
const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: 'active',
  PENDING_VERIFICATION: 'pending_verification',
  SUSPENDED: 'suspended',
  BANNED: 'banned'
});

// Login Methods
const LOGIN_METHOD = Object.freeze({
  EMAIL: 'email',
  GOOGLE: 'google',
  GITHUB: 'github'
});

// Professional Link Types
const LINK_TYPES = Object.freeze({
  LINKEDIN: 'linkedin',
  GITHUB: 'github',
  INSTAGRAM: 'instagram',
  LEETCODE: 'leetcode',
  CODEFORCES: 'codeforces',
  CODECHEF: 'codechef',
  HACKERRANK: 'hackerrank',
  PORTFOLIO: 'portfolio',
  RESUME: 'resume',
  CUSTOM: 'custom'
});

// Profile Section Limits
const PROFILE_LIMITS = Object.freeze({
  MAX_LINKS: 15,
  MAX_PROJECTS: 50,
  MAX_EXPERTISE: 15,
  MAX_DOMAINS: 10,
  MAX_TECH_STACK_PER_PROJECT: 10,
  MAX_SKILLS_ACQUIRED_PER_PROJECT: 15,
  PROJECT_TITLE_MAX: 100,
  PROJECT_DESC_MAX: 1000,
  LINK_TITLE_MAX: 60
});

// Post Visibility
const POST_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  FOLLOWERS: 'followers'
};

// Content Types
const CONTENT_TYPE = {
  DISCUSSION: 'discussion',
  PROBLEM: 'problem',
  IDEA: 'idea',
  QUESTION: 'question'
};

// Project Stages
const PROJECT_STAGES = {
  IDEA: 'idea',
  PROTOTYPE: 'prototype',
  PRODUCTION: 'production'
};

// Project Status
const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

// Requirement Types
const REQUIREMENT_TYPES = {
  OPEN_SOURCE: 'openSource',
  LIMITED_MEMBERS: 'limitedMembers'
};

// Project Roles
const PROJECT_ROLES = {
  CONTRIBUTOR: 'contributor',
  DESIGNER: 'designer',
  BACKEND: 'backend',
  FRONTEND: 'frontend',
  TESTER: 'tester'
};

// Activity Types
const ACTIVITY_TYPES = Object.freeze({
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  OAUTH_REGISTER: 'oauth_register',
  FAILED_LOGIN: 'failed_login',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_CHANGE: 'password_change',
  PROFILE_UPDATE: 'profile_update',
  OTP_GENERATED: 'otp_generated',
  POST_CREATE: 'post_create',
  POST_UPDATE: 'post_update',
  POST_DELETE: 'post_delete',
  VOTE: 'vote',
  COMMENT: 'comment',
  COMMENT_UPDATE: 'comment_update',
  COMMENT_DELETE: 'comment_delete',
  ENROLL: 'enroll',
  ENROLL_APPROVE: 'enroll_approve',
  ENROLL_REJECT: 'enroll_reject',
  REPORT: 'report',
  PROJECT_CREATE: 'project_create',
  PROJECT_UPDATE: 'project_update',
  PROJECT_DELETE: 'project_delete',
  SEARCH: 'search',
  ADMIN_ACTION: 'admin_action',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  // Professional Profile
  LINK_UPDATE: 'link_update',
  USER_PROJECT_CREATE: 'user_project_create',
  USER_PROJECT_UPDATE: 'user_project_update',
  USER_PROJECT_DELETE: 'user_project_delete',
  EXPERTISE_UPDATE: 'expertise_update',
  DOMAIN_UPDATE: 'domain_update',
  // Phase-5: Content Moderation
  CONTENT_FLAGGED: 'content_flagged',
  CONTENT_BLOCKED: 'content_blocked',
  MODERATION_REVIEW: 'moderation_review'
});

// ─── Content Moderation System — Phase-5 ───────────────────────────────────

/**
 * Scoring thresholds: 0-39 clean, 40-79 flagged, 80-100 blocked
 * Severity labels used across the service, middleware, and admin panel
 */
const CONTENT_MODERATION = Object.freeze({
  THRESHOLDS: Object.freeze({
    CLEAN: 0,
    FLAG: 40,
    BLOCK: 80,
  }),
  SEVERITY: Object.freeze({
    CLEAN: 'clean',
    FLAGGED: 'flagged',
    BLOCKED: 'blocked',
  }),
  MESSAGES: Object.freeze({
    BLOCKED: 'Your content contains prohibited material and cannot be submitted.',
    FLAGGED: 'Your content has been flagged for review. Please revise or wait for admin approval.',
    CLEAN: 'Content passed moderation.',
  }),
  VIOLATION_TYPES: Object.freeze({
    HATE_SPEECH: 'hate_speech',
    EXPLICIT_SEXUAL: 'explicit_sexual',
    VIOLENCE_THREATS: 'violence_threats',
    HARASSMENT: 'harassment',
    SELF_HARM: 'self_harm',
    SPAM_PHRASES: 'spam_phrases',
    EXCESSIVE_CAPS: 'excessive_caps',
    SYMBOL_SPAM: 'symbol_spam',
    REPEATED_WORDS: 'repeated_words',
    SUSPICIOUS_URLS: 'suspicious_urls',
    RUNTIME: 'runtime',
  }),
});

// Admin moderation actions (for admin panel review workflow)
const MODERATION_ACTIONS = Object.freeze({
  APPROVE: 'approve',
  REJECT: 'reject',
  ESCALATE: 'escalate',  // Bump to manual admin review
  ADD_WORD: 'add_profanity_word',
  REMOVE_WORD: 'remove_profanity_word',
});

// ─── Admin Role System — Phase-4 ────────────────────────────────────────────

// Admin audit action types (immutable — used in AdminAuditLog)
const ADMIN_ACTIONS = Object.freeze({
  SUSPEND_USER: 'suspend_user',
  UNLOCK_USER: 'unlock_user',
  FORCE_LOGOUT: 'force_logout',
  RESOLVE_SUSPICIOUS: 'resolve_suspicious',
  ADJUST_RISK_SCORE: 'adjust_risk_score',
  BAN_USER: 'ban_user',
  // Post CRUD
  CREATE_POST: 'create_post',
  UPDATE_POST: 'update_post',
  DELETE_POST: 'delete_post',
  // Project CRUD
  CREATE_PROJECT: 'create_project',
  UPDATE_PROJECT: 'update_project',
  DELETE_PROJECT: 'delete_project',
  // Reports & Moderation
  APPROVE_REPORT: 'approve_report',
  REJECT_REPORT: 'reject_report',
  PIN_POST: 'pin_post',
  UNPIN_POST: 'unpin_post',
  FLAG_CONTENT: 'flag_content',
  UNFLAG_CONTENT: 'unflag_content'
});

// Suspicious activity flag types
const SUSPICIOUS_TYPES = Object.freeze({
  BRUTE_FORCE: 'BRUTE_FORCE',
  TOKEN_REUSE: 'TOKEN_REUSE',
  PROJECT_SPAM: 'PROJECT_SPAM',
  PROFILE_SPAM: 'PROFILE_SPAM',
  GEO_ANOMALY: 'GEO_ANOMALY',
  LINK_SPAM: 'LINK_SPAM',
  MULTIPLE_ACCOUNTS: 'MULTIPLE_ACCOUNTS',
  RAPID_VOTING: 'RAPID_VOTING',
  CONTENT_VIOLATION: 'CONTENT_VIOLATION'   // Phase-5: content moderation flags
});

// Risk score weights per suspicious type
const RISK_SCORE_WEIGHTS = Object.freeze({
  [SUSPICIOUS_TYPES.BRUTE_FORCE]: 20,
  [SUSPICIOUS_TYPES.TOKEN_REUSE]: 40,
  [SUSPICIOUS_TYPES.PROJECT_SPAM]: 15,
  [SUSPICIOUS_TYPES.PROFILE_SPAM]: 10,
  [SUSPICIOUS_TYPES.GEO_ANOMALY]: 25,
  [SUSPICIOUS_TYPES.LINK_SPAM]: 10,
  [SUSPICIOUS_TYPES.MULTIPLE_ACCOUNTS]: 30,
  [SUSPICIOUS_TYPES.RAPID_VOTING]: 15,
  [SUSPICIOUS_TYPES.CONTENT_VIOLATION]: 20  // flagged=20, blocked content gets more via score
});

// Risk score thresholds
const RISK_THRESHOLDS = Object.freeze({
  AUTO_LOCK: 50,
  ADMIN_REVIEW: 80,
  MAX: 100,
  DECAY_PER_DAY: 5
});

// Admin security limits
const ADMIN_SECURITY = Object.freeze({
  MAX_LOGIN_ATTEMPTS: 3,
  LOCK_DURATION_MS: 30 * 60 * 1000,    // 30 minutes
  MAX_RISK_DELTA: 50,                   // max ±50 per manual adjustment
  OVERVIEW_CACHE_TTL_MS: 30 * 1000,     // 30-second in-memory cache
  AUDIT_METADATA_MAX_BYTES: 5120        // 5KB
});

// Moderation Status
const MODERATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FLAGGED: 'flagged'
};

// Report Severity
const REPORT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Vote Types
const VOTE_TYPES = {
  UPVOTE: 'upvote',
  DOWNVOTE: 'downvote',
  NEUTRAL: 'neutral'
};

// Notification Types (Phase-3 preparation)
const NOTIFICATION_TYPES = {
  PROJECT_APPROVAL: 'project_approval',
  COMMENT_REPLY: 'comment_reply',
  MENTION: 'mention',
  MODERATION_ALERT: 'moderation_alert',
  ENROLLMENT_UPDATE: 'enrollment_update',
  VOTE_MILESTONE: 'vote_milestone'
};

// Media Types
const MEDIA_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  CODE: 'code',
  DOCUMENT: 'document'
};

// HTTP Status Codes
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Response Messages
const MESSAGES = {
  // Success Messages
  SUCCESS: 'Operation successful',
  USER_CREATED: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  POST_CREATED: 'Post created successfully',
  PROJECT_CREATED: 'Project created successfully',
  COMMENT_ADDED: 'Comment added successfully',
  VOTE_RECORDED: 'Vote recorded successfully',
  REPORT_SUBMITTED: 'Report submitted successfully',

  // Error Messages
  INTERNAL_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_EXISTS: 'User already exists with this email',
  USERNAME_EXISTS: 'Username is already taken',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_REQUIRED: 'Authentication token required',
  VALIDATION_ERROR: 'Validation error',
  ACCOUNT_LOCKED: 'Account temporarily locked due to multiple failed login attempts',
  ACCOUNT_SUSPENDED: 'Account has been suspended',
  ACCOUNT_BANNED: 'Account has been banned',

  // Field Messages
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email format',
  PASSWORD_MIN_LENGTH: 'Password must be at least 10 characters',
  PASSWORD_STRONG: 'Password must contain uppercase, lowercase, number and special character',

  // Rate Limit Messages
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  SPAM_DETECTED: 'Suspicious activity detected, please slow down',

  // Feature Messages
  FEATURE_DISABLED: 'This feature is currently disabled',

  // Admin Messages
  ADMIN_ONLY: 'This route is restricted to administrators',
  USER_SUSPENDED: 'User account has been suspended successfully',
  USER_UNLOCKED: 'User account has been unlocked successfully',
  FORCE_LOGOUT_SUCCESS: 'All user sessions have been revoked',
  SUSPICIOUS_RESOLVED: 'Suspicious activity flag marked as resolved',
  RISK_ADJUSTED: 'Risk score adjusted successfully',
  ADMIN_SEED_EXISTS: 'Admin account already exists — aborting seed',
  ADMIN_SEED_SUCCESS: 'Admin account created successfully',
  // Admin CRUD — Posts
  ADMIN_POST_CREATED: 'Post created by admin successfully',
  ADMIN_POST_UPDATED: 'Post updated by admin successfully',
  ADMIN_POST_DELETED: 'Post deleted by admin successfully',
  // Admin CRUD — Projects
  ADMIN_PROJECT_CREATED: 'Project created by admin successfully',
  ADMIN_PROJECT_UPDATED: 'Project updated by admin successfully',
  ADMIN_PROJECT_DELETED: 'Project deleted by admin successfully',
  // Phase-5: Content Moderation
  CONTENT_BLOCKED: 'Content blocked by moderation',
  CONTENT_FLAGGED: 'Content flagged for review',
  MODERATION_APPROVED: 'Content approved successfully',
  MODERATION_REJECTED: 'Content rejected and removed',
  MODERATION_WORD_ADDED: 'Profanity word added to list',
  MODERATION_WORD_REMOVED: 'Profanity word removed from list'
};

// Token Expiry Times
const TOKEN_EXPIRY = {
  ACCESS_TOKEN: process.env.JWT_EXPIRE || '7d',
  REFRESH_TOKEN: process.env.REFRESH_TOKEN_EXPIRE || '30d',
  EMAIL_VERIFICATION: '24h',
  OTP: '10m'
};

// Pagination
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// File Upload
const FILE_UPLOAD = {
  MAX_IMAGE_SIZE: parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: parseInt(process.env.MAX_VIDEO_SIZE) || 50 * 1024 * 1024, // 50MB
  MAX_DOCUMENT_SIZE: parseInt(process.env.MAX_DOCUMENT_SIZE) || 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
  MAX_MEDIA_PER_POST: 10,
  MAX_CODE_SNIPPETS_PER_POST: 5
};

// Security Limits
const SECURITY_LIMITS = {
  MAX_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCK_TIME: 15 * 60 * 1000, // 15 minutes in milliseconds
  MAX_DEVICES: 5,
  PASSWORD_HISTORY_COUNT: 5, // Phase-3
  OTP_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 10
};

// Anti-Spam Limits
const ANTI_SPAM = {
  MAX_POSTS_PER_HOUR: 10,
  MAX_COMMENTS_PER_HOUR: 30,
  MAX_VOTES_PER_HOUR: 100,
  MAX_ENROLLMENTS_PER_DAY: 20,
  MAX_REPORTS_PER_HOUR: 10,
  MAX_PROJECTS_PER_DAY: 5,
  DUPLICATE_CONTENT_THRESHOLD: 0.9 // 90% similarity
};

// Search Constants
const SEARCH = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 100,
  MAX_RESULTS: 50
};

// Content Limits
const CONTENT_LIMITS = {
  POST_CONTENT_MIN: 1,
  POST_CONTENT_MAX: 5000,
  COMMENT_CONTENT_MIN: 1,
  COMMENT_CONTENT_MAX: 2000,
  PROJECT_TITLE_MIN: 5,
  PROJECT_TITLE_MAX: 100,
  PROJECT_DESCRIPTION_MIN: 10,
  PROJECT_DESCRIPTION_MAX: 2000,
  BIO_MAX: 500,
  SKILLS_MAX_COUNT: 20,
  SKILL_MAX_LENGTH: 30,
  TAGS_MAX_COUNT: 10,
  TAG_MAX_LENGTH: 30,
  TECH_STACK_MAX_COUNT: 15,
  MAX_COMMENT_DEPTH: 5,
  MAX_PROJECT_MEMBERS: 100
};

// Time Windows (for trending, analytics)
const TIME_WINDOWS = {
  HOUR_24: '24h',
  DAYS_7: '7d',
  DAYS_30: '30d',
  ALL_TIME: 'all'
};

// Cache TTL (Time To Live)
const CACHE_TTL = {
  TRENDING_POSTS: 5 * 60, // 5 minutes
  TRENDING_PROJECTS: 5 * 60, // 5 minutes
  USER_PROFILE: 10 * 60, // 10 minutes
  FEED: 2 * 60 // 2 minutes
};

// Activity Log Retention
const RETENTION = {
  ACTIVITY_LOG_DAYS: 90,
  NOTIFICATION_DAYS: 30
};

module.exports = {
  ROLES,
  USER_TYPES,
  ACCOUNT_STATUS,
  LOGIN_METHOD,
  POST_VISIBILITY,
  CONTENT_TYPE,
  PROJECT_STAGES,
  PROJECT_STATUS,
  REQUIREMENT_TYPES,
  PROJECT_ROLES,
  ACTIVITY_TYPES,
  MODERATION_STATUS,
  REPORT_SEVERITY,
  VOTE_TYPES,
  NOTIFICATION_TYPES,
  MEDIA_TYPES,
  STATUS_CODES,
  MESSAGES,
  TOKEN_EXPIRY,
  PAGINATION,
  FILE_UPLOAD,
  SECURITY_LIMITS,
  ANTI_SPAM,
  SEARCH,
  CONTENT_LIMITS,
  TIME_WINDOWS,
  CACHE_TTL,
  RETENTION,
  // Professional Profile System (Phase-3)
  LINK_TYPES,
  PROFILE_LIMITS,
  TECH_STACK,
  EXPERTISE_TAGS,
  DOMAIN_TAGS,
  // Admin Role System (Phase-4)
  ADMIN_ACTIONS,
  SUSPICIOUS_TYPES,
  RISK_SCORE_WEIGHTS,
  RISK_THRESHOLDS,
  ADMIN_SECURITY,
  isAdmin,
  // Content Moderation System (Phase-5)
  CONTENT_MODERATION,
  MODERATION_ACTIONS
};
