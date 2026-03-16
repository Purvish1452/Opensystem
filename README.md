# OpenSystems Backend — Phase 2 Complete

> **Production-ready MERN backend with Problem Feed & Developer Mode modules**

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

OpenSystems is a **social collaboration platform** for students and professionals to share problems, ideas, and collaborate on projects.

| Phase   | Focus                                                  | Status      |
| ------- | ------------------------------------------------------ | ----------- |
| Phase 1 | Base architecture, auth foundation                     | ✅ Complete |
| Phase 2 | Problem Feed + Developer Mode modules                  | ✅ Complete |
| Phase 3 | Notifications, Admin Audit, Bookmarks, Follower system | ⚠ Pending   |

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

---

## 🛠 Tech Stack

### Core

| Package    | Version | Purpose        |
| ---------- | ------- | -------------- |
| Node.js    | ≥ 18.x  | Runtime        |
| Express.js | ^4.18.2 | Web framework  |
| MongoDB    | 6.x     | NoSQL database |
| Mongoose   | ^8.0.3  | ODM            |

### Security

| Package                | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| bcryptjs               | Password hashing (10 rounds) + refresh token hashing |
| jsonwebtoken           | JWT access + refresh tokens                          |
| helmet                 | Security headers                                     |
| express-rate-limit     | IP-based rate limiting                               |
| rate-limiter-flexible  | Per-user/device/action rate limiting                 |
| xss-clean / xss        | XSS sanitization                                     |
| express-mongo-sanitize | NoSQL injection prevention                           |

### Validation & Utilities

| Package           | Purpose                                 |
| ----------------- | --------------------------------------- |
| joi               | Schema validation (body, params, query) |
| express-validator | Request validation helpers              |
| multer            | File upload (images, videos, docs)      |
| winston           | Structured application logging          |
| morgan            | HTTP request logging                    |
| compression       | Response compression                    |
| uuid              | Device ID generation                    |
| dayjs             | Date/time utilities                     |
| lodash            | Utility functions                       |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js
│   ├── config/db.js
│   ├── constants/
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Project.js
│   │   ├── Comment.js
│   │   ├── Report.js
│   │   └── ActivityLog.js
│   ├── controllers/
│   ├── services/
│   ├── middlewares/
│   ├── routes/
│   ├── validators/
│   └── utils/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- Node.js v18.x or higher
- MongoDB v6.x (local or Atlas)
- npm v9.x or higher

### Steps

```bash
git clone https://github.com/stillYG108/opensystems.git
cd opensystems/backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev  # Development
npm start    # Production
```

---

## 🔧 Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/opensystems
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
REFRESH_TOKEN_EXPIRE=30d
CLIENT_URL=http://localhost:3000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
MAX_IMAGE_SIZE=5242880
MAX_VIDEO_SIZE=52428800
MAX_DOCUMENT_SIZE=10485760
FEATURE_PROBLEM_FEED=true
FEATURE_DEVELOPER_MODE=true
FEATURE_COMMENTS=true
FEATURE_VOTING=true
FEATURE_REPORTING=true
FEATURE_SEARCH=true
FEATURE_FILE_UPLOADS=true
FEATURE_VIDEO_UPLOADS=true
FEATURE_CODE_SNIPPETS=true
MAINTENANCE_MODE=false
READ_ONLY_MODE=false
```

---

## 📚 API Documentation

> Base URL: `http://localhost:5000/api/v1`

- **Auth**: `/auth` → register, login, logout, verify-email, OTP
- **Users**: `/users` → profile, update, search
- **Posts**: `/posts` → create, feed, trending, vote, comment, report
- **Projects**: `/projects` → create, feed, enroll, approve/reject, vote, comment, report
- **Comments**: `/comments` → CRUD
- **Reports**: `/reports` → submit
- **Search**: `/search` → unified search

---

## 🧪 Testing Examples

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/posts
POST /api/v1/projects
POST /api/v1/comments
POST /api/v1/reports
```

---

## 🔒 Security Features

- Password hashing (bcrypt)
- JWT access + refresh
- Brute force protection
- Device tracking
- Rate limiting
- XSS + NoSQL sanitization
- Soft deletes
- Activity logging

---

## 🗄 Database Schema

| Model       | Purpose                | Retention               |
| ----------- | ---------------------- | ----------------------- |
| User        | Auth, profile, devices | Permanent               |
| Post        | Problem feed           | Permanent (soft delete) |
| Project     | Developer mode         | Permanent (soft delete) |
| Comment     | Nested comments        | Permanent (soft delete) |
| Report      | Content moderation     | Permanent               |
| ActivityLog | Audit trail            | 90-day TTL              |

---

## 🤝 Contributing

1. Branch off `main`
2. Thin controllers → Service layer
3. Joi validators for input
4. Use `asyncHandler` in controllers
5. Test manually
6. Commit semantically: `git commit -m "feat: add project enrollment endpoint"`
7. Push branch → PR

---

## 📝 License

MIT License — see [LICENSE](LICENSE)

---

**Built with ❤️ by the OpenSystems Team**

---
