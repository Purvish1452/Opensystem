/**
 * Admin Seed Script — Phase-4
 *
 * Creates the initial admin account.
 *
 * Safety guards:
 *   1. Refuses to run unless ADMIN_SEED=true is set in environment
 *   2. Prevents duplicate admin creation (checks existing role:admin)
 *   3. Validates password entropy before hashing
 *   4. Logs masked email to console
 *
 * Usage:
 *   ADMIN_SEED=true node scripts/seedAdmin.js
 *
 * NEVER run this in CI/CD without explicit approval.
 */

'use strict';

// ─── Production guard ─────────────────────────────────────────────────────────
if (process.env.ADMIN_SEED !== 'true') {
    console.error('\n[seedAdmin] ERROR: ADMIN_SEED=true environment flag is required.');
    console.error('Run as: ADMIN_SEED=true node scripts/seedAdmin.js\n');
    process.exit(1);
}

require('dotenv').config();
const mongoose = require('mongoose');

// Inline password entropy validator (no service dependency in seed)
const validatePasswordEntropy = (password) => {
    if (!password || password.length < 32) return 'Password must be at least 32 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one digit';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
    return null;
};

const maskEmail = (email) => {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 4)}***@${domain}`;
};

const seed = async () => {
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!MONGO_URI) {
        console.error('[seedAdmin] ERROR: MONGO_URI not set in .env');
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('[seedAdmin] Connected to MongoDB');

    // Lazy-load User model (after mongoose is connected)
    const User = require('../src/models/User');

    // ─── Prevent duplicate admin ───────────────────────────────────────────────
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
        console.warn(`[seedAdmin] Admin already exists: ${maskEmail(existing.email)} — aborting.`);
        await mongoose.disconnect();
        process.exit(0);
    }

    // ─── Credentials from env ─────────────────────────────────────────────────
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'opensystems_admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.error('[seedAdmin] ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
        await mongoose.disconnect();
        process.exit(1);
    }

    // ─── Password entropy check ───────────────────────────────────────────────
    const entropyError = validatePasswordEntropy(ADMIN_PASSWORD);
    if (entropyError) {
        console.error(`[seedAdmin] Weak password rejected: ${entropyError}`);
        await mongoose.disconnect();
        process.exit(1);
    }

    // ─── Create admin user (pre-save middleware handles hashing) ──────────────
    await User.create({
        fullname: { firstName: 'OpenSystems', lastName: 'Admin' },
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,  // raw password — hashed by pre-save hook
        role: 'admin',
        accountStatus: 'active',
        emailVerified: true,
        loginMethod: 'email',
        userType: 'professional'
    });

    console.log(`[seedAdmin] ✅ Admin created: ${maskEmail(ADMIN_EMAIL)}`);
    await mongoose.disconnect();
    process.exit(0);
};

seed().catch((err) => {
    console.error('[seedAdmin] Fatal error:', err.message);
    process.exit(1);
});
