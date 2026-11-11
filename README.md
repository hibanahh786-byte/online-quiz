# Online Quiz System - Full-Stack Web Application

A professional, modern, responsive Full-Stack Online Quiz System built with Node.js, Express.js, MongoDB, Mongoose, and a clean Bootstrap 5 academic dashboard design system.

---

## 🌟 Key Features

### 🎓 1. Public & Student Portal
- **Modern Landing Page**: Dynamic hero section, platform statistics, featured quiz categories with real-time question counts, "How It Works" guide, and educational benefits.
- **Authentication & Security**:
  - Secure registration with client and server input validation, duplicate email verification, and bcrypt password hashing.
  - JWT token-based authentication with expiration handling.
  - Rate limiting on authentication routes to prevent brute-force attacks.
  - Quick-fill buttons on the login page for instantaneous demo access (Student & Admin).
- **Interactive Quiz Interface**:
  - Live countdown timer with red pulse warning at < 60 seconds remaining.
  - Question Palette navigation grid (real-time answered / unanswered tallies).
  - Next / Previous buttons and one-click selection clearing.
  - **Zero answer leaks**: Answer keys and explanations are stripped on the server and never sent to the client during active tests.
  - Automatic test submission when the timer reaches zero.
- **Instant Objective Assessment**:
  - Backend score and percentage computation.
  - Comprehensive question-by-question review screen displaying user's choices, correct answers, and detailed technical explanations.
  - Options to retake quizzes or jump to the leaderboard.
- **Student Dashboard & Profile**:
  - Personal metrics: quizzes attempted, questions answered, average score, and personal best.
  - Interactive Chart.js trend line visualizing score progression over time.
  - Profile customization: update full name, verified email, phone number, password, and avatar photo upload.
- **Quiz History**:
  - Searchable log of past test attempts with marks, percentages, date/time, and one-click access to detailed reviews.
- **Global Academic Leaderboard**:
  - Top 3 Podium Cards (1st Gold, 2nd Silver, 3rd Bronze).
  - Timeframe filters: All-Time, Weekly (last 7 days), and Monthly (last 30 days).
  - Full standings table with avatars, total points, and average accuracy.

---

### 🛡️ 2. Administrative Console
- **Admin Dashboard**:
  - Key statistics: Registered Users, Total Categories, Total Questions, Quizzes Attempted, and Platform Average Score.
  - Chart.js User Registrations Trend Bar Chart.
  - Chart.js Quiz Participation Doughnut Chart by Subject.
  - Recent user signups and recent submission activity feeds.
- **Category Management**:
  - Create, view, update, and toggle active/inactive status of categories.
  - **Data Safety Guard**: Safeguards against accidental deletion if a category contains questions or student attempt histories. Offers confirmation dialogs and force-delete options.
- **Question Bank Management**:
  - Add and edit questions with 4 multiple-choice options (A, B, C, D), correct answer selection, custom marks, difficulty level, and in-depth explanation notes.
  - Search question prompts and filter dynamically by Category and Difficulty.
  - Full server-side pagination.
- **User Management**:
  - Searchable user directory with role badges, joined dates, and quiz counts.
  - Instant toggle to activate or deactivate student accounts.
  - Inspect individual student profiles and review their past test history.
  - Account deletion with cascading history cleanup.
- **Results Management**:
  - Real-time audit log of all student submissions.
  - Filter submissions by student name/email, category, or date range.
  - Detailed modal inspection of student answers vs correct answers.
  - **CSV Export**: One-click export of platform results to CSV format.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons, Chart.js |
| **Backend** | Node.js, Express.js, REST API Architecture |
| **Database** | MongoDB, Mongoose ODM |
| **Security** | JWT (JSON Web Tokens), bcrypt.js, Helmet, CORS, Express Rate Limit |
| **Utilities** | Multer (image uploads), json2csv (data export), mongodb-memory-server (embedded zero-config fallback) |

---

## 📂 Project Structure

```
online-quiz-system/
├── frontend/
│   ├── index.html                  # Landing Page
│   ├── login.html                  # Student & Admin Login
│   ├── register.html               # Student Registration
│   ├── dashboard.html              # Student Dashboard & Analytics
│   ├── categories.html             # Browse Categories & Instructions
│   ├── quiz.html                   # Timed Interactive Quiz Interface
│   ├── result.html                 # Scorecard & Explanation Review
│   ├── history.html                # Past Quiz Attempts Table
│   ├── leaderboard.html            # Top 3 Podium & Global Rankings
│   ├── profile.html                # Profile & Password Settings
│   ├── admin/
│   │   ├── dashboard.html          # Admin Overview & Charts
│   │   ├── categories.html         # Category CRUD & Status Toggles
│   │   ├── questions.html          # Question Bank CRUD & Filters
│   │   ├── users.html              # User Management & Status
│   │   └── results.html            # Results Log & CSV Export
│   ├── css/
│   │   └── style.css               # Global Academic Design System
│   ├── js/
│   │   ├── api.js                  # Central API client & Utilities
│   │   ├── navbar.js               # Dynamic Header & Auth Navigation
│   │   ├── home.js                 # Landing Page Logic
│   │   ├── auth.js                 # Login & Register Handler
│   │   ├── dashboard.js            # Dashboard Stats & Chart.js
│   │   ├── categories.js           # Categories & Modal Handler
│   │   ├── quiz.js                 # Timer & Quiz Taking Engine
│   │   ├── result.js               # Assessment Evaluation & Review
│   │   ├── history.js              # History Table Handler
│   │   ├── leaderboard.js          # Standings & Filter Logic
│   │   ├── profile.js              # Profile & Photo Uploads
│   │   └── admin/
│   │       ├── admin-dashboard.js  # Analytics & Charts
│   │       ├── admin-categories.js # Category Management
│   │       ├── admin-questions.js  # Question Bank Management
│   │       ├── admin-users.js      # User Administration
│   │       └── admin-results.js    # Results & CSV Export
│   └── assets/                     # Icons & Assets
│
├── backend/
│   ├── config/
│   │   └── db.js                   # Mongoose Connection & Embedded Fallback
│   ├── controllers/                # Business Logic
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── leaderboardController.js
│   │   ├── profileController.js
│   │   ├── questionController.js
│   │   ├── quizController.js
│   │   └── resultController.js
│   ├── middleware/                 # JWT Auth, Multer, Error Handlers
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── upload.js
│   ├── models/                     # Mongoose Schemas
│   │   ├── Category.js
│   │   ├── Question.js
│   │   ├── Result.js
│   │   └── User.js
│   ├── routes/                     # REST Endpoints
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── leaderboardRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── questionRoutes.js
│   │   ├── quizRoutes.js
│   │   └── resultRoutes.js
│   ├── services/
│   ├── utils/
│   │   └── seeder.js               # Initial Data, Questions & Admin Seeder
│   └── server.js                   # Express Server Entry Point
│
├── .env                            # Environment Variables
├── .env.example                    # Example Environment Configuration
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- MongoDB running locally on port 27017 or a MongoDB Atlas URI *(Note: If MongoDB is not active locally, the system automatically runs an embedded MongoDB instance seamlessly!)*

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` (or configure as desired):
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/online_quiz_db
JWT_SECRET=super_secure_quiz_jwt_secret_key_2026_mca_project
JWT_EXPIRE=7d
NODE_ENV=development
```

### 4. Seed Database (Optional - Happens Automatically on 1st Run)
To seed or reset sample categories, questions, demo users, and demo results:
```bash
npm run seed
```

### 5. Start the Web Application
```bash
npm start
```
The application will launch at:
- **Web App**: `http://localhost:3000`
- **API Health**: `http://localhost:3000/api/health`

---

## 🔑 Default Login Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Administrator** | `admin@quizsystem.com` | `AdminPassword123!` | Complete Admin Panel, Categories, Questions, Users, Results |
| **Demo Student** | `john@example.com` | `UserPassword123!` | Student Dashboard, Taking Quizzes, History, Leaderboard, Profile |

*(You can also click the "Demo Student" or "Admin Portal" buttons directly on `/login.html` to instantly autofill these credentials!)*

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` - Create student account
- `POST /api/auth/login` - Authenticate user & get JWT token
- `GET /api/auth/me` - Get current session user

### Profile
- `GET /api/profile` - Get user profile & quiz stats
- `PUT /api/profile` - Update name, email, phone & avatar photo
- `PUT /api/profile/change-password` - Change account password

### Categories
- `GET /api/categories` - List active categories with question counts
- `GET /api/categories/:id` - Get category details
- `POST /api/categories` - Create category *(Admin)*
- `PUT /api/categories/:id` - Update category *(Admin)*
- `DELETE /api/categories/:id` - Delete category *(Admin with safety checks)*

### Questions
- `GET /api/questions` - List questions with search & filters *(Admin)*
- `GET /api/questions/:id` - Get question by ID *(Admin)*
- `POST /api/questions` - Create question with 4 options & answer key *(Admin)*
- `PUT /api/questions/:id` - Update question *(Admin)*
- `DELETE /api/questions/:id` - Delete question *(Admin)*

### Quiz Engine
- `POST /api/quiz/start` - Fetch questions for category *(Hides correct answers & explanations)*
- `POST /api/quiz/submit` - Securely evaluate answers on server, record score & return explanations
- `GET /api/quiz/history` - Get user's quiz attempt history
- `GET /api/quiz/history/:id` - Get specific quiz result breakdown with answer keys

### Leaderboard
- `GET /api/leaderboard` - Overall all-time top learners & rankings
- `GET /api/leaderboard/weekly` - Top rankings for past 7 days
- `GET /api/leaderboard/monthly` - Top rankings for past 30 days

### Admin Console
- `GET /api/admin/dashboard` - Platform statistics & Chart.js data
- `GET /api/admin/users` - Search & paginate registered users
- `PUT /api/admin/users/:id/status` - Activate or deactivate user
- `DELETE /api/admin/users/:id` - Delete user & their quiz history
- `GET /api/admin/results` - Filter & paginate all quiz submissions
- `GET /api/admin/results/export` - Download all quiz submissions as CSV
- `GET /api/admin/analytics` - Category difficulty & performance breakdown

---

## 🔒 Security Architecture
1. **Zero Client-Side Answer Leakage**: During the active quiz, correct answers and explanation text are completely stripped on the server. Answer checking is performed 100% server-side upon submission.
2. **Password Cryptography**: Passwords are salted and hashed using bcrypt (10 rounds) before persistence.
3. **Role-Based Access Control (RBAC)**: All administrative endpoints and interfaces verify JWT validity and require an `admin` role claim.
4. **Rate Limiting**: Auth endpoints throttle brute force attempts to 30 requests per 15 minutes per IP.
5. **Data Integrity Protections**: Deleting a category with active questions or test history is blocked by default to prevent orphan records.
