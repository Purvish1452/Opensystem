const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const { logActivity } = require('../activity/activity.service');
const sessionService = require('./session.service');
const emailService = require('../email/email.service');
const { ACTIVITY_TYPES, ACCOUNT_STATUS, LOGIN_METHOD } = require('../../constants');

/**
 * GitHub OAuth Service
 *
 * Flow:
 * 1. User hits GET /api/v1/auth/github  → redirected to GitHub consent
 * 2. GitHub redirects to GET /api/v1/auth/github/callback with profile
 * 3. We find or create the user, generate OTP, email it
 * 4. Redirect to CLIENT_URL/auth/callback?token=<accessToken>
 * 5. User submits OTP to /api/v1/auth/verify-otp to activate account
 *
 * Important GitHub note:
 * GitHub accounts may have no public email (user may keep it private).
 * We request the 'user:email' scope to access private emails.
 * If still no email, we return an error asking them to expose an email.
 *
 * Security layers:
 * - Layer 1: GitHub OAuth (identity proved by GitHub)
 * - Layer 2: OTP email verification (proves they control the email)
 */

/**
 * Generate a unique username from the GitHub profile
 * @param {String} login - GitHub username/login
 * @returns {String} Safe username candidate
 */
const generateUsernameFromGitHub = (login) => {
    const base = login.toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 14);
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `${base || 'ghuser'}${suffix}`;
};

/**
 * Configure GitHub OAuth Strategy with Passport
 * @param {Object} passport - Passport instance
 */
const configureGitHubStrategy = (passport) => {
    const clientID = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    // Skip strategy registration if credentials are not configured
    if (!clientID || !clientSecret ||
        clientID.includes('your_') || clientID.includes('your-')) {
        console.warn(
            '[GITHUB OAUTH] Strategy NOT loaded. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env'
        );
        return;
    }

    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/github/callback',
                scope: ['user:email'], // Request access to user's private email
                passReqToCallback: true
            },
            async (req, accessToken, refreshToken, profile, done) => {
                try {
                    // Extract email from GitHub profile
                    // GitHub returns emails as an array sorted by primary + verified
                    const emails = profile.emails || [];
                    const primaryEmail =
                        emails.find(e => e.primary && e.verified)?.value ||
                        emails.find(e => e.verified)?.value ||
                        emails[0]?.value;

                    if (!primaryEmail) {
                        return done(
                            new AppError(
                                'No accessible email found on your GitHub account. Please add a public or primary email in your GitHub settings.',
                                400,
                                'GITHUB_NO_EMAIL'
                            ),
                            null
                        );
                    }

                    // Check if user already exists (by githubId or email)
                    let user = await User.findOne({
                        $or: [{ githubId: profile.id }, { email: primaryEmail }]
                    }).select('+githubId');

                    if (user) {
                        // --- EXISTING USER ---

                        // Link GitHub ID if not already linked
                        if (!user.githubId) {
                            user.githubId = profile.id;
                            if (user.loginMethod === LOGIN_METHOD.EMAIL) {
                                user.loginMethod = LOGIN_METHOD.GITHUB;
                            }
                            await user.save({ validateBeforeSave: false });
                        }

                        // Update avatar if not set
                        if (!user.profileImage && !user.oauthAvatar && profile.photos?.[0]?.value) {
                            user.oauthAvatar = profile.photos[0].value;
                            await user.save({ validateBeforeSave: false });
                        }

                        // Log activity
                        logActivity(user._id, ACTIVITY_TYPES.LOGIN, null, null, req, {
                            method: 'github_oauth'
                        });

                        return done(null, user);

                    } else {
                        // --- NEW USER via GitHub ---

                        // Generate unique username (try GitHub login first)
                        let username = profile.username
                            ? profile.username.toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 16)
                            : generateUsernameFromGitHub(profile.id);

                        // Ensure uniqueness
                        let usernameExists = await User.findOne({ username });
                        let attempts = 0;
                        while (usernameExists && attempts < 5) {
                            username = generateUsernameFromGitHub(profile.username || profile.id);
                            usernameExists = await User.findOne({ username });
                            attempts++;
                        }

                        // Parse name from GitHub profile
                        const displayName = profile.displayName || profile.username || '';
                        const nameParts = displayName.split(' ');
                        const firstName = nameParts[0] || profile.username || 'GitHub';
                        const lastName = nameParts.slice(1).join(' ') || 'User';

                        // Create new user
                        const newUser = await User.create({
                            username,
                            email: primaryEmail,
                            githubId: profile.id,
                            loginMethod: LOGIN_METHOD.GITHUB,
                            accountStatus: ACCOUNT_STATUS.PENDING_VERIFICATION,
                            emailVerified: false,
                            oauthAvatar: profile.photos?.[0]?.value || null,
                            fullname: {
                                firstName,
                                lastName
                            }
                        });

                        // Generate and save OTP
                        const otp = newUser.generateOTP();
                        await newUser.save({ validateBeforeSave: false });

                        // Send OTP email (two-layer security: GitHub + OTP)
                        emailService.sendOTPEmail(primaryEmail, otp, firstName).catch(err => {
                            console.error('[GITHUB OAUTH] Failed to send OTP email:', err.message);
                        });

                        // Log registration
                        logActivity(newUser._id, ACTIVITY_TYPES.OAUTH_REGISTER, null, null, req, {
                            provider: 'github',
                            email: primaryEmail
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
 * Handle GitHub OAuth callback
 * Called after passport.authenticate('github') succeeds.
 * Creates a session and redirects to client with access token.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
const handleGitHubCallback = async (req, res, next) => {
    try {
        const user = req.user;
        const deviceId = req.query.state || `github_${user._id}`;

        // Create session tokens
        const tokens = await sessionService.createSession(user, deviceId, req);

        // Build redirect URL for the client frontend
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const redirectUrl = new URL('/auth/callback', clientUrl);
        redirectUrl.searchParams.set('token', tokens.accessToken);
        redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);
        redirectUrl.searchParams.set('provider', 'github');

        // Signal to the client if OTP verification is still needed
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
    configureGitHubStrategy,
    handleGitHubCallback
};
