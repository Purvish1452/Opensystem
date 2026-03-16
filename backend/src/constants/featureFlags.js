/**
 * Feature Flags
 * Enable/disable features without redeployment
 * Phase-2: Prepare for modular feature control
 */

module.exports = {
    // Core Features (Phase-2)
    PROBLEM_FEED_ENABLED: process.env.FEATURE_PROBLEM_FEED === 'true' || true,
    DEVELOPER_MODE_ENABLED: process.env.FEATURE_DEVELOPER_MODE === 'true' || true,
    COMMENTS_ENABLED: process.env.FEATURE_COMMENTS === 'true' || true,
    VOTING_ENABLED: process.env.FEATURE_VOTING === 'true' || true,
    REPORTING_ENABLED: process.env.FEATURE_REPORTING === 'true' || true,
    SEARCH_ENABLED: process.env.FEATURE_SEARCH === 'true' || true,

    // File Upload Features
    FILE_UPLOADS_ENABLED: process.env.FEATURE_FILE_UPLOADS === 'true' || true,
    VIDEO_UPLOADS_ENABLED: process.env.FEATURE_VIDEO_UPLOADS === 'true' || true,
    CODE_SNIPPETS_ENABLED: process.env.FEATURE_CODE_SNIPPETS === 'true' || true,

    // Future Features (Phase-3)
    NOTIFICATIONS_ENABLED: process.env.FEATURE_NOTIFICATIONS === 'true' || false,
    BOOKMARKS_ENABLED: process.env.FEATURE_BOOKMARKS === 'true' || false,
    FOLLOWING_ENABLED: process.env.FEATURE_FOLLOWING === 'true' || false,
    OAUTH_LOGIN_ENABLED: process.env.FEATURE_OAUTH === 'true' || false,

    // Security Features
    EMAIL_VERIFICATION_REQUIRED: process.env.FEATURE_EMAIL_VERIFICATION === 'true' || false,
    TWO_FACTOR_AUTH_ENABLED: process.env.FEATURE_2FA === 'true' || false,

    // System Flags
    MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === 'true' || false,
    READ_ONLY_MODE: process.env.READ_ONLY_MODE === 'true' || false
};
