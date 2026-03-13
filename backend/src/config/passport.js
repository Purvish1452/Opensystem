const passport = require('passport');
const { configureGoogleStrategy } = require('../services/auth/google.oauth.service');
const { configureGitHubStrategy } = require('../services/auth/github.oauth.service');

/**
 * Passport Configuration
 *
 * Configures all OAuth strategies.
 * We use stateless authentication (JWT) so we do NOT use
 * passport.serializeUser / passport.deserializeUser.
 * The user object is passed via req.user after strategy success.
 */

// Configure Google Strategy
configureGoogleStrategy(passport);

// Configure GitHub Strategy
configureGitHubStrategy(passport);

module.exports = passport;
