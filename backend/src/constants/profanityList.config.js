/**
 * Profanity & Offensive Content Word List
 * Phase-5: Content Moderation System
 *
 * ─── EXTENSION GUIDE ────────────────────────────────────────────────────────
 * To add words: push to the appropriate category array below.
 * To remove words: delete from the array.
 * Admin API endpoint (POST /api/v1/moderation/profanity) can update
 * RUNTIME_ADDITIONS at runtime without a server restart.
 *
 * NOTE: The moderation service normalizes text before matching:
 *   - Lowercased
 *   - Leet-speak substitution  (@ → a, 3 → e, 1 → i, 0 → o, 5 → s, 4 → a)
 *   - Removes repeated characters (faaaarr → far)
 *   - Strips punctuation between letters (f.u.c.k → fuck)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Category: Severe / Hate Speech (weight: HIGH) ──────────────────────────
const HATE_SPEECH = [
    // Racial / ethnic slurs — intentionally abbreviated to avoid storing full strings
    'nigger', 'nigga', 'chink', 'spic', 'kike', 'wetback', 'raghead',
    'cracker', 'gook', 'jap', 'darkie', 'coon', 'zipperhead', 'beaner',
    // Religious hate
    'islamofascist', 'christfag',
    // Gender/sexuality hate
    'faggot', 'dyke', 'tranny', 'shemale',
];

// ─── Category: Explicit Sexual Content (weight: HIGH) ────────────────────────
const EXPLICIT_SEXUAL = [
    'fuck', 'fucker', 'fucking', 'motherfucker', 'mf',
    'cunt', 'pussy', 'dick', 'cock', 'penis', 'vagina', 'asshole',
    'shit', 'bullshit', 'bastard', 'bitch', 'slut', 'whore', 'hoe',
    'blowjob', 'handjob', 'deepthroat', 'gangbang', 'horny',
    'masturbate', 'masturbation', 'orgasm', 'cumshot', 'cum',
    'dildo', 'vibrator', 'anal', 'oral sex', 'nude', 'nudes',
    'porn', 'pornography', 'xxx', 'nsfw',
];

// ─── Category: Violence / Threats (weight: HIGH) ─────────────────────────────
const VIOLENCE_THREATS = [
    'kill yourself', 'kys', 'go die', 'die bitch', 'i will kill',
    'i want to kill', 'murder you', 'shoot you', 'bomb threat',
    'terrorist', 'genocide', 'mass murder', 'suicide bomber',
    'i hope you die', 'get cancer', 'hope you get raped',
];

// ─── Category: Harassment / Bullying (weight: MEDIUM) ────────────────────────
const HARASSMENT = [
    'loser', 'retard', 'retarded', 'moron', 'idiot', 'imbecile',
    'stupid', 'dumbass', 'dumb', 'pathetic', 'worthless', 'ugly',
    'fat pig', 'brainless', 'shut up', 'go to hell', 'freak',
    'creep', 'weirdo', 'freak show',
];

// ─── Category: Self-Harm / Dangerous Content (weight: HIGH) ──────────────────
const SELF_HARM = [
    'kill myself', 'end my life', 'want to die', 'slit my wrists',
    'suicide method', 'how to commit suicide', 'overdose on',
];

// ─── Category: Spam Phrases (weight: LOW — handled separately by spam check) ─
const SPAM_PHRASES = [
    'click here', 'free money', 'make money fast', 'earn from home',
    'crypto giveaway', 'send crypto', 'limited offer', 'act now',
    'buy followers', 'cheap followers', '100% free', 'guaranteed income',
];

// ─── Runtime Additions (populated by Admin API at runtime) ──────────────────
// This array is mutated by admin.moderation.service.js — do NOT freeze it
const RUNTIME_ADDITIONS = [];

// ─── Compiled Export ─────────────────────────────────────────────────────────
const PROFANITY_LIST = Object.freeze([
    ...HATE_SPEECH,
    ...EXPLICIT_SEXUAL,
    ...VIOLENCE_THREATS,
    ...HARASSMENT,
    ...SELF_HARM,
]);

// Severity category mapping — used for flag labeling in moderation reports
const PROFANITY_CATEGORIES = Object.freeze({
    HATE_SPEECH: { words: HATE_SPEECH, severity: 'high', score: 85 },
    EXPLICIT_SEXUAL: { words: EXPLICIT_SEXUAL, severity: 'high', score: 80 },
    VIOLENCE_THREATS: { words: VIOLENCE_THREATS, severity: 'critical', score: 95 },
    HARASSMENT: { words: HARASSMENT, severity: 'medium', score: 50 },
    SELF_HARM: { words: SELF_HARM, severity: 'critical', score: 90 },
    SPAM_PHRASES: { words: SPAM_PHRASES, severity: 'low', score: 30 },
});

module.exports = {
    PROFANITY_LIST,
    PROFANITY_CATEGORIES,
    SPAM_PHRASES,
    RUNTIME_ADDITIONS,      // mutable — admin API pushes/splices this
};
