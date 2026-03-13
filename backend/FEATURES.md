# OpenSystems Backend — Feature & Capability Report

> **Stack:** Node.js · Express.js · MongoDB (Mongoose) · JWT Auth  
> **Base URL:** `http://localhost:5000/api/v1`

---

## 🔐 Authentication Module
**Prefix:** `/api/v1/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new user with email + password |
| POST | `/login` | Public | Login, returns JWT access + refresh tokens |
| POST | `/logout` | Private | Logout from current device (invalidates token) |
| POST | `/logout-all` | Private | Logout from ALL devices |
| POST | `/verify-email` | Public | Verify email via token sent on registration |
| POST | `/verify-otp` | Public | Verify OTP for 2FA |
| POST | `/resend-otp` | Public | Resend OTP |

**Capabilities:**
- JWT-based auth with access + refresh token pair
- Multi-device session management (logout-all)
- Email verification flow
- OTP / Two-Factor Authentication
- Rate limited (`authLimiter`) to prevent brute force
- Input sanitization on all auth endpoints

---

## 👤 User Module
**Prefix:** `/api/v1/users`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/me` | Private | Get own full profile |
| PATCH | `/profile` | Private | Update profile (bio, fullname, profileImage, etc.) |
| PATCH | `/password` | Private | Change password (requires old password) |
| PATCH | `/skills` | Private | Update skills array |
| GET | `/search?query=` | Public | Search users by name/username (legacy endpoint) |

**User Schema Fields:**
- `username`, `email`, `password` (hashed, `select: false`)
- `fullname` (firstName, middleName, lastName)
- `bio`, `profileImage`, `coverImage`
- `userType` (student / professional)
- `skills[]`, `interests[]`
- `savedPosts[]`, `hiddenPosts[]` (personal feed control)
- `followersCount`, `followingCount`
- `accountStatus` (active / suspended / banned)
- `isEmailVerified`, `twoFactorEnabled`
- Activity tracking: `lastActiveAt`, `loginHistory[]`

---

## 📝 Post Module
**Prefix:** `/api/v1/posts`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Private | Create new post |
| GET | `/feed` | Public* | Get personalized feed (optional auth) |
| GET | `/trending` | Public | Get trending posts |
| GET | `/search` | Public | Search posts (legacy) |
| GET | `/:postId` | Public* | Get single post by ID |
| PATCH | `/:postId/hide` | Owner only | Hide post globally |
| POST | `/:postId/hide-from-feed` | Private | Hide post from personal feed |
| DELETE | `/:postId/hide-from-feed` | Private | Unhide post from personal feed |
| PATCH | `/:postId/vote` | Private | Upvote / downvote post |
| POST | `/:postId/comment` | Private | Comment on post |
| POST | `/:postId/report` | Private | Report post |

**Post Features:**
- `contentType`: discussion / problem / idea / question
- `visibility`: public / private / followers-only
- Voting system (upvote/downvote with score)
- View count tracking (auto-increments, excludes author)
- Global hide (owner) vs personal feed hide (any user)
- Anti-spam on create, comment, vote, report
- Rate limiting on all write operations

---

## 🚀 Project Module
**Prefix:** `/api/v1/projects`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Private | Create new project |
| GET | `/feed` | Public | Get project feed |
| GET | `/trending` | Public | Get trending projects |
| GET | `/search` | Public | Search projects (legacy) |
| PATCH | `/:projectId` | Owner only | Update project details |
| DELETE | `/:projectId` | Owner only | Soft-delete project |
| POST | `/:projectId/enroll` | Private | Request enrollment |
| PATCH | `/:projectId/enroll/:userId/approve` | Owner only | Approve enrollment |
| PATCH | `/:projectId/enroll/:userId/reject` | Owner only | Reject enrollment (with reason) |
| POST | `/:projectId/comment` | Private | Comment on project |
| PATCH | `/:projectId/vote` | Private | Vote on project |
| POST | `/:projectId/report` | Private | Report project |

**Project Features:**
- `projectStage`: idea / prototype / production
- `status`: active / completed / archived
- `techStack[]`, `tags[]`, `requiredRoles[]`
- Enrollment workflow: request → approve/reject
- Owner cannot enroll in own project
- Soft delete (preserves data)
- Voting with score tracking
- Anti-spam on create, enroll, comment, vote, report

---

## 💬 Comment Module
**Prefix:** `/api/v1/comments`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Private | Create comment (on Post / Project / Comment) |
| GET | `/?parentType=&parentId=` | Public | Get comment tree for entity |
| PATCH | `/:commentId` | Owner only | Edit comment |
| DELETE | `/:commentId` | Owner only | Soft-delete comment |

**Comment Features:**
- Works for **Posts**, **Projects**, and **nested replies**
- Threaded/nested comments up to configurable max depth
- Auto-collapse beyond max depth
- `parentType` + `parentId` polymorphic design
- Soft delete (shows `[deleted]` placeholder in tree)
- Edited flag + timestamp tracking
- Anti-spam protection

---

## 🔍 Search Module
**Prefix:** `/api/v1/search`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/users?query=` | Public* | Search users by name/username/bio/skills |
| GET | `/posts?query=` | Public* | Search posts by title/content/tags |
| GET | `/projects?query=` | Public* | Search projects by title/description/techStack |

**Search Features:**
- Case-insensitive `$regex` substring matching
- Optional auth for analytics logging
- Pagination (`page`, `limit`)
- Filter supports: `userType`, `contentType`, `tags`, `techStack`, `stage`, `status`
- Results sorted by: votes score → most recent

---

## 🚩 Report Module
**Prefix:** `/api/v1/reports`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Private | Submit report on any entity |

**Body:**
```json
{
  "targetType": "User | Post | Project | Comment",
  "targetId": "<entity_id>",
  "reason": "spam | harassment | inappropriate | copyright | misinformation | other",
  "severity": "low | medium | high | critical",
  "description": "optional text"
}
```

**Features:**
- Duplicate report prevention (same user can't report same content twice)
- Rate limited (`reportLimiter`)
- Anti-spam check
- Reporter identity always taken from JWT token

---

## 🛡️ Security & Middleware

| Layer | Details |
|---|---|
| **JWT Auth** | Access + refresh tokens, multi-device session management |
| **Input Validation** | Joi schemas on body, params, and query for all routes |
| **Input Sanitization** | XSS / injection sanitization via `sanitizeMiddleware` |
| **Rate Limiting** | Per-route limiters: auth, post, comment, vote, enroll, report |
| **Anti-Spam** | Content-based spam checks on create/comment/vote/report |
| **Ownership Checks** | `checkPostOwnership`, `checkProjectOwnership`, `checkCommentOwnership` middleware |
| **Optional Auth** | Public routes support optional JWT for analytics |

---

## 📊 Activity Logging

All significant actions are asynchronously logged to `ActivityLog` collection:

| Activity | Logged When |
|---|---|
| REGISTER, LOGIN, LOGOUT | Auth events |
| EMAIL_VERIFICATION, OTP_GENERATED, PASSWORD_CHANGE | Account events |
| POST_CREATE, POST_DELETE | Post lifecycle |
| PROJECT_CREATE, PROJECT_DELETE | Project lifecycle |
| COMMENT, COMMENT_UPDATE, COMMENT_DELETE | Comment actions |
| VOTE | Voting on any entity |
| ENROLL, ENROLL_APPROVE, ENROLL_REJECT | Enrollment workflow |
| REPORT | Reporting any content |
| SEARCH | Search queries (with result count) |
| PROFILE_UPDATE | Profile changes |

> Logged using `setImmediate` — **non-blocking**, never slows down the API response.

---

## 🗄️ Database Models

| Model | Purpose |
|---|---|
| `User` | Accounts, auth, profile, skills, followers, saved/hidden posts |
| `Post` | Problem/idea/discussion posts with voting, visibility, tags |
| `Project` | Collaborative projects with enrollment, tech stack, stages |
| `Comment` | Threaded comments polymorphic across Post/Project/Comment |
| `Report` | Content moderation reports with dedup |
| `ActivityLog` | Audit trail of all user actions |

---

## 📦 Current Limitations / Not Yet Implemented

| Feature | Status |
|---|---|
| Feed filtering by `hiddenPosts` | Schema ready, service logic pending |
| Follow / unfollow users | Schema fields present (`followersCount`), endpoints pending |
| Saved posts (bookmark) | Schema ready, endpoints pending |
| Notifications | Not started |
| Real-time (WebSocket/Socket.io) | Not started |
| Admin dashboard / moderation | Not started |
| File uploads (profileImage, attachments) | Not started |
| Password reset via email | Not started |
