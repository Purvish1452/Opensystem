/**
 * Content Moderation Service
 * Phase-5: Offensive Content Verification
 *
 * ─── DESIGN PRINCIPLES ──────────────────────────────────────────────────────
 * 1. Pure functions — no Express, no Mongoose, no side effects
 * 2. Composable — each check is independent and testable
 * 3. Extensible — add new checks by pushing to the pipeline array
 * 4. Transparent — every decision is logged with reasons + score breakdown
 * ─────────────────────────────────────────────────────────────────────────────
 */

const {
    PROFANITY_CATEGORIES,
    SPAM_PHRASES,
    RUNTIME_ADDITIONS,
} = require('../../constants/profanityList.config');

const { CONTENT_MODERATION } = require('../../constants');

// ─── Leet-speak / bypass normalization map ────────────────────────────────────
const LEET_MAP = {
    '@': 'a', '4': 'a', '3': 'e', '1': 'i', '!': 'i',
    '0': 'o', '5': 's', '$': 's', '7': 't', '+': 't',
    '8': 'b', '6': 'g', '9': 'g',
};

// ─── Suspicious URL pattern ───────────────────────────────────────────────────
const SUSPICIOUS_URL_RE = /https?:\/\/(bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|short\.io|rb\.gy|is\.gd|cutt\.ly|click\.me|adf\.ly|linktr\.[a-z]{2,}|free[a-z]*money|earn[a-z]*cash)[^\s]*/gi;

// ─── Excessive caps pattern (>60% uppercase in 6+ char string) ───────────────
const CAPS_RE = /\b[A-Z]{5,}\b/g;

// ─── Symbol spam pattern (3+ consecutive identical special chars) ─────────────
const SYMBOL_SPAM_RE = /([!?*#$@%&]{3,})/g;

// ─── Repeated word pattern (same word 3+ times) ──────────────────────────────
const REPEATED_WORD_RE = /\b(\w+)\b(?:\s+\1\b){2,}/gi;

/**
 * Normalize text to defeat leet-speak, punctuation bypass, and encoding tricks
 * @param {string} text
 * @returns {string} normalized lowercase version
 */
function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';

    let normalized = text.toLowerCase();

    // Replace leet characters
    normalized = normalized.split('').map(c => LEET_MAP[c] || c).join('');

    // Remove dots/dashes between single characters (f.u.c.k → fuck)
    normalized = normalized.replace(/\b(\w)([\.\-_])(\w)([\.\-_])(\w)/g, '$1$3$5');

    // Collapse repeated characters (fuuuuck → fuuck — keep 2 max)
    normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');

    return normalized;
}

/**
 * Check text against the profanity word list (category-aware)
 * @param {string} text - Original text
 * @returns {{ found: boolean, matches: Array, score: number, categories: string[] }}
 */
function checkProfanity(text) {
    const normalized = normalizeText(text);
    const matches = [];
    const categories = new Set();
    let maxScore = 0;

    // Check each category
    for (const [categoryName, categoryData] of Object.entries(PROFANITY_CATEGORIES)) {
        for (const word of categoryData.words) {
            const wordNorm = normalizeText(word);
            // Word-boundary-aware check (won't flag "class" for "ass")
            const wordRe = new RegExp(`(^|\\s|[^a-z])${wordNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|\\s|$)`, 'i');
            if (wordRe.test(normalized)) {
                matches.push({ word, category: categoryName, severity: categoryData.severity });
                categories.add(categoryName);
                if (categoryData.score > maxScore) {
                    maxScore = categoryData.score;
                }
            }
        }
    }

    // Check runtime additions (admin-injected words)
    if (RUNTIME_ADDITIONS.length > 0) {
        for (const word of RUNTIME_ADDITIONS) {
            const wordNorm = normalizeText(word);
            if (normalized.includes(wordNorm)) {
                matches.push({ word, category: 'RUNTIME', severity: 'high' });
                categories.add('RUNTIME');
                if (75 > maxScore) maxScore = 75;
            }
        }
    }

    return {
        found: matches.length > 0,
        matches,
        categories: [...categories],
        score: maxScore,
    };
}

/**
 * Check for spam patterns (caps abuse, symbol spam, repeated words)
 * @param {string} text
 * @returns {{ found: boolean, patterns: string[], score: number }}
 */
function checkSpamPatterns(text) {
    if (!text || typeof text !== 'string') return { found: false, patterns: [], score: 0 };

    const patterns = [];
    let score = 0;

    // Excessive caps
    const capsMatches = text.match(CAPS_RE) || [];
    const totalWords = text.split(/\s+/).length;
    if (capsMatches.length > 0 && (capsMatches.length / totalWords) > 0.5 && totalWords >= 4) {
        patterns.push('excessive_caps');
        score += 20;
    }

    // Symbol spam
    const symbolMatches = text.match(SYMBOL_SPAM_RE) || [];
    if (symbolMatches.length >= 2) {
        patterns.push('symbol_spam');
        score += 15;
    }

    // Repeated words
    if (REPEATED_WORD_RE.test(text)) {
        REPEATED_WORD_RE.lastIndex = 0; // reset stateful regex
        patterns.push('repeated_words');
        score += 20;
    }

    // Spam phrases
    const normalizedLower = text.toLowerCase();
    const foundSpamPhrases = SPAM_PHRASES.filter(phrase =>
        normalizedLower.includes(phrase.toLowerCase())
    );
    if (foundSpamPhrases.length > 0) {
        patterns.push('spam_phrases');
        score += Math.min(foundSpamPhrases.length * 15, 40);
    }

    // Length abuse (very short with many exclamations/symbols)
    if (text.length < 20 && (text.match(/[!?]/g) || []).length >= 4) {
        patterns.push('punctuation_abuse');
        score += 10;
    }

    return {
        found: patterns.length > 0,
        patterns,
        foundSpamPhrases,
        score: Math.min(score, 60), // cap spam score at 60 (only profanity hits 80+)
    };
}

/**
 * Detect suspicious / shortened URLs in text
 * @param {string} text
 * @returns {{ found: boolean, urls: string[], score: number }}
 */
function checkUrls(text) {
    if (!text || typeof text !== 'string') return { found: false, urls: [], score: 0 };

    SUSPICIOUS_URL_RE.lastIndex = 0;
    const matches = [];
    let match;

    while ((match = SUSPICIOUS_URL_RE.exec(text)) !== null) {
        matches.push(match[0]);
    }

    return {
        found: matches.length > 0,
        urls: matches,
        score: matches.length > 0 ? Math.min(matches.length * 20, 50) : 0,
    };
}

/**
 * Master analysis function — runs all checks and computes final verdict
 * @param {string} text - The text to analyze
 * @param {object} options
 * @param {boolean} options.skipSpamCheck - Skip spam pattern detection
 * @param {boolean} options.skipUrlCheck - Skip URL detection
 * @returns {{
 *   passed: boolean,
 *   score: number,
 *   severity: 'clean'|'flagged'|'blocked',
 *   flags: string[],
 *   reasons: string[],
 *   details: object
 * }}
 */
function analyzeText(text, options = {}) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return {
            passed: true,
            score: 0,
            severity: CONTENT_MODERATION.SEVERITY.CLEAN,
            flags: [],
            reasons: [],
            details: {},
        };
    }

    const profanityResult = checkProfanity(text);
    const spamResult = options.skipSpamCheck ? { found: false, patterns: [], score: 0 } : checkSpamPatterns(text);
    const urlResult = options.skipUrlCheck ? { found: false, urls: [], score: 0 } : checkUrls(text);

    // Composite score — profanity takes priority (can alone reach 95)
    // Spam and URLs are additive with a combined cap
    const compositeScore = Math.min(
        profanityResult.score +
        Math.min(spamResult.score + urlResult.score, 40),
        100
    );

    // Determine severity
    let severity;
    if (compositeScore >= CONTENT_MODERATION.THRESHOLDS.BLOCK) {
        severity = CONTENT_MODERATION.SEVERITY.BLOCKED;
    } else if (compositeScore >= CONTENT_MODERATION.THRESHOLDS.FLAG) {
        severity = CONTENT_MODERATION.SEVERITY.FLAGGED;
    } else {
        severity = CONTENT_MODERATION.SEVERITY.CLEAN;
    }

    // Build human-readable reason list
    const reasons = [];
    const flags = [];

    if (profanityResult.found) {
        profanityResult.categories.forEach(cat => {
            flags.push(cat.toLowerCase());
            const catLabel = cat.replace(/_/g, ' ').toLowerCase();
            reasons.push(`Content contains ${catLabel}`);
        });
    }
    if (spamResult.found) {
        spamResult.patterns.forEach(p => {
            flags.push(p);
            reasons.push(`Spam pattern detected: ${p.replace(/_/g, ' ')}`);
        });
    }
    if (urlResult.found) {
        flags.push('suspicious_urls');
        reasons.push(`Suspicious or shortened URLs detected (${urlResult.urls.length})`);
    }

    return {
        passed: severity !== CONTENT_MODERATION.SEVERITY.BLOCKED,
        score: compositeScore,
        severity,
        flags,
        reasons,
        details: {
            profanity: profanityResult,
            spam: spamResult,
            urls: urlResult,
        },
    };
}

/**
 * Analyze multiple fields and return the worst-case result
 * Used by the middleware to check title + description + content together
 * @param {object} fieldsMap - { fieldName: fieldText }
 * @param {object} options
 * @returns {{ passed: boolean, score: number, severity: string, flags: string[], reasons: string[], fieldResults: object }}
 */
function analyzeFields(fieldsMap, options = {}) {
    const fieldResults = {};
    let worstScore = 0;
    let worstSeverity = CONTENT_MODERATION.SEVERITY.CLEAN;
    const allFlags = [];
    const allReasons = [];

    for (const [fieldName, fieldText] of Object.entries(fieldsMap)) {
        if (!fieldText) continue;
        const result = analyzeText(fieldText, options);
        fieldResults[fieldName] = result;

        if (result.score > worstScore) {
            worstScore = result.score;
            worstSeverity = result.severity;
        }

        // Deduplicate flags and reasons
        result.flags.forEach(f => { if (!allFlags.includes(f)) allFlags.push(f); });
        result.reasons.forEach(r => { if (!allReasons.includes(r)) allReasons.push(r); });
    }

    return {
        passed: worstSeverity !== CONTENT_MODERATION.SEVERITY.BLOCKED,
        score: worstScore,
        severity: worstSeverity,
        flags: allFlags,
        reasons: allReasons,
        fieldResults,
    };
}

module.exports = {
    analyzeText,
    analyzeFields,
    checkProfanity,
    checkSpamPatterns,
    checkUrls,
    normalizeText,
};
