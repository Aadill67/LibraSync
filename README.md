# 📚 LibraSync — Library Management System

A production-ready, full-stack Library Management System built with the **MERN** stack (MongoDB, Express.js, React, Node.js). Features real-time notifications, role-based access, dual themes, analytics dashboards, QR codes, email alerts, book reservations, and 13+ advanced features.

---

## 🛠 Tech Stack

| Layer          | Technology                                                                   |
| -------------- | ---------------------------------------------------------------------------- |
| **Frontend**   | React 19, Material-UI (MUI) 7, Recharts, Framer Motion, Vite 7             |
| **Backend**    | Node.js, Express.js, Mongoose, Socket.IO, Nodemailer, node-cron            |
| **Database**   | MongoDB (local or Atlas)                                                     |
| **Auth**       | JWT (JSON Web Tokens), bcrypt                                                |
| **PDF/QR**     | jsPDF, html2canvas, qrcode (server), qrcode.react (client)                 |

---

## ✨ Features

### Core Functionality
- **Book Management** — Add, edit, delete, and search books with category tagging, cover image URLs, and ISBN support.
- **Member Management** — Register members, search/filter, pagination, and CSV export.
- **Transaction System** — Issue & return books, automatic fine calculation (₹ per day overdue), overdue tracking.
- **Category System** — Organize books into color-coded categories with browseable pages.

### Advanced Features
- **🔔 Real-Time Notifications** — Socket.IO-powered in-app notification bell with unread badge; full notifications page with mark-read and delete.
- **📧 Email Notifications** — Automated overdue reminders, issue confirmations, and fine receipts via Nodemailer (Ethereal fallback for dev).
- **⏰ Cron Jobs** — Daily 9 AM overdue check that sends automated email + in-app alerts.
- **⭐ Book Ratings & Reviews** — Members can rate (1–5 stars) and review books they've borrowed; average ratings displayed throughout the app.
- **📱 QR Code System** — Generate scannable QR codes for any book; public book detail page accessible without login.
- **📋 Book Reservations** — Reserve unavailable books; manage reservations from "My Borrows"; automatic queue system.
- **📊 Reports & Analytics** — Monthly trends, top books, category distribution, member growth, fine summaries, with PDF and CSV export.
- **📅 Calendar View** — Monthly calendar showing due dates (amber), return dates (green), and overdue items (red).
- **🔍 Advanced Search & Filters** — Full-text search with category, author, availability, language, and sort filters; debounced search with pagination.
- **📸 Profile Photo Upload** — Photo upload with preview; profile photos displayed in sidebar, header, and member lists.
- **🪪 Digital Library Card** — Downloadable PDF library card with QR code, member photo, and membership details.
- **📥 Bulk Import/Export** — CSV import for batch book addition; CSV/catalog export for the entire library.
- **🔐 Role-Based Access Control** — Three roles (`admin`, `librarian`, `member`) with scoped navigation and API-level permissions.
- **🌗 Dark / Light Mode** — Theme toggle with `localStorage` persistence and carefully curated palettes.
- **🔑 Forgot Password** — Password recovery page linked from the login screen.
- **📈 Dashboard** — Welcome banner, stat cards, area/pie charts, overdue alerts, recent transactions, and personalized book recommendations.
- **🔎 Audit Dashboard** — Activity log with stats cards, filterable activity table, and paginated timeline (admin/staff only).
- **⚙️ Admin Settings** — Database backup/restore, system stats, and confirmation dialogs (admin only).
- **💡 Book Recommendations** — Collaborative filtering that suggests books based on borrowing patterns; horizontal scroll cards on Dashboard.

### UI / UX
- Animated page transitions (Framer Motion)
- Responsive layout for mobile and desktop
- Gradient stat cards, glassmorphic design
- Premium typography (Inter font family), curated color palettes
- Scrolling book marquee on public landing page
- Animated stats counters

---

## 📂 Folder Structure

```
Final Year Project/
├── backend/
│   ├── middleware/       # verifyToken, authorizeRoles
│   ├── models/           # User, Book, BookCategory, BookTransaction,
│   │                     # Notification, Review, ActivityLog
│   ├── routes/           # auth, books, categories, transactions,
│   │                     # users, notifications, reviews, activityLog, admin
│   ├── utils/            # emailService, cronJobs
│   ├── uploads/          # Profile photos & imported files
│   ├── server.js         # Express + Socket.IO entry-point
│   ├── seed.js           # Database seeder
│   └── .env              # Environment configuration
│
└── frontend-part/library-management-system/
    └── src/
        ├── api/           # Axios instance with JWT interceptors
        ├── components/    # Layout, ProtectedRoute, AnimatedPage
        ├── context/       # AuthContext, ThemeContext
        ├── hooks/         # useDebounce
        ├── pages/         # Dashboard, AllBooks, AllMembers, Transactions,
        │                  # Categories, CategoryBooks, MyBorrows, Reports,
        │                  # Profile, Login, Register, ForgotPassword,
        │                  # Homepage, Notifications, BookDetail, Calendar,
        │                  # AuditDashboard, AdminSettings
        ├── theme.js       # Dark & Light MUI themes
        ├── App.jsx        # Router setup with role-based routes
        └── main.jsx       # React root with ThemeProvider
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** (local instance or Atlas connection string)

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend-part/library-management-system
npm install
```

### 2. Configure Environment

Create `backend/.env`:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/library_db

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Server
PORT=5000

# Email (optional — falls back to Ethereal test account)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Seed the Database (optional)

```bash
cd backend
node seed.js
```

### 4. Run the App

```bash
# Terminal 1 — Backend
cd backend
npm run dev      # or: npm start

# Terminal 2 — Frontend
cd frontend-part/library-management-system
npm run dev      # runs on http://localhost:5173
```

---

## 🔑 Default Login Credentials

| Role       | Email                    | Password    |
| ---------- | ------------------------ | ----------- |
| Admin      | admin@librasync.com      | admin123    |
| Librarian  | librarian@librasync.com  | lib123      |
| Member     | member@librasync.com     | member123   |

> *Credentials may differ if you modified `seed.js`.*

---

## 📜 API Endpoints

### Authentication
| Method | Route                       | Auth   | Description              |
| ------ | --------------------------- | ------ | ------------------------ |
| POST   | `/api/auth/register`        | —      | Register new user        |
| POST   | `/api/auth/signin`          | —      | Login, returns JWT       |

### Books
| Method | Route                       | Auth   | Description                        |
| ------ | --------------------------- | ------ | ---------------------------------- |
| GET    | `/api/books`                | Token  | List books (search, filter, page)  |
| POST   | `/api/books/add`            | Staff  | Add a new book                     |
| PUT    | `/api/books/edit/:id`       | Staff  | Edit a book                        |
| DELETE | `/api/books/delete/:id`     | Staff  | Delete a book                      |
| GET    | `/api/books/qr/:id`         | Token  | Generate QR code for a book        |
| GET    | `/api/books/recommendations`| Token  | Get personalized recommendations   |
| POST   | `/api/books/import`         | Staff  | Bulk import books via CSV          |
| GET    | `/api/books/export`         | Staff  | Export catalog as CSV              |

### Categories
| Method | Route                       | Auth   | Description              |
| ------ | --------------------------- | ------ | ------------------------ |
| GET    | `/api/categories`           | Token  | List all categories      |
| GET    | `/api/categories/:id/books` | Token  | Books in a category      |
| POST   | `/api/categories`           | Staff  | Create a category        |
| DELETE | `/api/categories/:id`       | Staff  | Delete a category        |

### Transactions
| Method | Route                                      | Auth   | Description              |
| ------ | ------------------------------------------ | ------ | ------------------------ |
| GET    | `/api/transactions/all-transactions`       | Token  | All user's transactions  |
| POST   | `/api/transactions/add`                    | Staff  | Issue a book             |
| PUT    | `/api/transactions/return/:id`             | Staff  | Return a book            |
| POST   | `/api/transactions/reserve`                | Token  | Reserve a book           |
| DELETE | `/api/transactions/cancel-reservation/:id` | Token  | Cancel reservation       |
| GET    | `/api/transactions/stats`                  | Staff  | Dashboard statistics     |
| GET    | `/api/transactions/overdue`                | Staff  | Overdue books list       |
| GET    | `/api/transactions/reports`                | Staff  | Analytics aggregation    |

### Users
| Method | Route                        | Auth   | Description              |
| ------ | ---------------------------- | ------ | ------------------------ |
| GET    | `/api/users`                 | Staff  | List all members         |
| PUT    | `/api/users/profile`         | Token  | Update profile           |
| POST   | `/api/users/upload-photo`    | Token  | Upload profile photo     |

### Notifications
| Method | Route                              | Auth   | Description              |
| ------ | ---------------------------------- | ------ | ------------------------ |
| GET    | `/api/notifications`               | Token  | User's notifications     |
| PUT    | `/api/notifications/read/:id`      | Token  | Mark one as read         |
| PUT    | `/api/notifications/read-all`      | Token  | Mark all as read         |
| DELETE | `/api/notifications/:id`           | Token  | Delete a notification    |

### Reviews
| Method | Route                        | Auth   | Description              |
| ------ | ---------------------------- | ------ | ------------------------ |
| POST   | `/api/reviews`               | Token  | Add/update a review      |
| GET    | `/api/reviews/book/:bookId`  | Token  | Reviews for a book       |
| DELETE | `/api/reviews/:id`           | Token  | Delete a review          |

### Activity Log & Admin
| Method | Route                        | Auth   | Description              |
| ------ | ---------------------------- | ------ | ------------------------ |
| GET    | `/api/activity-log`          | Staff  | Paginated activity logs  |
| GET    | `/api/activity-log/stats`    | Staff  | Activity statistics      |
| GET    | `/api/admin/backup`          | Admin  | Download DB backup       |
| POST   | `/api/admin/restore`         | Admin  | Restore from backup      |
| GET    | `/api/admin/stats`           | Admin  | System statistics        |

---

## 🏗 Architecture

```
Client (React + Vite)
  ↕ Axios (JWT in headers)
Express.js API Server
  ↕ Mongoose ODM
MongoDB Database

Socket.IO (real-time notifications)
node-cron (scheduled tasks)
Nodemailer (email alerts)
```

---

## 📝 License

This project was built as a **Final Year Project**. Feel free to use and extend it for educational purposes.
