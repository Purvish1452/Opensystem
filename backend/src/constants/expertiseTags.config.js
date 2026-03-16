/**
 * Expertise Tags Constants
 * Used for user.expertise field — recruiter indexing + recommendation engine
 */

const EXPERTISE_TAGS = Object.freeze({
    // Development
    BACKEND_DEV: 'backend development',
    FRONTEND_DEV: 'frontend development',
    FULLSTACK_DEV: 'full stack development',
    MOBILE_DEV: 'mobile development',
    API_DESIGN: 'api design',
    MICROSERVICES: 'microservices',
    SYSTEM_DESIGN: 'system design',

    // CS Fundamentals
    DATA_STRUCTURES: 'data structures',
    ALGORITHMS: 'algorithms',
    COMPETITIVE_PROG: 'competitive programming',
    OS: 'operating systems',
    NETWORKING: 'networking',
    DBMS: 'database management',

    // Specializations
    MACHINE_LEARNING: 'machine learning',
    DEEP_LEARNING: 'deep learning',
    NLP: 'natural language processing',
    COMPUTER_VISION: 'computer vision',
    DATA_SCIENCE: 'data science',
    DATA_ENGINEERING: 'data engineering',
    DEVOPS: 'devops',
    CLOUD_COMPUTING: 'cloud computing',
    CYBERSECURITY: 'cybersecurity',
    BLOCKCHAIN: 'blockchain',
    EMBEDDED_SYSTEMS: 'embedded systems',
    GAME_DEV: 'game development',
    AR_VR: 'ar/vr development',

    // Practices
    OPEN_SOURCE: 'open source',
    UI_UX: 'ui/ux design',
    TESTING: 'testing & qa',
    TECHNICAL_WRITING: 'technical writing',
    PROJECT_MANAGEMENT: 'project management',
    AGILE: 'agile methodology',
});

module.exports = { EXPERTISE_TAGS };
