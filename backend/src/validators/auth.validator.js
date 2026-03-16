const Joi = require('joi');
const { email, password, username, deviceId, otp } = require('./common.validator');

/**
 * Authentication Validators
 * JOI schemas for all auth routes
 */

// Register validation
const registerSchema = Joi.object({
    username: username,
    email: email,
    password: password,
    firstName: Joi.string().trim().min(2).max(30).required().messages({
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 30 characters',
        'any.required': 'First name is required'
    }),
    middleName: Joi.string().trim().max(30).allow('', null).messages({
        'string.max': 'Middle name cannot exceed 30 characters'
    }),
    lastName: Joi.string().trim().min(2).max(30).required().messages({
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name cannot exceed 30 characters',
        'any.required': 'Last name is required'
    }),
    age: Joi.number().integer().min(13).max(120).messages({
        'number.min': 'You must be at least 13 years old',
        'number.max': 'Invalid age'
    }),
    profession: Joi.string().trim().max(100).allow('', null),
    collegeOrCompany: Joi.string().trim().max(100).allow('', null),
    userType: Joi.string().valid('student', 'professional').default('student'),
    deviceId: deviceId
}).options({ stripUnknown: true });

// Login validation
const loginSchema = Joi.object({
    email: email,
    password: Joi.string().required().messages({
        'any.required': 'Password is required'
    }),
    deviceId: deviceId
}).options({ stripUnknown: true });

// Logout validation
const logoutSchema = Joi.object({
    deviceId: deviceId
}).options({ stripUnknown: true });

// Email verification validation
const verifyEmailSchema = Joi.object({
    token: Joi.string().required().messages({
        'any.required': 'Verification token is required'
    })
}).options({ stripUnknown: true });

// OTP verification validation
const verifyOtpSchema = Joi.object({
    email: email,
    otp: otp
}).options({ stripUnknown: true });

// Resend OTP validation
const resendOtpSchema = Joi.object({
    email: email
}).options({ stripUnknown: true });

module.exports = {
    registerSchema,
    loginSchema,
    logoutSchema,
    verifyEmailSchema,
    verifyOtpSchema,
    resendOtpSchema
};
