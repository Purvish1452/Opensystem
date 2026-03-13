const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ROLES, USER_TYPES, ACCOUNT_STATUS, LOGIN_METHOD, SECURITY_LIMITS, LINK_TYPES, PROFILE_LIMITS } = require('../constants');

/**
 * User Model Schema - Phase-2 Enhanced
 * Production-ready user model with comprehensive security features
 */

const userSchema = new mongoose.Schema(
    {
        // Basic Information
        username: {
            type: String,
            required: [true, 'Username is required'],
            trim: true,
            lowercase: true,
            minlength: [SECURITY_LIMITS.USERNAME_MIN_LENGTH, `Username must be at least ${SECURITY_LIMITS.USERNAME_MIN_LENGTH} characters`],
            maxlength: [SECURITY_LIMITS.USERNAME_MAX_LENGTH, `Username cannot exceed ${SECURITY_LIMITS.USERNAME_MAX_LENGTH} characters`],
            match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores']
        },
        fullname: {
            firstName: {
                type: String,
                required: false, // Optional for OAuth users (name parsed from provider)
                trim: true,
                minlength: [2, 'First name must be at least 2 characters'],
                maxlength: [30, 'First name cannot exceed 30 characters']
            },
            middleName: {
                type: String,
                trim: true,
                maxlength: [30, 'Middle name cannot exceed 30 characters']
            },
            lastName: {
                type: String,
                required: false, // Optional for OAuth users
                trim: true,
                minlength: [2, 'Last name must be at least 2 characters'],
                maxlength: [30, 'Last name cannot exceed 30 characters']
            }
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email'
            ]
        },
        password: {
            type: String,
            // Required only for email/manual registration — NOT required for OAuth users
            required: false,
            minlength: [SECURITY_LIMITS.PASSWORD_MIN_LENGTH, `Password must be at least ${SECURITY_LIMITS.PASSWORD_MIN_LENGTH} characters`],
            select: false // Don't return password by default in queries
        },

        // OAuth Provider Fields
        googleId: {
            type: String,
            select: false
        },
        githubId: {
            type: String,
            select: false
        },
        oauthAvatar: {
            type: String, // Profile picture URL from OAuth provider
            default: null
        },

        // Profile Information
        age: {
            type: Number,
            min: [13, 'You must be at least 13 years old'],
            max: [120, 'Invalid age']
        },
        profession: {
            type: String,
            trim: true,
            maxlength: [100, 'Profession cannot exceed 100 characters']
        },
        collegeOrCompany: {
            type: String,
            trim: true,
            maxlength: [100, 'College/Company name cannot exceed 100 characters']
        },
        profileImage: {
            type: String,
            default: null,
            validate: {
                validator: function (v) {
                    if (!v) return true;
                    return /^https?:\/\/.+/.test(v);
                },
                message: 'Invalid URL format for profile image'
            }
        },
        bio: {
            type: String,
            trim: true,
            maxlength: [500, 'Bio cannot exceed 500 characters']
        },
        skills: [{
            type: String,
            trim: true,
            maxlength: [30, 'Skill name cannot exceed 30 characters']
        }],

        // ─── Professional Profile (Phase-3) ─────────────────────────────────────

        // Professional Links (embedded — max 15, always fetched with profile)
        links: {
            type: [{
                type: {
                    type: String,
                    enum: Object.values(LINK_TYPES),
                    required: [true, 'Link type is required']
                },
                url: {
                    type: String,
                    required: [true, 'Link URL is required'],
                    trim: true,
                    maxlength: [500, 'URL cannot exceed 500 characters']
                },
                title: {
                    type: String,
                    trim: true,
                    maxlength: [60, 'Link title cannot exceed 60 characters']
                },
                isPublic: {
                    type: Boolean,
                    default: true
                }
            }],
            default: [],
            validate: [
                v => v.length <= PROFILE_LIMITS.MAX_LINKS,
                `Maximum ${PROFILE_LIMITS.MAX_LINKS} links allowed`
            ]
        },

        // Expertise Tags (embedded — max 15, indexed for recruiter filter)
        expertise: {
            type: [{
                type: String,
                trim: true,
                lowercase: true,
                maxlength: [50, 'Expertise tag cannot exceed 50 characters']
            }],
            default: [],
            validate: [
                v => v.length <= PROFILE_LIMITS.MAX_EXPERTISE,
                `Maximum ${PROFILE_LIMITS.MAX_EXPERTISE} expertise tags allowed`
            ]
        },

        // Interested Domains (embedded — max 10, analytics + recommendation ready)
        domains: {
            type: [{
                type: String,
                trim: true,
                lowercase: true,
                maxlength: [50, 'Domain tag cannot exceed 50 characters']
            }],
            default: [],
            validate: [
                v => v.length <= PROFILE_LIMITS.MAX_DOMAINS,
                `Maximum ${PROFILE_LIMITS.MAX_DOMAINS} domains allowed`
            ]
        },


        userType: {
            type: String,
            enum: Object.values(USER_TYPES),
            default: USER_TYPES.STUDENT
        },
        role: {
            type: String,
            enum: Object.values(ROLES),
            default: ROLES.USER
        },
        accountStatus: {
            type: String,
            enum: Object.values(ACCOUNT_STATUS),
            default: ACCOUNT_STATUS.ACTIVE
        },
        loginMethod: {
            type: String,
            enum: Object.values(LOGIN_METHOD),
            default: LOGIN_METHOD.EMAIL
        },

        // Email Verification
        emailVerified: {
            type: Boolean,
            default: false
        },
        emailVerificationToken: {
            type: String,
            select: false
        },
        emailVerificationExpires: {
            type: Date,
            select: false
        },

        // OTP for Two-Factor Authentication
        otp: {
            type: String,
            select: false
        },
        otpExpires: {
            type: Date,
            select: false
        },

        // Brute Force Protection
        loginAttempts: {
            type: Number,
            default: 0
        },
        lockUntil: {
            type: Date,
            select: false
        },

        // Session Management
        refreshTokens: [{
            tokenHash: {
                type: String,
                required: true
            },
            deviceId: {
                type: String,
                required: true
            },
            expiresAt: {
                type: Date,
                required: true
            }
        }],

        // Device Tracking
        deviceLogins: [{
            deviceId: {
                type: String,
                required: true
            },
            ip: String,
            browser: String,
            os: String,
            lastUsed: {
                type: Date,
                default: Date.now
            },
            isActive: {
                type: Boolean,
                default: true
            }
        }],

        // Activity Tracking
        lastLoginIP: String,
        lastLoginDevice: String,
        lastActiveAt: Date,
        lastLogin: Date,

        // Future-Ready Fields (Phase-3)
        savedPosts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        }],
        hiddenPosts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        }],
        followersCount: {
            type: Number,
            default: 0
        },
        followingCount: {
            type: Number,
            default: 0
        },

        // System Fields
        isActive: {
            type: Boolean,
            default: true
        },

        // ── Admin Role System (Phase-4) ────────────────────────────────────
        // Risk score: 0–100. Auto-incremented by suspicious activity engine.
        // Clamped at service layer. Decays -5/day via cron.
        riskScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        // Timestamp of last admin intervention for monitoring/triage
        lastAdminActionAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// ============================================
// INDEXES
// ============================================

// Unique indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

// Sparse unique indexes for OAuth (null values allowed — users may not have both)
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ githubId: 1 }, { unique: true, sparse: true });

// Compound index for registration checks
userSchema.index({ username: 1, email: 1 });

// Text index for search
userSchema.index({
    username: 'text',
    'fullname.firstName': 'text',
    'fullname.lastName': 'text',
    skills: 'text'
});

// Admin dashboard indexes (Phase-4)
userSchema.index({ role: 1, accountStatus: 1 });           // admin user filtering
userSchema.index({ role: 1, riskScore: -1 });              // risk-based triage
userSchema.index({ riskScore: -1 }, { sparse: true });     // high-risk users
userSchema.index({ lockUntil: 1 }, { sparse: true });      // locked accounts

// ============================================
// VIRTUALS
// ============================================

/**
 * Virtual to check if account is locked
 */
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * Virtual for full name display
 */
userSchema.virtual('fullName').get(function () {
    const parts = [this.fullname.firstName];
    if (this.fullname.middleName) parts.push(this.fullname.middleName);
    parts.push(this.fullname.lastName);
    return parts.join(' ');
});

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

/**
 * Pre-save middleware to hash password
 * Only hashes if password is modified
 */
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    // OAuth users have no password — skip hashing
    if (!this.password) {
        return next();
    }

    try {
        // Validate password complexity only for email login method
        if (this.loginMethod === LOGIN_METHOD.EMAIL || !this.loginMethod) {
            const passwordValidation = userSchema.statics.validatePasswordComplexity(this.password);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.message);
            }
        }

        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Pre-save middleware to validate skills array length
 */
userSchema.pre('save', function (next) {
    if (this.skills && this.skills.length > 20) {
        return next(new Error('Cannot have more than 20 skills'));
    }
    next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Instance method to compare password
 * @param {String} candidatePassword - Password to compare
 * @returns {Promise<Boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance method to update last login
 */
userSchema.methods.updateLastLogin = async function (ip, device) {
    this.lastLogin = Date.now();
    this.lastActiveAt = Date.now();
    this.lastLoginIP = ip;
    this.lastLoginDevice = device;
    await this.save({ validateBeforeSave: false });
};

/**
 * Generate email verification token
 * @returns {String} - Verification token
 */
userSchema.methods.generateEmailVerificationToken = function () {
    const token = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return token;
};

/**
 * Generate OTP for two-factor authentication
 * @returns {String} - 6-digit OTP
 */
userSchema.methods.generateOTP = function () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otp = crypto.createHash('sha256').update(otp).digest('hex');
    this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    return otp;
};

/**
 * Add device login with max 5 devices enforcement
 * @param {Object} deviceInfo - Device information
 */
userSchema.methods.addDeviceLogin = async function (deviceInfo) {
    // Check if device already exists
    const existingDevice = this.deviceLogins.find(d => d.deviceId === deviceInfo.deviceId);

    if (existingDevice) {
        // Update existing device
        existingDevice.ip = deviceInfo.ip;
        existingDevice.browser = deviceInfo.browser;
        existingDevice.os = deviceInfo.os;
        existingDevice.lastUsed = Date.now();
        existingDevice.isActive = true;
    } else {
        // Enforce max devices limit
        if (this.deviceLogins.length >= SECURITY_LIMITS.MAX_DEVICES) {
            // Remove oldest inactive device or oldest device
            const inactiveDevices = this.deviceLogins.filter(d => !d.isActive);
            if (inactiveDevices.length > 0) {
                // Remove oldest inactive device
                const oldestInactive = inactiveDevices.sort((a, b) => a.lastUsed - b.lastUsed)[0];
                this.deviceLogins = this.deviceLogins.filter(d => d.deviceId !== oldestInactive.deviceId);
            } else {
                // Remove oldest device
                const oldest = this.deviceLogins.sort((a, b) => a.lastUsed - b.lastUsed)[0];
                this.deviceLogins = this.deviceLogins.filter(d => d.deviceId !== oldest.deviceId);
            }
        }

        // Add new device
        this.deviceLogins.push({
            deviceId: deviceInfo.deviceId,
            ip: deviceInfo.ip,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            lastUsed: Date.now(),
            isActive: true
        });
    }

    await this.save({ validateBeforeSave: false });
};

/**
 * Remove device login
 * @param {String} deviceId - Device ID to remove
 */
userSchema.methods.removeDeviceLogin = async function (deviceId) {
    this.deviceLogins = this.deviceLogins.filter(d => d.deviceId !== deviceId);
    await this.save({ validateBeforeSave: false });
};

/**
 * Increment login attempts and lock account if necessary
 */
userSchema.methods.incrementLoginAttempts = async function () {
    // If lock has expired, reset attempts
    if (this.lockUntil && this.lockUntil < Date.now()) {
        this.loginAttempts = 1;
        this.lockUntil = undefined;
    } else {
        this.loginAttempts += 1;

        // Lock account after max attempts
        if (this.loginAttempts >= SECURITY_LIMITS.MAX_LOGIN_ATTEMPTS) {
            this.lockUntil = Date.now() + SECURITY_LIMITS.ACCOUNT_LOCK_TIME;
        }
    }

    await this.save({ validateBeforeSave: false });
};

/**
 * Reset login attempts after successful login
 */
userSchema.methods.resetLoginAttempts = async function () {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    await this.save({ validateBeforeSave: false });
};

/**
 * Add refresh token (hashed)
 * @param {String} token - Refresh token
 * @param {String} deviceId - Device ID
 */
userSchema.methods.addRefreshToken = async function (token, deviceId) {
    const tokenHash = await bcrypt.hash(token, 10);

    this.refreshTokens.push({
        tokenHash,
        deviceId,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Clean up expired tokens
    this.refreshTokens = this.refreshTokens.filter(t => t.expiresAt > Date.now());

    await this.save({ validateBeforeSave: false });
};

/**
 * Remove refresh token
 * @param {String} tokenHash - Hashed token to remove
 */
userSchema.methods.removeRefreshToken = async function (tokenHash) {
    this.refreshTokens = this.refreshTokens.filter(t => t.tokenHash !== tokenHash);
    await this.save({ validateBeforeSave: false });
};

/**
 * Remove all refresh tokens (logout from all devices)
 */
userSchema.methods.removeAllRefreshTokens = async function () {
    this.refreshTokens = [];
    this.deviceLogins.forEach(d => d.isActive = false);
    await this.save({ validateBeforeSave: false });
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Validate password complexity
 * @param {String} password - Password to validate
 * @returns {Object} - { isValid: Boolean, message: String }
 */
userSchema.statics.validatePasswordComplexity = function (password) {
    if (password.length < SECURITY_LIMITS.PASSWORD_MIN_LENGTH) {
        return {
            isValid: false,
            message: `Password must be at least ${SECURITY_LIMITS.PASSWORD_MIN_LENGTH} characters`
        };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
        return {
            isValid: false,
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        };
    }

    return { isValid: true, message: 'Password is valid' };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
