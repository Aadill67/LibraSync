# 📚 LibraSync — Complete Project Documentation

### A Modern, Full-Stack Library Management System
**Final Year Project | March 2026**

> This document covers **every feature, every implementation, and every technical decision** in the LibraSync project. It is designed to be your single reference for your final year project presentation.

---

## Table of Contents

1. [Introduction & Problem Statement](#1-introduction--problem-statement)
2. [Technology Stack & Architecture](#2-technology-stack--architecture)
3. [Database Design (MongoDB Schemas)](#3-database-design-mongodb-schemas)
4. [Authentication & Security System](#4-authentication--security-system)
5. [Backend API — Every Route Explained](#5-backend-api--every-route-explained)
6. [Frontend — Every Page & Feature](#6-frontend--every-page--feature)
7. [Real-Time Features (Socket.IO)](#7-real-time-features-socketio)
8. [Automated Background Tasks (Cron Jobs)](#8-automated-background-tasks-cron-jobs)
9. [Email Notification System](#9-email-notification-system)
10. [Advanced Features That Set LibraSync Apart](#10-advanced-features-that-set-librasync-apart)
11. [Security Implementation](#11-security-implementation)
12. [PWA (Progressive Web App) Support](#12-pwa-progressive-web-app-support)
13. [File Upload & Media Handling](#13-file-upload--media-handling)
14. [Complete User Flows](#14-complete-user-flows)
15. [What Makes LibraSync Advanced vs Other Projects](#15-what-makes-librasync-advanced-vs-other-projects)
16. [Project Structure](#16-project-structure)
17. [How to Run the Project](#17-how-to-run-the-project)

---

## 1. Introduction & Problem Statement

### What is LibraSync?
LibraSync is a **professional-grade, full-stack Library Management System** built using the MERN stack. It replaces traditional pen-and-paper library registers with a modern, real-time digital platform that handles book cataloging, member management, transaction tracking, fine calculation, and analytics — all through a beautiful, responsive web interface.

### Problem Statement
Traditional library management faces several challenges:
- **Manual record-keeping** is error-prone and slow
- **No real-time tracking** — overdue books go unnoticed until physical audits
- **No communication channel** — students don't receive reminders about due dates
- **No analytics** — librarians can't identify trends (popular books, busy periods)
- **No self-service** — students can't browse catalogs or check availability online

### How LibraSync Solves These Problems
| Problem | LibraSync Solution |
|---------|-------------------|
| Manual tracking | Fully digital transaction management with automatic book count updates |
| Unnoticed overdue books | Auto-calculated fines + daily cron job emails reminders |
| No communication | Real-time Socket.IO notifications + automated email system |
| No analytics | Interactive charts, reports, PDF export, and audit trail |
| No self-service | Full catalog browsing, reservation system, and member portal |

---

## 2. Technology Stack & Architecture

### Full Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | React 19 + Vite 7 | Ultra-fast SPA with HMR (Hot Module Replacement) |
| **UI Library** | Material UI (MUI) v7 | Professional, accessible component library |
| **Animations** | Framer Motion | Smooth page transitions and micro-interactions |
| **Charts** | Recharts | Interactive data visualization (area, bar, pie charts) |
| **PDF Generation** | jsPDF + html2canvas | Export reports and library cards as PDF |
| **QR Codes** | qrcode.react (frontend) + qrcode (backend) | Generate scannable QR codes for books |
| **HTTP Client** | Axios | API communication with interceptors for auto-refresh |
| **State Management** | React Context API | Global auth state and theme mode |
| **Routing** | React Router v7 | Client-side routing with protected routes |
| **Backend Runtime** | Node.js + Express.js | RESTful API server |
| **Database** | MongoDB + Mongoose | NoSQL document database with schema validation |
| **Authentication** | JWT (Access + Refresh Tokens) | Dual-token auth with httpOnly cookies |
| **Real-Time** | Socket.IO | WebSocket-based instant notifications |
| **Email** | Nodemailer | Automated email notifications with HTML templates |
| **Background Jobs** | node-cron | Scheduled daily overdue checks |
| **File Upload** | Multer | Profile photos, book covers, CSV import |
| **Security** | Helmet + express-rate-limit + bcrypt | Headers, rate limiting, password hashing |
| **Validation** | express-validator | Input sanitization and validation |
| **PWA** | vite-plugin-pwa + Workbox | Offline support, installable app |
| **Progress Bar** | NProgress | Top-of-page loading indicator for API calls |

### Architecture Diagram (3-Tier)

```
┌──────────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                       │
│  React 19 + MUI v7 + Framer Motion + Recharts           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ AuthCtx  │  │ ThemeCtx │  │ Axios    │               │
│  │ (JWT)    │  │ (Dark/   │  │ (Auto    │               │
│  │          │  │  Light)  │  │  Refresh)│               │
│  └──────────┘  └──────────┘  └──────────┘               │
│         ↕ HTTP REST API + WebSocket (Socket.IO)          │
├──────────────────────────────────────────────────────────┤
│                   SERVER (Express.js)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Routes   │  │ Middle-  │  │ Utils    │               │
│  │ (9 files)│  │ ware     │  │ (email,  │               │
│  │          │  │ (auth,   │  │  cron)   │               │
│  │          │  │  roles,  │  │          │               │
│  │          │  │  valid.) │  │          │               │
│  └──────────┘  └──────────┘  └──────────┘               │
│         ↕ Mongoose ODM                                   │
├──────────────────────────────────────────────────────────┤
│                   DATABASE (MongoDB)                      │
│  Collections: users, books, booktransactions,            │
│  bookcategories, reviews, notifications, activitylogs    │
└──────────────────────────────────────────────────────────┘
```

### Why This Stack is Advanced
- **Vite 7** (not Create React App) — 10x faster dev server and build times
- **Dual JWT tokens** (access + refresh) — not just a single token like most student projects
- **Socket.IO** for real-time push — most projects only use polling
- **Node-cron** for automated background tasks — not triggered by user actions
- **PWA support** — installable on mobile/desktop, works offline

---

## 3. Database Design (MongoDB Schemas)

### 3.1 User Schema (`models/User.js`)
Stores all user accounts — admins, librarians, and members.

| Field | Type | Description |
|-------|------|-------------|
| `userFullName` | String (required) | Full name |
| `email` | String (required, unique) | Login email, auto-lowercased, regex validated |
| `password` | String (required, select: false) | bcrypt hashed, **excluded from queries by default** for security |
| `role` | Enum: `admin`, `librarian`, `member` | Determines permissions across the entire app |
| `accountStatus` | Enum: `pending`, `active`, `suspended` | Controls login access — new members start as `pending` |
| `admissionId` | String (unique, sparse) | Student ID — alternative login method |
| `employeeId` | String (unique, sparse) | Staff ID — alternative login method |
| `mobileNumber` | String (regex: 10 digits) | Contact number |
| `age`, `gender`, `dob`, `address` | Various | Profile details |
| `photo` | String | URL to uploaded profile photo |
| `points` | Number | Gamification points (future use) |
| `activeTransactions` | [ObjectId → BookTransaction] | Currently borrowed books |
| `prevTransactions` | [ObjectId → BookTransaction] | Return history |
| `wishlist` | [ObjectId → Book] | Saved/bookmarked books |
| `resetPasswordToken` | String | SHA-256 hashed token for password reset |
| `resetPasswordExpires` | Date | Token expiry (1 hour) |

**Virtual field**: `isAdmin` — computed boolean, not stored in DB.

### 3.2 Book Schema (`models/Book.js`)
Stores the book catalog with availability tracking.

| Field | Type | Description |
|-------|------|-------------|
| `bookName` | String (required) | Title |
| `author` | String (required) | Author name |
| `isbn` | String (unique, sparse) | International Standard Book Number |
| `publisher`, `language` | String | Metadata |
| `bookCountAvailable` | Number (min: 0) | **Dynamically updated** when books are issued/returned |
| `bookStatus` | Enum: `available`, `not available` | Quick availability flag |
| `categories` | [ObjectId → BookCategory] | Many-to-many relationship |
| `transactions` | [ObjectId → BookTransaction] | History of all issues for this book |
| `coverImage` | String | URL to uploaded cover image |
| `description` | String | Book summary |
| `avgRating` | Number (0-5) | **Auto-calculated** from reviews via aggregation |
| `ratingsCount` | Number | Total number of reviews |

**Text index** on `bookName`, `author`, `isbn` for full-text search.

### 3.3 BookTransaction Schema (`models/BookTransaction.js`)
The central table that tracks every book issue, return, and reservation.

| Field | Type | Description |
|-------|------|-------------|
| `bookId` | ObjectId → Book (required) | Which book |
| `borrowerId` | ObjectId → User (required) | Who borrowed it |
| `bookName`, `borrowerName` | String | Denormalized for faster display without joins |
| `transactionType` | Enum: `issued`, `reserved`, `returned` | Current action type |
| `fromDate` | Date (required) | Issue/reservation start date |
| `toDate` | Date (required) | Due date / reservation expiry |
| `returnDate` | Date | Actual return date (null until returned) |
| `transactionStatus` | Enum: `active`, `completed`, `overdue`, `reserved` | Lifecycle state |
| `fineAmount` | Number | Fine charged on return (persisted) |
| `finePerDay` | Number (default: 5) | Configurable fine rate (₹5/day) |
| `finePaid` | Boolean | Whether fine has been collected |

**Virtual**: `isOverdue` — runtime check: `status !== completed && now > toDate`
**Method**: `calculateFine()` — computes `daysOverdue × finePerDay` dynamically

### 3.4 BookCategory Schema (`models/BookCategory.js`)
Categories with bidirectional book references.

| Field | Type | Description |
|-------|------|-------------|
| `categoryName` | String (required, unique) | e.g., "Fiction", "Technology" |
| `books` | [ObjectId → Book] | Books in this category |

### 3.5 Review Schema (`models/Review.js`)
5-star book review system with one-review-per-user-per-book constraint.

| Field | Type | Description |
|-------|------|-------------|
| `bookId` | ObjectId → Book | Which book |
| `userId` | ObjectId → User | Who wrote it |
| `rating` | Number (1-5) | Star rating |
| `comment` | String (max 500 chars) | Optional review text |

**Compound unique index**: `{ bookId: 1, userId: 1 }` — enforces one review per user per book at the database level.

### 3.6 Notification Schema (`models/Notification.js`)
In-app notification system with auto-cleanup.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId → User (indexed) | Recipient |
| `type` | Enum: `overdue`, `reservation`, `info`, `fine`, `return`, `issue` | Category |
| `title` | String | Notification heading |
| `message` | String | Notification body |
| `read` | Boolean (default: false) | Read/unread state |
| `link` | String | Internal route to navigate to |

**TTL index**: `expireAfterSeconds: 30 days` — **MongoDB automatically deletes old notifications** after 30 days. Zero maintenance required.

### 3.7 ActivityLog Schema (`models/ActivityLog.js`)
Complete audit trail for compliance and security.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId → User (indexed) | Who performed the action |
| `userName` | String | Name for display |
| `action` | Enum (19 values) | What they did (login, issue_book, backup, etc.) |
| `details` | String | Human-readable description |
| `ipAddress` | String | Client IP for security tracking |

**TTL index**: auto-deletes after **90 days**.

**Supported actions**: `login`, `register`, `issue_book`, `return_book`, `reserve_book`, `cancel_reservation`, `add_book`, `edit_book`, `delete_book`, `add_member`, `delete_member`, `approve_user`, `suspend_user`, `upload_photo`, `import_books`, `export_books`, `backup`, `restore`, `generate_card`, `change_password`, `collect_fine`

---

## 4. Authentication & Security System

### 4.1 Dual-Token JWT Authentication
Unlike basic student projects that use a single JWT token, LibraSync implements **industry-standard dual-token authentication**:

```
┌──────────────────────────────────────────────┐
│  1. User logs in with email + password       │
│                    ↓                         │
│  2. Server issues TWO tokens:                │
│     • Access Token (15 min, sent in JSON)    │
│     • Refresh Token (30 days, httpOnly cookie)│
│                    ↓                         │
│  3. Frontend stores access token in          │
│     localStorage, sends with every request   │
│                    ↓                         │
│  4. When access token expires → 401 error    │
│                    ↓                         │
│  5. Axios interceptor auto-calls /refresh    │
│     with the httpOnly cookie                 │
│                    ↓                         │
│  6. Server issues NEW access token           │
│     User never notices the refresh happened! │
└──────────────────────────────────────────────┘
```

**Why this matters**: The refresh token is in an `httpOnly` cookie, so even if an attacker runs JavaScript on the page (XSS attack), they **cannot steal the refresh token**. The access token has a short 15-minute lifespan, limiting damage from theft.

### 4.2 Password Security
- Passwords are **never stored in plain text** — always hashed with `bcrypt` (10 salt rounds)
- The `password` field uses `select: false` in Mongoose — queries never return the password unless explicitly requested with `.select("+password")`

### 4.3 Password Reset Flow
1. User clicks "Forgot Password" and enters their email
2. Server generates a **32-byte cryptographic random token** using `crypto.randomBytes()`
3. The token is **SHA-256 hashed** before storing in the database (even if the DB is compromised, the token can't be used)
4. A reset link with the **raw token** is emailed to the user
5. When the user clicks the link, the raw token is hashed again and compared to the stored hash
6. Token expires after **1 hour**
7. The endpoint always returns "If an account exists, a reset link has been sent" — preventing **email enumeration attacks**

### 4.4 Role-Based Access Control (RBAC)
Three distinct roles with strict enforcement at both frontend and backend:

| Feature | Admin | Librarian | Member |
|---------|-------|-----------|--------|
| View Dashboard & Books | ✅ | ✅ | ✅ |
| Issue/Return Books | ✅ | ✅ | ❌ |
| Add/Edit Books | ✅ | ✅ | ❌ |
| Delete Books | ✅ | ❌ | ❌ |
| Approve Members | ✅ | ✅ | ❌ |
| View Reports & Audit Log | ✅ | ✅ | ❌ |
| Reserve Books | ✅ | ✅ | ✅ |
| Leave Reviews | ✅ | ✅ | ✅ |
| Delete Users | ✅ | ❌ | ❌ |
| Database Backup/Restore | ✅ | ❌ | ❌ |
| Admin Settings | ✅ | ❌ | ❌ |

**Frontend enforcement**: The sidebar dynamically hides menu items based on role.
**Backend enforcement**: The `authorizeRoles()` middleware rejects unauthorized API calls with 403, even if someone manually crafts a request.

### 4.5 Account Approval Workflow
```
Register → Status: "pending" → Cannot login
     ↓
Librarian/Admin clicks "Approve"
     ↓
Status: "active" → Can login
     ↓
Socket.IO sends real-time "Welcome!" notification to user
```
Admin and Librarian accounts **auto-activate** on first login (no approval needed).

---

## 5. Backend API — Every Route Explained

### 5.1 Auth Routes (`routes/auth.js`) — 6 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Create new account. Validates with express-validator. Hashes password. Returns access + refresh tokens. |
| POST | `/api/auth/signin` | ❌ | Login by email, admissionId, OR employeeId. Checks account status. Auto-activates admin/librarian accounts. |
| POST | `/api/auth/forgot-password` | ❌ | Generates secure reset token. Sends email. Anti-enumeration response. |
| POST | `/api/auth/reset-password/:token` | ❌ | Validates hashed token. Updates password. Clears token fields. |
| POST | `/api/auth/refresh` | Cookie | Validates refresh token cookie. Issues new access token. |
| POST | `/api/auth/logout` | ❌ | Clears the httpOnly refresh token cookie. |

### 5.2 Book Routes (`routes/books.js`) — 9 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/books/allbooks` | ❌ | Advanced search with **6 filter parameters**: title, author, category, search (multi-field), available, language. Plus sorting by 5 fields and server-side pagination. |
| GET | `/api/books/getbook/:id` | ❌ | Single book with populated categories and transactions. |
| GET | `/api/books/category` | ❌ | Get books by category name. |
| GET | `/api/books/qr/:id` | ❌ | Generates a **QR code data URL** pointing to the book's detail page. |
| GET | `/api/books/recommendations` | 🔑 | **Collaborative filtering algorithm** — finds books borrowed by similar users. Falls back to top-rated books for new users (cold-start problem). |
| GET | `/api/books/export` | 🔑 Staff | Exports entire catalog as CSV with 10 columns. Logs the action. |
| POST | `/api/books/addbook` | 🔑 Staff | Add book with validation. Auto-links to categories. |
| POST | `/api/books/import` | 🔑 Staff | **Bulk CSV import** — parses CSV, validates headers, handles errors gracefully, uses `insertMany` with `ordered: false` for partial success. |
| POST | `/api/books/upload-cover/:id` | 🔑 Staff | Upload book cover image via Multer. |
| PUT | `/api/books/updatebook/:id` | 🔑 Staff | Update any book field. |
| DELETE | `/api/books/removebook/:id` | 🔑 Admin | Delete book + cascade cleanup (removes from categories). |

### 5.3 Transaction Routes (`routes/transactions.js`) — 12 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/transactions/add-transaction` | 🔑 Staff | **Issue book flow**: Validates availability → Creates transaction → Decrements book count → Updates user's active transactions → Sends confirmation email → Creates notification → Emits Socket.IO event → Logs activity. All in one atomic operation. |
| PUT | `/api/transactions/return/:id` | 🔑 Staff | **Return flow**: Calculates fine → Updates all statuses → Increments book count → Moves user transaction to "previous" → Sends fine receipt email if applicable. |
| GET | `/api/transactions/all-transactions` | 🔑 | Lists all transactions with **dynamic fine calculation** — fines are computed in real-time for active overdue books, not just from stored values. |
| GET | `/api/transactions/overdue` | 🔑 Staff | Filters only overdue active transactions with computed fines. |
| GET | `/api/transactions/stats` | 🔑 Staff | Dashboard statistics: totals + monthly aggregation + popular books chart data. |
| GET | `/api/transactions/reports` | 🔑 Staff | **Comprehensive analytics**: 12-month trends, category distribution, top 10 books, status breakdown, fine statistics (total/avg/max), member growth, return rate, and busiest month. |
| PUT | `/api/transactions/update-transaction/:id` | 🔑 Staff | Edit any transaction field. |
| DELETE | `/api/transactions/remove-transaction/:id` | 🔑 Admin | Delete transaction + cascade cleanup (book + user arrays). |
| POST | `/api/transactions/reserve` | 🔑 | **Reservation system**: Checks for duplicates/existing borrows → Creates 7-day reservation hold. |
| DELETE | `/api/transactions/cancel-reservation/:id` | 🔑 | Cancel reservation (owner or admin only). |
| GET | `/api/transactions/my-reservations` | 🔑 | User's active reservations. |
| PUT | `/api/transactions/pay-fine/:id` | 🔑 Staff | Marks fine as collected. Creates notification + activity log. |

### 5.4 User Routes (`routes/users.js`) — 11 endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/getuser/:id` | 🔑 | Get user with populated transactions. |
| GET | `/api/users/allmembers` | 🔑 Staff | All users with their transaction histories. |
| PUT | `/api/users/updateuser/:id` | 🔑 | Self-update or admin-update. **Prevents role escalation** — non-admins cannot change their own role. Auto-hashes password if updated. |
| PUT | `/api/users/change-password` | 🔑 | Verifies current password → hashes new one. |
| PUT | `/api/users/approve/:id` | 🔑 Staff | Activates pending account + sends welcome notification. |
| PUT | `/api/users/suspend/:id` | 🔑 Staff | Suspends account (blocks login). |
| DELETE | `/api/users/deleteuser/:id` | 🔑 Admin | Permanently delete user. |
| POST | `/api/users/upload-photo` | 🔑 | Upload profile photo via Multer. |
| GET | `/api/users/pending` | 🔑 Staff | Lists all pending-approval accounts. |
| POST/DELETE/GET | `/api/users/wishlist` | 🔑 | Add, remove, or view bookmarked books. |

### 5.5 Other Routes

| Route File | Endpoints | Key Features |
|-----------|-----------|-------------|
| `reviews.js` | POST, GET, DELETE | Upsert reviews (one per user per book). Auto-recalculates book's `avgRating` via MongoDB aggregation pipeline. |
| `notifications.js` | GET, PUT (read), PUT (read-all), DELETE | Paginated with unread filter. Ownership enforcement. |
| `activityLog.js` | GET (paginated + filtered), GET stats, GET user logs | Date range filtering, action type filtering, today's count. Role-based access to others' logs. |
| `admin.js` | GET backup, POST restore, GET stats | Full database backup/restore as JSON. System-wide collection statistics. |
| `categories.js` | GET all, POST add, DELETE, GET by ID | CRUD with cascade cleanup on delete (removes from books). |

---

## 6. Frontend — Every Page & Feature

### 6.1 Homepage (`/`) — Public Landing Page
The first thing visitors see before logging in.
- **Hero section** with gradient text and animated call-to-action buttons
- **Feature showcase** — animated cards highlighting key features
- **Statistics counter** — animated number tickers showing library stats
- **Responsive** — works perfectly on mobile, tablet, and desktop
- **"Get Started" and "Login" buttons** to onboard users

### 6.2 Login Page (`/login`)
- **Three demo credential buttons** ("Admin", "Librarian", "Student") — instantly fills the form with test account credentials for quick testing/demos
- **Login by Email, Admission ID, or Employee ID** — three different login methods
- **"Forgot Password?" link** — navigates to the password reset flow
- **Form validation** — real-time error messages with express-validator feedback
- **Animated transitions** — smooth slide-in effects using Framer Motion

### 6.3 Register Page (`/register`)
- **Fields**: Full Name, Email, Mobile Number, Password, Role selection
- **Real-time validation**: Email format, 10-digit phone numbers, 6-character minimum password
- **Role selector with descriptions** — each role shows what permissions it grants
- **Auto-login after registration** — immediately gets JWT tokens

### 6.4 Forgot Password & Reset Password (`/forgot-password`, `/reset-password/:token`)
- **Forgot Password**: Enter email → receives a secure reset link
- **Reset Password**: Click the email link → set new password
- **Security**: Token expires in 1 hour. Hashed storage. Anti-enumeration.

### 6.5 Global Layout (Sidebar + Top Bar)
Always visible on all authenticated pages.

**Sidebar (270px)**:
- **LibraSync Logo** — gradient icon with branding
- **Navigation Menu** — 12 items with role-based visibility:
  - Dashboard, Books, Categories, Calendar — visible to all
  - My Borrows — visible only to members
  - Members, Transactions, Reports, Audit Log — visible only to staff
  - Admin Settings — visible only to admin
- **Active page highlighting** — gradient background on current page
- **Hover effects** — subtle slide animation on hover
- **User info card at bottom** — avatar, name, role badge, logout button
- **Responsive** — collapses to a hamburger menu on mobile

**Top Bar**:
- **Page title** — dynamically shows current page name
- **Notification bell** — red badge with unread count, fetched every 30 seconds
- **Dark/Light mode toggle** — persists choice in localStorage
- **Profile avatar dropdown** — Profile link and Logout

### 6.6 Dashboard (`/dashboard`)
The intelligent home screen that **adapts its content based on user role**.

**For Staff (Admin/Librarian)**:
- **Time-based greeting** — "Good Morning/Afternoon/Evening, [Name]"
- **Quick action buttons** — "Add Book", "Issue Book", "Overdue Alerts" (red, only shows when overdue books exist)
- **4 animated stat cards** — Total Books, Total Members, Active Issues, Overdue Books (each with a gradient icon)
- **Pending reservations counter** — if any exist
- **Monthly trends chart (Area Chart)** — visualizes transaction volume over last 6 months
- **Popular books chart (Pie Chart)** — top 5 most borrowed books
- **Recent transactions table** — last 7 transactions with status chips

**For Members**:
- **Time-based greeting**
- **My active borrows summary**
- **"Recommended For You" section** — horizontally scrollable book cards powered by the collaborative filtering algorithm:
  1. Finds books the user has borrowed
  2. Finds other users who borrowed the same books
  3. Gets books those users borrowed that the current user hasn't
  4. Ranks by frequency and shows top results
  5. Falls back to top-rated books for new users (cold-start handling)

### 6.7 All Books (`/books`)
The full catalog with advanced search and management tools.

- **Search bar** — full-text search across title, author, ISBN, publisher, description
- **Collapsible filter panel** — filter by:
  - Category (dropdown from database)
  - Language
  - Available Only toggle
  - Sort by: Name, Author, Date Added, Rating, Available Count
  - Sort order: Ascending/Descending
- **Grid/List view toggle** — switch between card and table layouts
- **Book cards** — cover image, title, author, rating stars, availability badge, category chips
- **Per-book actions**:
  - **QR Code button** — generates a scannable QR code that links to the book's detail page
  - **Edit button** (staff) — opens edit dialog
  - **Delete button** (admin) — with confirmation dialog
- **Add Book button** (staff) — full form with all fields + "Fetch Cover by ISBN" button that auto-pulls cover images from the Open Library API
- **Bulk Import/Export** (staff):
  - **Export CSV** — downloads entire catalog as a CSV file
  - **Import CSV** — drag-and-drop file upload with template download, validates headers and data, shows import results with error details
- **Server-side pagination** — configurable rows per page (10/25/50)

### 6.8 Book Detail (`/book/:id`) — Public Page
A dedicated page for each book showing full information and reviews.

- **Large cover image** with fallback gradient
- **Book metadata** — title, author, ISBN, publisher, language, description
- **Availability status** — green/red badge with count
- **Category chips** — clickable to view other books in category
- **QR Code section** — shows inline QR code
- **Reserve button** (for members) — disabled if already borrowed or reserved
- **5-Star Review System**:
  - Star rating picker
  - Comment text area
  - Submit review → auto-updates book's `avgRating` via MongoDB aggregation
  - Review list with user avatars, names, dates
  - Delete own review capability

### 6.9 Categories (`/categories`)
Category management with cascading book relationships.

- **Category grid** — cards showing category name and book count
- **Click to view** — navigates to all books in that category
- **Add Category button** (staff)
- **Delete Category button** (admin) — also **removes the category reference from all books** (cascade cleanup)

### 6.10 Category Books (`/categories/:id`)
- Shows all books belonging to a specific category
- Full search and filter within the category
- Back navigation to categories

### 6.11 Members (`/members`) — Staff Only
Complete member lifecycle management.

- **Pending Approvals section** — highlighted cards for new registrations
  - **Approve button** — activates account + sends welcome notification
  - **Reject/Suspend button** — blocks account
- **All Members table** — searchable, paginated
  - Shows: Name, Email, Role, Status (active/pending/suspended), Active Books count
  - **View button** — opens dialog with full profile: age, gender, ID, phone, all transactions
  - **Delete button** (admin only) — with confirmation
- **CSV Export** — download member data
- **Role filter** — filter by admin/librarian/member
- **Status filter** — filter by active/pending/suspended

### 6.12 Transactions (`/transactions`) — Staff Only
The operational heart of the library.

- **Issue Book button** — opens dialog with:
  - Autocomplete book selector (filters only available books)
  - Autocomplete member selector
  - Date picker for due date (minimum: today)
- **Transaction table** — full details of every issue/return/reservation:
  - Book name, Borrower name, Type chip, Issue date, Due date, Status, Fine amount
  - **Return button** — appears for active transactions, changes to red for overdue
  - **Collect Fine button** — appears for completed transactions with unpaid fines
- **Filter bar**:
  - Search by book or borrower name
  - Status filter chips: All, Active, Overdue, Completed
- **CSV Export** — download filtered transactions
- **Pagination** — 10/25/50 rows per page
- **Animated rows** — staggered fade-in effect
- **Color coding** — red background for overdue rows, fine amounts in red

### 6.13 My Borrows (`/my-borrows`) — Members Only
A simplified view of the member's own transactions.

- **Active Borrows** — currently held books with due dates
- **Reservations** — pending reservations with cancel option
- **Past Transactions** — returned books with fine history
- **Overdue warnings** — prominent red alerts for overdue books
- **Fine summary** — total fines owed

### 6.14 Calendar View (`/calendar`)
A visual month-view of library activity.

- **Full monthly calendar grid** — each day is a clickable cell
- **Color-coded dots**:
  - 🟢 Green — books returned that day
  - 🔴 Red — overdue books
  - 🟡 Amber — books due in the future
- **Click on a day** — opens a dialog listing exact transactions for that date
- **Month navigation** — previous/next month buttons
- **Today highlight** — current date has a special border

### 6.15 Reports (`/reports`) — Staff Only
Deep analytics and insights with exportable PDF reports.

- **Summary cards** — Total Books, Members, Transactions, Active, Completed, Return Rate %, Busiest Month
- **Interactive Charts** (Recharts):
  - **Monthly Transaction Trends** (Area Chart) — 12-month view
  - **Category Distribution** (Pie Chart) — books per category
  - **Top 10 Most Borrowed Books** (Bar Chart)
  - **Transaction Status Breakdown** (Donut Chart) — active vs completed vs overdue
  - **Member Growth** (Line Chart) — new registrations over 6 months
- **Fine Statistics** — total collected, average fine, maximum fine, count
- **Download PDF button** — uses `jspdf` + `html2canvas` to capture the entire page as a styled, downloadable PDF document for management reporting

### 6.16 Audit Dashboard (`/audit`) — Staff Only
Security and compliance audit trail.

- **Stats cards** — Total activities, Today's count, Top 2 actions
- **Activity table** — paginated, filterable by action type
  - Each row shows: Action icon + chip, User name, Details (truncated), Time ago (with full timestamp on hover)
  - 19 action types with unique icons and colors
- **Action filter dropdown** — filter by specific action type
- **Refresh button** — manual data reload
- **Pagination** — 10/25/50 rows per page
- **Animated rows** — staggered opacity transition

### 6.17 Notifications (`/notifications`)
In-app notification center.

- **Unread/All toggle** — filter unread only
- **Notification cards** — type icon, title, message, time, read indicator
- **Mark as Read** — click individual notification
- **Mark All as Read** — bulk action button
- **Delete notification** — remove individual notices
- **Real-time updates** — Socket.IO pushes new notifications without page refresh
- **Auto-cleanup** — MongoDB TTL index deletes notifications older than 30 days

### 6.18 Profile (`/profile`)
Comprehensive user profile management.

- **Profile photo upload** — drag-and-drop zone with preview, 5MB limit, JPG/PNG/WebP
- **Edit profile fields** — name, email, phone, age, gender, address
- **Change password** — requires current password verification
- **Digital Library Card** — a beautifully styled card showing:
  - User photo, Name, Role, ID number, QR code
  - **Download as PDF** — generates a professional ID card PDF using `jspdf` + `html2canvas`
- **Transaction history summary** — counts of active, past, and total transactions
- **Wishlist section** — saved books with links

### 6.19 Admin Settings (`/admin/settings`) — Admin Only
System-level configuration and maintenance tools.

- **Database Backup** — exports ALL collections (users, books, transactions, notifications, logs, reviews, categories) as a single JSON file
- **Database Restore** — upload a previous backup JSON to **completely restore** the system to that exact state (drops and recreates collections)
- **System Stats** — live view of all collections with document counts
- **Activity logging** — backup and restore actions are logged to the audit trail

---

## 7. Real-Time Features (Socket.IO)

LibraSync uses WebSocket connections via Socket.IO for instant push notifications:

```
┌──────────┐    ┌──────────────┐    ┌──────────┐
│  Staff   │    │   Server     │    │  Member  │
│ (issues  │───►│ (emits to    │───►│ (receives│
│  a book) │    │  user room)  │    │  instant │
│          │    │              │    │  notif)  │
└──────────┘    └──────────────┘    └──────────┘
```

**How it works**:
1. When a user logs in, the frontend opens a Socket.IO connection and joins a "room" named after their user ID
2. When the server performs an action affecting a specific user (issue, return, fine, approval), it emits an event to that user's room
3. The Layout component listens for these events and updates the notification badge in real-time

**Events emitted**: `notification` with types: `issue`, `return`, `fine_paid`

---

## 8. Automated Background Tasks (Cron Jobs)

### Daily Overdue Check — Runs Every Day at 9:00 AM

The `node-cron` library schedules a background task that runs **automatically** without any user interaction:

```
Every day at 9:00 AM:
  1. Query database for ALL active transactions where toDate < now
  2. For each overdue transaction:
     a. Calculate current fine (days × ₹5/day)
     b. Check if a notification was already sent TODAY (prevents duplicates)
     c. If not, create an in-app notification
     d. If the overdue days hit a milestone (1, 3, 7, 14, or 30 days):
        → Send email reminder to the borrower
  3. Log summary to console
```

**Smart email throttling**: Emails are only sent on days 1, 3, 7, 14, and 30 to avoid spamming users with daily emails.

---

## 9. Email Notification System

### Professional HTML Email Templates
The `emailService.js` module contains a full email template engine with:

- **Responsive HTML layout** — works in Gmail, Outlook, Apple Mail
- **Branded design** — LibraSync logo, gradient headers, dark theme
- **Reusable components**: `wrapTemplate()`, `actionButton()`, `infoCard()`

### Email Types Sent

| Email | Trigger | Content |
|-------|---------|---------|
| **Issue Confirmation** | Book issued to member | Book name, due date, fine warning |
| **Overdue Reminder** | Cron job (days 1, 3, 7, 14, 30) | Book name, days overdue, current fine amount |
| **Fine Receipt** | Book returned with fine | Book name, fine amount charged |
| **Reservation Available** | Reserved book becomes available | Book name, pickup instructions |
| **Password Reset** | User requests reset | Reset link button, 1-hour expiry warning |

### Email Transport
- **Production**: Uses configured SMTP server (Gmail, SendGrid, etc.) via `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
- **Development**: Auto-creates an **Ethereal test account** — all emails are captured at a preview URL (no actual emails sent during development)

---

## 10. Advanced Features That Set LibraSync Apart

### 10.1 Collaborative Filtering Recommendation Engine
Not just "popular books" — a real recommendation algorithm:
1. Finds books user A has borrowed
2. Finds other users who also borrowed those books (similar taste)
3. Finds books THOSE users borrowed that user A hasn't
4. Ranks by frequency (more users = stronger recommendation)
5. Handles cold-start: new users get top-rated books instead

### 10.2 Dynamic Fine Calculation
Fines aren't just stored values — they're **computed in real-time**:
- `calculatedFine` = `(today - dueDate) in days × ₹5/day`
- Shown dynamically in tables (changes daily)
- Persisted only when the book is actually returned

### 10.3 Auto-Token Refresh with Request Queue
When the access token expires during an API call:
1. The failed request is intercepted
2. A refresh request is sent with the httpOnly cookie
3. **All subsequent requests are queued** (not dropped)
4. Once new token is received, ALL queued requests replay automatically
5. The user experiences zero interruption

### 10.4 Book QR Code System
Each book has a dynamically generated QR code that links to its detail page. Libraries can print these QR codes and stick them on physical bookshelves — anyone scanning with their phone instantly sees availability, reviews, and description.

### 10.5 Bulk CSV Import with Error Handling
Staff can import hundreds of books via CSV:
- Headers validated (must include `bookname`, `author`)
- Each row parsed individually — errors are captured per-line
- Uses `insertMany` with `ordered: false` — partial success (valid rows insert even if some fail)
- Returns detailed report: "87 imported, 3 errors on lines 14, 22, 45"

### 10.6 PDF Report & Library Card Generation
- **Reports page**: captures the entire analytics dashboard as a PDF using `html2canvas` → `jspdf`
- **Library Card**: generates a professional digital ID card with photo, QR code, and member details

### 10.7 Full Database Backup & Restore
Admin can export the entire MongoDB database as a JSON file and restore it later — a one-click disaster recovery system.

### 10.8 Progressive Web App (PWA)
LibraSync can be **installed as an app** on any device:
- Works offline (cached pages via Workbox service worker)
- Appears in the app drawer on Android
- Has a custom app manifest with icons and branding
- Runtime caching for API responses and Google Fonts

### 10.9 Comprehensive Audit Trail
Every significant action (19 types) is logged with user ID, name, details, IP address, and timestamp. Auto-cleans after 90 days.

### 10.10 Smart Notification System
- In-app notifications with Socket.IO (instant push)
- Email notifications for important events
- Auto-delete after 30 days (MongoDB TTL)
- Unread badge count in header (polled every 30 seconds + instant via WebSocket)

---

## 11. Security Implementation

| Security Feature | Implementation |
|-----------------|----------------|
| **Password Hashing** | bcrypt with 10 salt rounds |
| **JWT Dual Tokens** | Short-lived access (15m) + httpOnly refresh cookie (30d) |
| **CORS** | Whitelist-only origins |
| **Helmet.js** | Sets 11+ security HTTP headers (CSP, HSTS, etc.) |
| **Rate Limiting** | Auth routes: 15 req/15min. General API: 200 req/15min |
| **Input Validation** | express-validator on all user inputs |
| **Role Authorization** | Server-side middleware + frontend route guards |
| **Anti-Enumeration** | Same response for valid/invalid emails on password reset |
| **Cookie Security** | `httpOnly`, `secure` (production), `sameSite: strict` |
| **Password Exclusion** | `select: false` prevents accidental exposure |
| **Role Escalation Prevention** | Non-admins cannot modify their own role |
| **Ownership Checks** | Users can only modify/delete their own data |

---

## 12. PWA (Progressive Web App) Support

Configured via `vite-plugin-pwa` with Workbox:

- **Auto-update service worker** — new deployments are detected automatically
- **App manifest** — name, icons, theme color, background color, display mode
- **Caching strategies**:
  - Google Fonts → CacheFirst (cached for 1 year)
  - API calls → NetworkFirst with 10s timeout fallback
  - Static assets → precached during build
- **Installable** — shows "Add to Home Screen" prompt on mobile

---

## 13. File Upload & Media Handling

### Multer Configuration
Two separate Multer instances:

| Upload Type | Destination | Max Size | Allowed Types | Naming |
|------------|-------------|----------|---------------|--------|
| Profile Photos | `/uploads/profiles/` | 5 MB | JPG, PNG, WebP | `profile-{userId}-{timestamp}.ext` |
| Book Covers | `/uploads/covers/` | 5 MB | JPG, PNG, WebP | `cover-{bookId}-{timestamp}.ext` |
| CSV Import | Memory (buffer) | Default | Any | In-memory processing |

Files are served statically via `express.static('/uploads')`. The Vite proxy forwards `/uploads` requests to the backend during development.

---

## 14. Complete User Flows

### Flow 1: New Student Registration → First Book Borrow

```
1. Student visits /register
2. Fills form → express-validator validates → bcrypt hashes password
3. Account created with status: "pending"
4. Student tries to login → BLOCKED ("Account pending approval")
5. Librarian logs in → sees pending notification on Dashboard
6. Librarian visits /members → Pending Approvals section
7. Clicks "Approve" → status changes to "active"
8. Socket.IO emits welcome notification to student
9. Student logs in → Dashboard shows "Recommended For You"
10. Student browses /books → uses search/filters → finds a book
11. Student clicks book → opens /book/:id detail page
12. Student clicks "Reserve" → 7-day hold created
13. Librarian sees reservation in Dashboard stats
14. Librarian goes to /transactions → clicks "Issue Book"
15. Selects the book and student → sets due date → clicks Issue
16. Backend: decrements book count, creates transaction,
    updates user arrays, sends email, creates notification,
    emits Socket.IO event, logs to audit trail
17. Student receives email receipt + in-app notification
```

### Flow 2: Overdue Book → Fine Collection

```
1. Book's due date passes
2. Next day at 9:00 AM → cron job detects overdue
3. Cron creates in-app notification for borrower
4. Cron sends email if day 1 (or 3, 7, 14, 30)
5. Librarian visits /transactions → sees red "Overdue" row
6. Fine column dynamically shows growing fine (₹5/day)
7. Student returns book physically to library
8. Librarian clicks "Return" button
9. Fine calculated and persisted (e.g., ₹25 for 5 days)
10. Book count incremented, transaction marked "completed"
11. Fine receipt email sent to student
12. Librarian clicks "Collect Fine" when student pays
13. finePaid = true, notification sent, audit log created
```

### Flow 3: Password Reset

```
1. User clicks "Forgot Password?" on login page
2. Enters email → POST /api/auth/forgot-password
3. Server generates 32-byte random token
4. Token is SHA-256 hashed and saved to user document
5. Raw token sent via email in reset URL
6. User clicks email link → /reset-password/{raw-token}
7. Frontend sends new password + token to backend
8. Backend hashes the token, finds matching user
9. Validates token hasn't expired (< 1 hour)
10. Updates password with new bcrypt hash
11. Clears resetPasswordToken and resetPasswordExpires
12. User redirected to login with success message
```

---

## 15. What Makes LibraSync Advanced vs Other Projects

| Feature | Typical Student Project | LibraSync |
|---------|------------------------|-----------|
| **Authentication** | Single JWT token in localStorage | Dual tokens (access + refresh) with httpOnly cookies |
| **Real-time updates** | Manual page refresh | Socket.IO WebSocket notifications |
| **Background automation** | None | node-cron daily overdue checks + email |
| **Fine calculation** | Static or manual entry | Dynamic real-time computation |
| **Recommendations** | None or random | Collaborative filtering algorithm |
| **Email system** | None | 5 styled HTML email templates via Nodemailer |
| **Security** | Basic password hash | Rate limiting + Helmet + CORS + validator + anti-enumeration |
| **File handling** | None or basic | Multer with type/size validation, CSV bulk import/export |
| **Analytics** | Basic counts | 7 chart types, PDF export, 90-day audit trail |
| **PWA** | Not implemented | Installable app with offline caching |
| **QR Codes** | Not implemented | Dynamic per-book QR codes |
| **Database management** | Manual | One-click backup/restore |
| **Account management** | Auto-approved | Approval workflow with pending state |
| **UI/UX** | Bootstrap/basic | MUI v7 + Framer Motion + dark/light theme |
| **Error handling** | Crashes on error | ErrorBoundary + global error handler + graceful fallbacks |
| **Build optimization** | Default bundle | Manual chunk splitting (vendor, MUI, charts, animation) |

---

## 16. Project Structure

```
Final Year Project/
├── backend/
│   ├── server.js              # Entry point — Express + Socket.IO + MongoDB
│   ├── seed.js                # Database seeder with sample data
│   ├── .env                   # Environment variables
│   ├── middleware/
│   │   ├── verifyToken.js     # JWT verification
│   │   ├── authorizeRoles.js  # Role-based access control
│   │   └── validators.js      # Express-validator rules
│   ├── models/
│   │   ├── User.js            # User schema + virtuals
│   │   ├── Book.js            # Book schema + text index
│   │   ├── BookTransaction.js # Transaction schema + fine calc
│   │   ├── BookCategory.js    # Category with book refs
│   │   ├── Review.js          # Reviews with unique index
│   │   ├── Notification.js    # Notifications with TTL
│   │   └── ActivityLog.js     # Audit trail with TTL
│   ├── routes/
│   │   ├── auth.js            # 6 auth endpoints
│   │   ├── books.js           # 11 book endpoints
│   │   ├── transactions.js    # 12 transaction endpoints
│   │   ├── users.js           # 11 user endpoints
│   │   ├── categories.js      # 4 category endpoints
│   │   ├── reviews.js         # 3 review endpoints
│   │   ├── notifications.js   # 4 notification endpoints
│   │   ├── activityLog.js     # 3 audit endpoints
│   │   └── admin.js           # 3 admin endpoints
│   ├── utils/
│   │   ├── emailService.js    # Email templates + Nodemailer
│   │   └── cronJobs.js        # Daily overdue checker
│   └── uploads/
│       ├── profiles/          # User profile photos
│       └── covers/            # Book cover images
│
├── frontend-part/library-management-system/
│   ├── index.html             # SPA entry point
│   ├── vite.config.js         # Vite + PWA + proxy config
│   ├── src/
│   │   ├── main.jsx           # React root
│   │   ├── App.jsx            # Router + providers
│   │   ├── theme.js           # MUI dark/light themes
│   │   ├── index.css          # Global styles
│   │   ├── api/
│   │   │   └── axios.js       # Axios + auto-refresh + NProgress
│   │   ├── context/
│   │   │   ├── AuthContext.jsx # Auth state + login/logout
│   │   │   └── ThemeContext.jsx# Dark/light mode toggle
│   │   ├── components/
│   │   │   ├── Layout.jsx     # Sidebar + Topbar
│   │   │   ├── ProtectedRoute.jsx # Route guard
│   │   │   ├── ErrorBoundary.jsx  # Error catch
│   │   │   └── AnimatedPage.jsx   # Page transition wrapper
│   │   └── pages/ (19 pages)
│   │       ├── Homepage.jsx       # Public landing
│   │       ├── Login.jsx          # Auth with demo buttons
│   │       ├── Register.jsx       # Registration form
│   │       ├── ForgotPassword.jsx # Email recovery
│   │       ├── ResetPassword.jsx  # Token-based reset
│   │       ├── Dashboard.jsx      # Role-adaptive home
│   │       ├── AllBooks.jsx       # Catalog + search
│   │       ├── BookDetail.jsx     # Book + reviews
│   │       ├── Categories.jsx     # Category management
│   │       ├── CategoryBooks.jsx  # Books by category
│   │       ├── AllMembers.jsx     # Member management
│   │       ├── Transactions.jsx   # Issue/Return engine
│   │       ├── MyBorrows.jsx      # Member's borrows
│   │       ├── Calendar.jsx       # Monthly calendar
│   │       ├── Reports.jsx        # Analytics + PDF
│   │       ├── AuditDashboard.jsx # Audit trail
│   │       ├── Notifications.jsx  # Notification center
│   │       ├── Profile.jsx        # Profile + library card
│   │       └── AdminSettings.jsx  # Backup/restore
│
├── README.md
└── LibraSync_Full_Documentation.md  ← You are here
```

---

## 17. How to Run the Project

### Prerequisites
- **Node.js** v18+ installed
- **MongoDB** running locally (or MongoDB Atlas connection string)

### Step 1: Backend Setup
```bash
cd backend
npm install
# Edit .env with your MongoDB URI and JWT secrets
npm run seed     # Seeds database with sample data
npm run dev      # Starts Express server on port 5000
```

### Step 2: Frontend Setup
```bash
cd frontend-part/library-management-system
npm install
npm run dev      # Starts Vite dev server on port 5173
```

### Step 3: Access the Application
Open `http://localhost:5173` in your browser.

### Demo Login Credentials (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@library.com | admin123 |
| Librarian | librarian@library.com | librarian123 |
| Member | student@library.com | member123 |

### Production Build
```bash
cd frontend-part/library-management-system
npm run build    # Outputs to dist/ folder
```

---

> **📌 This document is the single source of truth for the LibraSync project. It was last updated on March 15, 2026 with all bug fixes and features verified.**
