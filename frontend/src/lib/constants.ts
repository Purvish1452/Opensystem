export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || '/api/v1',
    TIMEOUT: 15000,
};

export const ROLES = {
    USER: 'user',
    MODERATOR: 'moderator',
    ADMIN: 'admin',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
