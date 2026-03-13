const AppError = require('../../utils/AppError');
const crypto = require('crypto');

/**
 * Media Service - Production Grade
 * 
 * Features:
 * - Virus scan hook placeholder
 * - Strict executable MIME type rejection
 * - File hash for duplicate detection
 * - Cloudinary integration hooks (structure only)
 */

/**
 * Allowed media MIME types
 */
const ALLOWED_MIME_TYPES = {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
    DOCUMENT: ['application/pdf']
};

/**
 * Forbidden executable MIME types (security)
 */
const FORBIDDEN_MIME_TYPES = [
    'application/x-msdownload', // .exe
    'application/x-msdos-program',
    'application/x-sh', // shell scripts
    'application/x-executable',
    'application/x-sharedlib',
    'application/java-archive', // .jar
    'application/javascript',
    'text/javascript'
];

/**
 * Max file sizes (bytes)
 */
const MAX_FILE_SIZE = {
    IMAGE: 5 * 1024 * 1024, // 5MB
    VIDEO: 50 * 1024 * 1024, // 50MB
    DOCUMENT: 10 * 1024 * 1024 // 10MB
};

/**
 * Validate media array
 * 
 * @param {Array} mediaArray - Array of media objects
 * @returns {Promise<Boolean>} Validation result
 */
const validateMedia = async (mediaArray) => {
    if (!mediaArray || mediaArray.length === 0) {
        return true;
    }

    // Check count limit
    if (mediaArray.length > 10) {
        throw AppError.validationError(
            [{ field: 'media', message: 'Maximum 10 media files allowed' }],
            'Media limit exceeded'
        );
    }

    // Validate each media item
    for (const media of mediaArray) {
        await validateMediaItem(media);
    }

    return true;
};

/**
 * Validate single media item
 * 
 * @param {Object} media - Media object
 * @returns {Promise<Boolean>} Validation result
 */
const validateMediaItem = async (media) => {
    const { type, url, mimeType, size } = media;

    // Reject executable MIME types
    if (FORBIDDEN_MIME_TYPES.includes(mimeType)) {
        throw AppError.validationError(
            [{ field: 'media', message: 'Executable files are not allowed' }],
            'Forbidden file type'
        );
    }

    // Validate MIME type
    const allAllowedTypes = [
        ...ALLOWED_MIME_TYPES.IMAGE,
        ...ALLOWED_MIME_TYPES.VIDEO,
        ...ALLOWED_MIME_TYPES.DOCUMENT
    ];

    if (!allAllowedTypes.includes(mimeType)) {
        throw AppError.validationError(
            [{ field: 'media', message: `MIME type ${mimeType} not allowed` }],
            'Invalid file type'
        );
    }

    // Validate file size
    let maxSize;
    if (ALLOWED_MIME_TYPES.IMAGE.includes(mimeType)) {
        maxSize = MAX_FILE_SIZE.IMAGE;
    } else if (ALLOWED_MIME_TYPES.VIDEO.includes(mimeType)) {
        maxSize = MAX_FILE_SIZE.VIDEO;
    } else {
        maxSize = MAX_FILE_SIZE.DOCUMENT;
    }

    if (size > maxSize) {
        throw AppError.validationError(
            [{ field: 'media', message: `File size exceeds ${maxSize / 1024 / 1024}MB limit` }],
            'File too large'
        );
    }

    // TODO: Virus scan hook
    // await virusScanService.scan(url);

    return true;
};

/**
 * Generate file hash for duplicate detection
 * 
 * @param {Buffer|String} file - File buffer or content
 * @returns {String} SHA256 hash
 */
const generateFileHash = (file) => {
    return crypto.createHash('sha256').update(file).digest('hex');
};

/**
 * Detect duplicate media
 * 
 * @param {String} fileHash - File hash
 * @returns {Promise<Boolean>} True if duplicate exists
 */
const detectDuplicateMedia = async (fileHash) => {
    // TODO: Check database for existing media with same hash
    // const existing = await Media.findOne({ fileHash });
    // return !!existing;

    return false; // Placeholder
};

/**
 * Upload to Cloudinary (structure only)
 * 
 * @param {Buffer} file - File buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadToCloudinary = async (file, options = {}) => {
    // TODO: Cloudinary integration
    // const cloudinary = require('cloudinary').v2;
    // const result = await cloudinary.uploader.upload(file, options);
    // return result;

    throw new Error('Cloudinary integration not implemented');
};

module.exports = {
    validateMedia,
    validateMediaItem,
    generateFileHash,
    detectDuplicateMedia,
    uploadToCloudinary
};
