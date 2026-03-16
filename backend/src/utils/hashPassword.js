const bcrypt = require('bcryptjs');

/**
 * Password Hashing Utilities
 * Provides functions for hashing and comparing passwords using bcrypt
 */

/**
 * Hash a plain text password
 * @param {String} password - Plain text password
 * @returns {Promise<String>} - Hashed password
 */
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

/**
 * Compare plain text password with hashed password
 * @param {String} plainPassword - Plain text password
 * @param {String} hashedPassword - Hashed password from database
 * @returns {Promise<Boolean>} - True if passwords match
 */
const comparePassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
    hashPassword,
    comparePassword
};
