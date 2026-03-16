# OpenSystems Backend — Phase 3 Complete

> **Production-grade MERN backend with comprehensive security, scalability, and modular architecture**

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Feature Completion Status](#feature-completion-status)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Security Features](#security-features)
- [Database Schema](#database-schema)
- [Contributing](#contributing)

---

## 🎯 Overview

OpenSystems is a **social collaboration platform** for students and professionals to share problems, ideas, and collaborate on projects. All three development phases are now **complete**.

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Base architecture, auth foundation | ✅ Complete |
| Phase 2 | Problem Feed + Developer Mode modules | ✅ Complete |
| Phase 3 | Notifications, Admin Audit, Bookmarks, Follower system | ✅ Complete |

---

## ✅ Feature Completion Status

### 🔐 Authentication & Security
- [x] Username-based registration with structured fullname
- [x] Email/password login with JWT (access + refresh tokens)
- [x] Logout (single device) + Logout All (all devices)
- [x] Email verification (token-based, 24h expiry)
- [x] OTP / Two-Factor Authentication (6-digit, 10-min expiry)
- [x] Brute force protection (5 attempts → 15-min lockout)
- [x] Device tracking (max 5 devices, auto-cleanup of oldest)
- [x] Hashed refresh token storage

### 👤 User System
- [x] User profile (bio, profession, college/company, skills)
- [x] Profile update, password update, skills update
- [x] User search (full-text across username, name, skills)
- [x] `savedPosts` (Bookmarks) — field on User model
- [x] `followersCount` + `followingCount` — denormalized counters
- [x] Role system: `user`, `moderator`, `admin`
- [x] Account status: `active`, `suspended`, `banned`

### 📌 Problem Feed
- [x] Create posts (discussion, problem, idea, question)
- [x] Multimedia support (images, videos, code snippets, documents)
- [x] Upvote / downvote with `voteScore` denormalization
- [x] Personalized + public feed
- [x] Trending posts (configurable time windows: 24h, 7d, 30d, all)
- [x] Full-text search by keyword and tag
- [x] Post visibility (public, private, followers)
- [x] Hide post (owner only, soft delete)
- [x] Tag-based filtering

### 🚀 Developer Mode
- [x] Create projects with tech stack and required roles
- [x] Project stages: idea → prototype → production
- [x] Team enrollment request workflow
- [x] Owner approval / rejection of enrollment requests
- [x] Role assignment on approval (contributor, designer, backend, frontend, tester)
- [x] Project update + soft delete (owner only)
- [x] Project feed, trending, and full-text search
- [x] Voting and commenting on projects
- [x] Reporting projects

### 💬 Comments
- [x] Nested comments with path-array structure (max depth 5)
- [x] Comment on posts and projects
- [x] Update / delete comment (owner only)
- [x] Anti-spam protection

### 🚨 Reports & Moderation
- [x] Report posts, projects, and comments
- [x] Severity levels: low, medium, high, critical
- [x] Moderation status: pending, approved, rejected, flagged
- [x] Anti-spam on report submissions

### 🔍 Unified Search
- [x] Search users, posts, projects via `/api/v1/search`
- [x] Optional auth for personalized analytics

### 🔔 Notification System *(Phase 3)*
- [x] `Notification` model — full schema with TTL (auto-delete after 30 days)
- [x] Notification types: `project_approval`, `comment_reply`, `mention`, `moderation_alert`, `enrollment_update`, `vote_milestone`
- [x] `markAsRead()` instance method
- [x] `getUnreadCount()` static method
- [x] `markAllAsRead()` static method
- [x] Indexed for unread queries and per-user pagination

### 🛡 Admin Audit Log *(Phase 3)*
- [x] `AdminAuditLog` model — permanent retention (no TTL, for legal compliance)
- [x] Tracks: `ban_user`, `suspend_user`, `delete_post`, `delete_project`, `approve_report`, `reject_report`, `pin_post`, `unpin_post`, `flag_content`, `unflag_content`
- [x] `logAdminAction()` static method
- [x] `getAdminActions()` — paginated admin history
- [x] `getTargetHistory()` — full action history for a specific content target

### 📊 Activity Logging
- [x] Audit trail for all major actions (login, post, vote, comment, enroll, report)
- [x] 90-day TTL auto-cleanup
- [x] Abuse pattern detection — rapid voting, repeated content, multi-account same IP
- [x] Suspicious activity flagging via `ACTIVITY_TYPES.SUSPICIOUS_ACTIVITY`

---

## 🛠 Tech Stack

### Core
| Package | Version | Purpose |
|---------|---------|---------|
| Node.js | ≥ 18.x | Runtime |
| Express.js | ^4.18.2 | Web framework |
| MongoDB | 6.x | NoSQL database |
| Mongoose | ^8.0.3 | ODM |

### Security
| Package | Purpose |
|---------|---------|
| bcryptjs | Password hashing (10 rounds) + refresh token hashing |
| jsonwebtoken | JWT access + refresh tokens |
| helmet | Security headers |
| express-rate-limit | IP-based rate limiting |
| rate-limiter-flexible | Per-user/device/action rate limiting |
| xss-clean / xss | XSS sanitization |
| express-mongo-sanitize | NoSQL injection prevention |

### Validation & Utilities
| Package | Purpose |
|---------|---------|
| joi | Schema validation (body, params, query) |
| express-validator | Request validation helpers |
| multer | File upload (images, videos, docs) |
| winston | Structured application logging |
| morgan | HTTP request logging |
| compression | Response compression |
| uuid | Device ID generation |
| dayjs | Date/time utilities |
| lodash | Utility functions |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                             # Express app + middleware stack
│   ├── config/
│   │   └── db.js                          # MongoDB connection
│   ├── constants/
│   │   ├── index.js                       # 25+ app-wide enums and limits
│   │   └── featureFlags.js                # Runtime feature toggle system
│   ├── models/
│   │   ├── User.js                        # Users (auth, devices, bookmarks, followers)
│   │   ├── Post.js                        # Problem feed (multimedia, voting, voteScore)
│   │   ├── Project.js                     # Developer mode (enrollment, roles, team)
│   │   ├── Comment.js                     # Nested comments (path-array, depth 5)
│   │   ├── Report.js                      # Content moderation
│   │   ├── ActivityLog.js                 # Audit trail (90-day TTL)
│   │   ├── Notification.js                # Notification system (Phase 3) ✅
│   │   └── AdminAuditLog.js               # Admin actions permanent log (Phase 3) ✅
│   ├── controllers/
│   │   ├── auth.controller.js             # register, login, logout, OTP, verify-email
│   │   ├── user.controller.js             # profile, password, skills, search
│   │   ├── post.controller.js             # CRUD, feed, trending, vote, comment, report
│   │   ├── project.controller.js          # CRUD, enroll, approve/reject, vote, comment, report
│   │   ├── comment.controller.js          # comment CRUD
│   │   ├── report.controller.js           # report submission
│   │   └── search.controller.js           # unified search
│   ├── services/
│   │   ├── auth/                          # register, login, OTP business logic
│   │   ├── user/                          # profile, password services
│   │   ├── post/                          # CRUD, media, voting services
│   │   ├── project/                       # project management services
│   │   ├── comment/                       # comment services
│   │   ├── report/                        # report services
│   │   ├── activity/                      # activity logging service
│   │   └── search/                        # search service
│   ├── middlewares/
│   │   ├── authMiddleware.js              # protect + optionalAuth
│   │   ├── roleMiddleware.js              # RBAC (user / moderator / admin)
│   │   ├── validate.middleware.js         # Joi body / params / query validation
│   │   ├── sanitize.middleware.js         # XSS + NoSQL sanitization
│   │   ├── rateLimit.middleware.js        # Per-route rate limiters
│   │   ├── antiSpam.middleware.js         # Abuse pattern detection
│   │   ├── ownership.middleware.js        # Post / Project / Comment ownership guards
│   │   ├── errorMiddleware.js             # Global error handler
│   │   ├── loggerMiddleware.js            # Morgan HTTP logger
│   │   ├── asyncHandler.js               # Async error wrapper
│   │   └── optionalAuth.middleware.js     # Optional JWT middleware
│   ├── routes/
│   │   ├── index.js                       # Route aggregator → /api/v1
│   │   ├── auth.routes.js                 # /api/v1/auth
│   │   ├── user.routes.js                 # /api/v1/users
│   │   ├── post.routes.js                 # /api/v1/posts
│   │   ├── project.routes.js              # /api/v1/projects
│   │   ├── comment.routes.js              # /api/v1/comments
│   │   ├── report.routes.js               # /api/v1/reports
│   │   └── search.routes.js               # /api/v1/search
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── user.validator.js
│   │   ├── post.validator.js
│   │   ├── project.validator.js
│   │   ├── comment.validator.js
│   │   ├── report.validator.js
│   │   ├── search.validator.js
│   │   └── common.validator.js
│   └── utils/
│       └── logger.js                      # Winston logger config
├── .env                                   # Secrets (not committed)
├── .env.example                           # Environment template
├── .gitignore
├── package.json
├── server.js                              # Entry point
└── README.md
```

---

## 🚀 Installation

### Prerequisites
- Node.js v18.x or higher
- MongoDB v6.x (local or Atlas)
- npm v9.x or higher

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/stillYG108/opensystems.git
   cd opensystems/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Start the server**
   ```bash
   # Development (hot reload)
   npm run dev

   # Production
   npm start
   ```

---

## 🔧 Environment Variables

See `.env.example` for the complete list. Key variables:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/opensystems

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
REFRESH_TOKEN_EXPIRE=30d

# CORS
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# File Upload Limits (bytes)
MAX_IMAGE_SIZE=5242880       # 5 MB
MAX_VIDEO_SIZE=52428800      # 50 MB
MAX_DOCUMENT_SIZE=10485760   # 10 MB

# Feature Flags
FEATURE_PROBLEM_FEED=true
FEATURE_DEVELOPER_MODE=true
FEATURE_COMMENTS=true
FEATURE_VOTING=true
FEATURE_REPORTING=true
FEATURE_SEARCH=true
FEATURE_FILE_UPLOADS=true
FEATURE_VIDEO_UPLOADS=true
FEATURE_CODE_SNIPPETS=true
FEATURE_NOTIFICATIONS=true        # Phase 3 ✅
FEATURE_BOOKMARKS=true            # Phase 3 ✅
FEATURE_FOLLOWING=true            # Phase 3 ✅

# System
MAINTENANCE_MODE=false
READ_ONLY_MODE=false
```

---

## 📚 API Documentation

> **Base URL:** `http://localhost:5000/api/v1`

### 🔍 Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API v1 status check |

---

### 🔐 Auth — `/api/v1/auth`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login with email + password | No |
| POST | `/logout` | Logout from current device | ✅ |
| POST | `/logout-all` | Logout from all devices | ✅ |
| POST | `/verify-email` | Verify email via token | No |
| POST | `/verify-otp` | Verify OTP (2FA) | No |
| POST | `/resend-otp` | Resend OTP | No |

---

### 👤 Users — `/api/v1/users`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/me` | Get current user profile | ✅ |
| PATCH | `/profile` | Update profile (bio, profession, etc.) | ✅ |
| PATCH | `/password` | Change password | ✅ |
| PATCH | `/skills` | Update skills list (max 20) | ✅ |
| GET | `/search` | Search users by username / name / skills | No |

---

### 📌 Posts — `/api/v1/posts`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create post | ✅ |
| GET | `/feed` | Get public/personalized feed | Optional |
| GET | `/trending` | Get trending posts | No |
| GET | `/search` | Full-text search | No |
| GET | `/:postId` | Get post by ID | Optional |
| PATCH | `/:postId/hide` | Hide post (owner only) | ✅ |
| PATCH | `/:postId/vote` | Upvote / downvote | ✅ |
| POST | `/:postId/comment` | Add comment | ✅ |
| POST | `/:postId/report` | Report post | ✅ |

---

### 🚀 Projects — `/api/v1/projects`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create project | ✅ |
| GET | `/feed` | Get project feed | No |
| GET | `/trending` | Get trending projects | No |
| GET | `/search` | Full-text search | No |
| PATCH | `/:projectId` | Update project (owner only) | ✅ |
| DELETE | `/:projectId` | Delete project (owner only) | ✅ |
| POST | `/:projectId/enroll` | Request enrollment | ✅ |
| PATCH | `/:projectId/enroll/:userId/approve` | Approve enrollment | ✅ Owner |
| PATCH | `/:projectId/enroll/:userId/reject` | Reject enrollment | ✅ Owner |
| PATCH | `/:projectId/vote` | Vote on project | ✅ |
| POST | `/:projectId/comment` | Comment on project | ✅ |
| POST | `/:projectId/report` | Report project | ✅ |

---

### 💬 Comments — `/api/v1/comments`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create comment | ✅ |
| GET | `/` | Get comments (filter by postId / projectId) | No |
| PATCH | `/:commentId` | Update comment (owner only) | ✅ |
| DELETE | `/:commentId` | Delete comment (owner only) | ✅ |

---

### 🚨 Reports — `/api/v1/reports`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Submit a report | ✅ |

---

### 🔍 Search — `/api/v1/search`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users` | Search users | Optional |
| GET | `/posts` | Search posts | Optional |
| GET | `/projects` | Search projects | Optional |

---

## 🧪 Testing

### Register a User
```http
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "fullname": { "firstName": "John", "lastName": "Doe" },
  "email": "john@example.com",
  "password": "SecurePass123!",
  "userType": "student",
  "profession": "Software Developer",
  "skills": ["JavaScript", "Node.js", "MongoDB"]
}
```

### Login
```http
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{ "email": "john@example.com", "password": "SecurePass123!" }
```

### Create a Post
```http
POST http://localhost:5000/api/v1/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "How do I reverse a linked list in O(1) space?",
  "contentType": "question",
  "tags": ["algorithms", "data-structures"]
}
```

### Create a Project
```http
POST http://localhost:5000/api/v1/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "OpenSystems Mobile App",
  "description": "Building a React Native frontend for OpenSystems.",
  "techStack": ["React Native", "Expo"],
  "rolesNeeded": ["mobile-developer", "ui-designer"]
}
```

### Security Test — Brute Force
```http
# After 5 wrong passwords, account locks for 15 minutes
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{ "email": "john@example.com", "password": "WrongPass!" }
```

### Security Test — NoSQL Injection
```http
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{ "email": { "$ne": null }, "password": { "$ne": null } }
# → sanitized and rejected by express-mongo-sanitize
```

### MongoDB Shell Verification
```bash
mongosh
use opensystems

# Check Phase 3 — Notification TTL index (30 days)
db.notifications.getIndexes()

# Check AdminAuditLog has NO TTL (permanent)
db.adminauditlogs.getIndexes()

# Verify User has savedPosts, followersCount, followingCount
db.users.findOne({}, { savedPosts: 1, followersCount: 1, followingCount: 1 })

# Check ActivityLog TTL (90 days)
db.activitylogs.getIndexes()
```

---

## 🔒 Security Features

| Feature | Status | Details |
|---------|--------|---------|
| Password Hashing | ✅ | bcryptjs, 10 rounds |
| JWT Authentication | ✅ | Access (7d) + refresh (30d) tokens |
| Refresh Token Hashing | ✅ | bcrypt-hashed in DB |
| Brute Force Protection | ✅ | 5 attempts → 15-min lockout |
| Device Management | ✅ | Max 5 devices, auto-cleanup |
| Rate Limiting | ✅ | Per-route (auth, post, vote, comment, enroll, report) |
| Anti-Spam | ✅ | Rapid action + repeated content detection |
| Input Sanitization | ✅ | xss-clean + express-mongo-sanitize |
| Joi Validation | ✅ | All bodies, params, and queries validated |
| Ownership Guards | ✅ | Posts, projects, and comments |
| Soft Deletes | ✅ | Data integrity preserved |
| HTTP Security Headers | ✅ | Helmet.js |
| CORS | ✅ | Configurable via `CLIENT_URL` |
| Activity Logging | ✅ | 90-day TTL, abuse detection |
| Admin Audit Log | ✅ | Permanent, per-action reason required |

---

## 🗄 Database Schema

### Models Overview

| Model | Phase | Purpose | Retention |
|-------|-------|---------|-----------|
| **User** | 1+2+3 | Auth, profile, devices, bookmarks, followers | Permanent |
| **Post** | 2 | Problem feed with multimedia + voting | Permanent (soft delete) |
| **Project** | 2 | Developer mode — teams + enrollment | Permanent (soft delete) |
| **Comment** | 2 | Nested comments (path-array, depth 5) | Permanent (soft delete) |
| **Report** | 2 | Content moderation | Permanent |
| **ActivityLog** | 2 | Audit trail + abuse detection | **90-day TTL** |
| **Notification** | 3 ✅ | User notifications (6 types) | **30-day TTL** |
| **AdminAuditLog** | 3 ✅ | Moderator/admin actions | **Permanent** (legal) |

### Indexing Strategy

- **50+ optimized indexes** across all models
- **Text indexes** for full-text search (content, tags, skills, username)
- **Compound indexes** for feed queries (author + time, visibility + isDeleted)
- **TTL indexes** — ActivityLog (90d), Notification (30d)
- **voteScore denormalization** — O(log n) trending query performance

### Key Enums (constants/index.js)

| Constant | Values |
|----------|--------|
| `ROLES` | user, moderator, admin |
| `USER_TYPES` | student, professional |
| `ACCOUNT_STATUS` | active, suspended, banned |
| `CONTENT_TYPE` | discussion, problem, idea, question |
| `PROJECT_STAGES` | idea, prototype, production |
| `PROJECT_ROLES` | contributor, designer, backend, frontend, tester |
| `VOTE_TYPES` | upvote, downvote, neutral |
| `NOTIFICATION_TYPES` | project_approval, comment_reply, mention, moderation_alert, enrollment_update, vote_milestone |
| `REPORT_SEVERITY` | low, medium, high, critical |

---

## 🤝 Contributing

### Development Workflow

1. Branch off `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Follow project conventions:
   - **Thin controllers** — delegate to service layer
   - **Joi validators** for all new inputs
   - **`asyncHandler`** on every async controller function
   - **Activity logging** for all significant user actions

3. Test manually via Postman / Thunder Client

4. Commit with semantic message
   ```bash
   git commit -m "feat: add notification read endpoint"
   ```

5. Push and open a PR
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style
- ES6+ throughout
- `async/await` only — no callbacks
- MVC + Service layer separation
- JSDoc on all service functions
- Consistent error handling via `asyncHandler` + `errorMiddleware`

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 📞 Support

- Open an issue on [GitHub](https://github.com/stillYG108/opensystems)
- Email: support@opensystems.com

---

**Built with ❤️ by the OpenSystems Team**
