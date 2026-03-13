const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const { logActivity } = require('../activity/activity.service');
const sessionService = require('./session.service');
const emailService = require('../email/email.service');
const { ACTIVITY_TYPES, ACCOUNT_STATUS, LOGIN_METHOD } = require('../../constants');
const crypto = require('crypto');

/**
 * Google OAuth Service
 *
 * Flow:
 * 1. User hits GET /api/v1/auth/google  → redirected to Google consent screen
 * 2. Google redirects to GET /api/v1/auth/google/callback with profile
 * 3. We find or create the user, generate an OTP, email it
 * 4. Redirect to CLIENT_URL/auth/callback?token=<accessToken>
 * 5. User submits OTP to /api/v1/auth/verify-otp to activate account
 *
 * Security layers:
 * - Layer 1: Google OAuth (identity proved by Google)
 * - Layer 2: OTP email verification (proves they control the email)
 */

/**
 * Generate a unique username from the Google profile
 * @param {String} name - Display name from Google
 * @param {String} email - Email from Google
 * @returns {String} Unique username candidate
 */
const generateUsernameFromProfile = (name, email) => {
    const base = name
        ? name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 14)
        : email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 14);
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `${base || 'user'}${suffix}`;
};

/**
 * Configure Google OAuth Strategy with Passport
 * @param {Object} passport - Passport instance
 */
const configureGoogleStrategy = (passport) => {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Skip strategy registration if credentials are not configured
    if (!clientID || !clientSecret ||
        clientID.includes('your_') || clientID.includes('your-')) {
        console.warn(
            '[GOOGLE OAUTH] Strategy NOT loaded. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env'
        );
        return;
    }

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
                passReqToCallback: true
            },
            async (req, accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;

                    if (!email) {
                        return done(
                            new AppError('No email associated with your Google account.', 400, 'GOOGLE_NO_EMAIL'),
                            null
                        );
                    }

                    // Check if user already exists (by googleId or email)
                    let user = await User.findOne({
                        $or: [{ googleId: profile.id }, { email }]
                    }).select('+googleId');

                    if (user) {
                        // --- EXISTING USER ---

                        // Link Google ID if not already linked
                        if (!user.googleId) {
                            user.googleId = profile.id;
                            user.oauthAvatar = user.oauthAvatar || profile.photos?.[0]?.value;
                            if (user.loginMethod === LOGIN_METHOD.EMAIL) {
                                // Keep loginMethod as email, just link Google as additional provider
                                user.loginMethod = LOGIN_METHOD.GOOGLE;
                            }
                            await user.save({ validateBeforeSave: false });
                        }

                        // Update avatar if not set
                        if (!user.profileImage && !user.oauthAvatar) {
                            user.oauthAvatar = profile.photos?.[0]?.value;
                            await user.save({ validateBeforeSave: false });
                        }

                        // Log activity
                        logActivity(user._id, ACTIVITY_TYPES.LOGIN, null, null, req, {
                            method: 'google_oauth'
                        });

                        return done(null, user);

                    } else {
                        // --- NEW USER via Google ---

                        // Generate unique username
                        let username = generateUsernameFromProfile(profile.displayName, email);
                        // Ensure uniqueness
                        let usernameExists = await User.findOne({ username });
                        let attempts = 0;
                        while (usernameExists && attempts < 5) {
                            username = generateUsernameFromProfile(profile.displayName, email);
                            usernameExists = await User.findOne({ username });
                            attempts++;
                        }

                        // Parse name parts from Google profile
                        const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User';
                        const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || 'Account';

                        // Create new user
                        const newUser = await User.create({
                            username,
                            email,
                            googleId: profile.id,
                            loginMethod: LOGIN_METHOD.GOOGLE,
                            accountStatus: ACCOUNT_STATUS.PENDING_VERIFICATION,
                            emailVerified: false,
                            oauthAvatar: profile.photos?.[0]?.value,
                            fullname: {
                                firstName,
                                lastName
                            }
                        });

                        // Generate and save OTP
                        const otp = newUser.generateOTP();
                        await newUser.save({ validateBeforeSave: false });

                        // Send OTP email (two-layer security: Google + OTP)
                        emailService.sendOTPEmail(email, otp, firstName).catch(err => {
                            console.error('[GOOGLE OAUTH] Failed to send OTP email:', err.message);
                        });

                        // Log registration
                        logActivity(newUser._id, ACTIVITY_TYPES.OAUTH_REGISTER, null, null, req, {
                            provider: 'google',
                            email
                        });

                        return done(null, newUser);
                    }
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );
};

/**
 * Handle Google OAuth callback
 * Called after passport.authenticate('google') succeeds.
 * Creates a session and redirects to client with access token.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
const handleGoogleCallback = async (req, res, next) => {
    try {
        const user = req.user;
        const deviceId = req.query.state || `google_${user._id}`;

        // Create session tokens
        const tokens = await sessionService.createSession(user, deviceId, req);

        // Build redirect URL for the client frontend
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const redirectUrl = new URL('/auth/callback', clientUrl);
        redirectUrl.searchParams.set('token', tokens.accessToken);
        redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);
        redirectUrl.searchParams.set('provider', 'google');

        // Signal to the client if OTP verification is needed
        if (user.accountStatus === ACCOUNT_STATUS.PENDING_VERIFICATION) {
            redirectUrl.searchParams.set('requireOtp', 'true');
            redirectUrl.searchParams.set('email', user.email);
        }

        return res.redirect(redirectUrl.toString());
    } catch (error) {
        next(error);
    }
};

module.exports = {
    configureGoogleStrategy,
    handleGoogleCallback
};
