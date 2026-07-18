# 🎓 AI Placement Preparation Portal

A full-stack **Node.js + MongoDB** web application for student placement preparation, featuring TCS iON-style exam simulations, placement drive applications, resume building, and an AI career guidance system.

---

## 🚀 Features

### 👨‍🎓 Student Side
- **Register / Login** with secure bcrypt-hashed passwords
- **Aptitude Tests** — TCS iON-style exam console (timer, question navigator, state palette)
- **Technical MCQs** — C, C++, Java, DBMS, OS, Networks and more
- **Leaderboard** — compete and track rankings
- **Placement Drives** — browse companies, eligibility criteria, packages and apply online
- **Resume Builder** — auto-generate a professional PDF resume from profile data
- **Resume Upload** — upload a custom PDF resume
- **AI Career Guidance** — personalized roadmaps for 7+ tech career tracks
- **History** — view all past test scores and performance logs
- **Notifications** — real-time activity alerts (uploads, applications, profile updates)
- **Profile Completion Tracker** — dynamic progress indicator

### 🛠️ Admin Side
- **Super Admin / Sub-Admin role system**
- **Add / Edit / Delete Questions** (Aptitude & Technical)
- **Bulk Import Questions** via Excel (.xlsx / .xls)
- **Exam Settings** — configure exam name and duration per type
- **Company Management** — add / manage placement drives
- **Application Status Updates** — approve/reject with auto-notification
- **Student Management** — view all registrations
- **Export Students** — download student performance data as Excel
- **Admin Analytics Dashboard** — real-time charts and statistics

---

## 🛡️ Security Features
- `helmet` — secure HTTP response headers
- `express-rate-limit` — brute-force protection on auth routes
- Custom NoSQL injection sanitizer (Express 5 compatible)
- `bcrypt` password hashing (10 salt rounds)
- `httpOnly` + `sameSite` session cookies
- Role-based access control (`requireUser`, `requireAdmin`, `requireSuperAdmin`)

---

## 🏗️ Architecture

```
placement-portal/
├── app.js                  # Entry point (~110 lines, clean MVC)
├── config/
│   └── db.js               # MongoDB connection
├── middleware/
│   └── auth.js             # requireUser, requireAdmin, requireSuperAdmin
├── models/                 # Mongoose schemas
│   ├── User.js
│   ├── Admin.js
│   ├── Question.js
│   ├── TechnicalQuestion.js
│   ├── Result.js
│   ├── Company.js
│   ├── Application.js
│   ├── ExamSettings.js
│   └── Notification.js
├── controllers/
│   ├── authController.js
│   ├── studentController.js
│   └── adminController.js
├── routes/
│   ├── authRoutes.js
│   ├── studentRoutes.js
│   └── adminRoutes.js
├── views/                  # HTML pages
├── public/                 # CSS, JS, assets
└── uploads/                # User-uploaded files (gitignored)
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/placement-portal.git
cd placement-portal

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and fill in your MONGODB_URI and SESSION_SECRET

# 4. Start the server
npm start
# Server runs on http://localhost:3000
```

### Create First Super Admin

```bash
node addAdmin.js
```

---

## 🧪 Tech Stack

| Layer | Technology |
|:---|:---|
| **Runtime** | Node.js |
| **Framework** | Express.js v5 |
| **Database** | MongoDB + Mongoose |
| **Auth** | express-session + bcrypt |
| **Security** | Helmet, express-rate-limit |
| **PDF** | PDFKit |
| **Excel** | ExcelJS, XLSX |
| **Frontend** | Vanilla HTML, CSS, JavaScript |

---

## 📄 License

MIT © 2026
