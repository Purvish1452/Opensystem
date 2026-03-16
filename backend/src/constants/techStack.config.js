/**
 * Normalized Tech Stack Constants
 * Used for project.techStack validation and recruiter search
 */

const TECH_STACK = Object.freeze({
    // Languages
    JAVASCRIPT: 'JavaScript',
    TYPESCRIPT: 'TypeScript',
    PYTHON: 'Python',
    JAVA: 'Java',
    CPP: 'C++',
    C: 'C',
    CSHARP: 'C#',
    GO: 'Go',
    RUST: 'Rust',
    KOTLIN: 'Kotlin',
    SWIFT: 'Swift',
    PHP: 'PHP',
    RUBY: 'Ruby',
    DART: 'Dart',
    SCALA: 'Scala',
    R: 'R',
    MATLAB: 'MATLAB',
    BASH: 'Bash',

    // Frontend
    REACT: 'React',
    NEXTJS: 'Next.js',
    VUE: 'Vue.js',
    NUXTJS: 'Nuxt.js',
    ANGULAR: 'Angular',
    SVELTE: 'Svelte',
    HTML: 'HTML',
    CSS: 'CSS',
    TAILWINDCSS: 'Tailwind CSS',
    BOOTSTRAP: 'Bootstrap',
    REDUX: 'Redux',
    ZUSTAND: 'Zustand',

    // Backend
    NODEJS: 'Node.js',
    EXPRESS: 'Express.js',
    NESTJS: 'NestJS',
    FASTAPI: 'FastAPI',
    DJANGO: 'Django',
    FLASK: 'Flask',
    SPRING_BOOT: 'Spring Boot',
    LARAVEL: 'Laravel',
    RAILS: 'Ruby on Rails',
    GRAPHQL: 'GraphQL',
    REST_API: 'REST API',
    GRPC: 'gRPC',

    // Databases
    MONGODB: 'MongoDB',
    POSTGRESQL: 'PostgreSQL',
    MYSQL: 'MySQL',
    SQLITE: 'SQLite',
    REDIS: 'Redis',
    FIREBASE: 'Firebase',
    SUPABASE: 'Supabase',
    CASSANDRA: 'Cassandra',
    ELASTICSEARCH: 'Elasticsearch',

    // DevOps / Cloud
    DOCKER: 'Docker',
    KUBERNETES: 'Kubernetes',
    AWS: 'AWS',
    GCP: 'Google Cloud',
    AZURE: 'Azure',
    LINUX: 'Linux',
    NGINX: 'Nginx',
    GITHUB_ACTIONS: 'GitHub Actions',
    TERRAFORM: 'Terraform',
    ANSIBLE: 'Ansible',

    // Mobile
    REACT_NATIVE: 'React Native',
    FLUTTER: 'Flutter',
    ANDROID: 'Android',
    IOS: 'iOS',

    // ML / Data
    TENSORFLOW: 'TensorFlow',
    PYTORCH: 'PyTorch',
    SCIKIT_LEARN: 'scikit-learn',
    PANDAS: 'Pandas',
    NUMPY: 'NumPy',
    OPENCV: 'OpenCV',

    // Tools
    GIT: 'Git',
    FIGMA: 'Figma',
    POSTMAN: 'Postman',
    WEBSOCKETS: 'WebSockets',
    SOCKET_IO: 'Socket.IO',
    STRIPE: 'Stripe',
});

module.exports = { TECH_STACK };
