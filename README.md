# 🏥 MediConnect - AI Doctor Appointment System

> A full-stack healthcare platform where patients can book doctor appointments online, doctors can manage their schedules, and admins can oversee the entire system. Powered by AI chatbot for health assistance.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green?style=for-the-badge&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=for-the-badge&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---

##  Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Live Demo](#-live-demo)
- [Screenshots](#-screenshots)
- [Local Setup](#-local-setup)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 👨‍⚕️ For Patients
- 🔍 **Smart Doctor Search** — Find doctors by name, specialization, or city
- 🎯 **Advanced Filters** — Filter by fee range, availability, ratings, and sort options
- 📅 **Easy Booking** — Book appointments in just a few clicks with time slot picker
- 💬 **AI Health Assistant** — Get health advice and doctor recommendations 24/7 (powered by Groq AI)
- ⭐ **Reviews & Ratings** — Rate your doctor after completed appointments
- 📋 **Appointment History** — Track all upcoming, past, and cancelled bookings
- 📷 **Profile Photo Upload** — Upload and manage profile pictures
- 🔒 **Secure Authentication** — JWT-based auth with password change

### 🩺 For Doctors
- 📊 **Dashboard** — View today's appointments and patient statistics
- 🗓️ **Schedule Management** — Set weekly availability and time slot durations (15/30/60 min)
- ✅ **Appointment Control** — Confirm, cancel, or complete appointments
- 📝 **Prescription Notes** — Add medical notes and advice for patients
- ⭐ **Rating System** — Build your reputation with patient reviews
- 👤 **Profile Management** — Manage specialization, qualification, fees, and bio
- ✉️ **Email Notifications** — Receive notifications for new bookings and cancellations

### 🔧 For Admins
- 👥 **User Management** — View, search, and manage all users (patients, doctors, admins)
- ✅ **Doctor Approval** — Approve or reject doctor registrations with email notifications
- 🚫 **Ban/Unban Users** — Moderate the platform and enforce policies
- 📈 **Analytics Dashboard** — Platform statistics, popular specializations, and recent registrations
- 📊 **Charts & Insights** — Visual data representation using Recharts

### 🤖 AI Chatbot
- 💡 **Symptom Analysis** — Get doctor recommendations based on described symptoms
- 🏥 **Health Guidance** — General health tips and advice in Urdu or English
- 📞 **24/7 Available** — Always online to help with health queries
- 💾 **Chat History** — Resume conversations anytime with saved sessions
- 🧠 **Powered by Groq** — Fast AI responses using Llama 3.1 8B model

---

## 🛠️ Tech Stack
### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org/) | 14.2.5 | React framework with App Router |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type-safe development |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4 | Utility-first styling |
| [ShadCN UI](https://ui.shadcn.com/) | Latest | Beautiful component library |
| [Recharts](https://recharts.org/) | Latest | Charts for admin dashboard |
| [Axios](https://axios-http.com/) | 1.6 | HTTP client for API calls |
| [Sonner](https://sonner.emilkowal.ski/) | Latest | Toast notifications |
| [Lucide React](https://lucide.dev/) | Latest | Icon library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| [FastAPI](https://fastapi.tiangolo.com/) | 0.109 | High-performance REST API |
| [SQLAlchemy](https://www.sqlalchemy.org/) | 2.0 | Database ORM |
| [PostgreSQL](https://www.postgresql.org/) | 16 | Relational database |
| [Pydantic](https://docs.pydantic.dev/) | 2.10 | Data validation |
| [python-jose](https://python-jose.readthedocs.io/) | 3.3 | JWT authentication |
| [bcrypt](https://pypi.org/project/bcrypt/) | 4.0 | Password hashing |
| [Groq](https://groq.com/) | Latest | AI chatbot (Llama 3.1) |
| [Resend](https://resend.com/) | Latest | Email notifications |

### DevOps
| Service | Purpose |
|---------|---------|
| [Vercel](https://vercel.com/) | Frontend hosting |
| [Railway](https://railway.app/) | Backend hosting |
| [NeonDB](https://neon.tech/) | Cloud PostgreSQL database |

---

## 🌐 Live Demo

> **Coming Soon!** Deployment links will be added here.

- **Frontend:** [https://mediconnect.vercel.app](https://mediconnect.vercel.app) *(placeholder)*
- **Backend API:** [https://mediconnect-backend.railway.app](https://mediconnect-backend.railway.app) *(placeholder)*
- **API Docs:** [https://mediconnect-backend.railway.app/docs](https://mediconnect-backend.railway.app/docs) *(placeholder)*

### Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Patient | *(Register new account)* | *(Your choice)* |
| Doctor | *(Register new account)* | *(Your choice)* |

---

## 📸 Screenshots

### Landing Page
> Clean, modern landing page with hero section and call-to-action

### Patient Dashboard
> Find doctors, book appointments, view appointment history, and chat with AI assistant

### Doctor Profile & Booking
> Detailed doctor profiles with ratings, reviews, and easy appointment booking with time slot picker

### Appointments Management
> View, filter, and manage appointments with status badges and action buttons

### AI Chatbot
> Chat with AI health assistant for symptom analysis and health guidance

### Doctor Dashboard
> Manage schedule, view appointments, and track patient statistics

### Admin Dashboard
> Approve doctors, manage users, and view platform analytics with charts

---

## 🚀 Local Setup

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** database (or [NeonDB](https://neon.tech/) account for cloud)

### Step 1: Clone the Repository
```bash
git clone https://github.com/ucdexpert/Doctor-Appointment-Managment-System.git
cd Doctor-Appointment-Managment-System
```

### Step 2: Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env with your configuration (see Environment Variables section)
nano .env  # or use any text editor
```

### Step 3: Frontend Setup
```bash
# Navigate to frontend (open new terminal)
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local
# For local development:
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 4: Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
uvicorn main:app --reload
```
Backend runs on: http://localhost:8000
API Docs: http://localhost:8000/docs

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:3000

### Step 5: Access the Application
- Open http://localhost:3000 in your browser
- Register a new account or use admin credentials
- Start exploring the features!

---

## 🔑 Environment Variables

### Frontend (.env.local)
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

### Backend (.env)
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | `postgresql://user:pass@host:5432/db` |
| `SECRET_KEY` | JWT signing key (min 32 chars) | ✅ | `your-secret-key-change-this` |
| `TOKEN_EXPIRE_HOURS` | JWT token expiry in hours | ❌ | `24` |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ | `http://localhost:3000` |
| `GROQ_API_KEY` | Groq AI API key | ❌ | `gsk_your_key` |
| `GROQ_MODEL` | Groq model to use | ❌ | `llama-3.1-8b-instant` |
| `RESEND_API_KEY` | Resend email API key | ❌ | `re_your_key` |
| `FROM_EMAIL` | Verified sender email | ❌ | `appointments@yourdomain.com` |
| `UPLOAD_DIR` | Upload directory path | ❌ | `uploads` |

> **Note:** Variables marked ❌ are optional. The app works without them but features like AI chatbot and email notifications will be disabled.

---

## 📡 API Documentation

Once the backend is running, access the interactive API documentation at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

#### Authentication
```
POST   /auth/register        → Register new user
POST   /auth/login           → Login
GET    /auth/me              → Get current user
PUT    /auth/change-password → Change password
PUT    /auth/profile         → Update profile
```

#### Doctors
```
GET    /doctors              → List doctors (with filters)
GET    /doctors/{id}         → Get doctor details
POST   /doctors/profile      → Create doctor profile
PUT    /doctors/profile      → Update doctor profile
GET    /doctors/{id}/slots   → Get available time slots
```

#### Appointments
```
POST   /appointments                    → Book appointment
GET    /appointments/my                 → Patient's appointments
GET    /appointments/doctor             → Doctor's appointments
PUT    /appointments/{id}/confirm       → Confirm appointment
PUT    /appointments/{id}/cancel        → Cancel appointment
PUT    /appointments/{id}/complete      → Mark as completed
PUT    /appointments/{id}/notes         → Add prescription notes
```

#### Reviews
```
POST   /reviews                → Submit review
GET    /reviews/doctor/{id}    → Get doctor reviews
```

#### Chatbot
```
POST   /chat/session           → Create chat session
POST   /chat/message           → Send message
GET    /chat/sessions          → List sessions
GET    /chat/sessions/{id}     → Get session messages
DELETE /chat/sessions/{id}     → Delete session
```

#### Admin
```
GET    /admin/doctors/pending      → Pending doctor approvals
PUT    /admin/doctors/{id}/approve → Approve doctor
PUT    /admin/doctors/{id}/reject  → Reject doctor
GET    /admin/users                → List all users
PUT    /admin/users/{id}/ban       → Ban user
GET    /admin/stats                → Dashboard statistics
```

---

## 🚀 Deployment

### Deploy Frontend to Vercel
1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com/)
3. Set environment variable:
   - `NEXT_PUBLIC_API_URL` = Your Railway backend URL
4. Deploy!

### Deploy Backend to Railway
1. Create [Railway](https://railway.app/) account
2. Connect GitHub repository
3. Add PostgreSQL database service
4. Set environment variables:
   - `DATABASE_URL` (auto from Railway)
   - `SECRET_KEY`
   - `FRONTEND_URL` = Your Vercel URL
   - `GROQ_API_KEY`
   - `RESEND_API_KEY`
5. Deploy!

### Environment Variables for Production

**Frontend (Vercel):**
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

**Backend (Railway):**
```env
DATABASE_URL=postgresql://...         # Auto from Railway
SECRET_KEY=your-secret-key-here
FRONTEND_URL=https://your-frontend.vercel.app
GROQ_API_KEY=gsk_your-key
RESEND_API_KEY=re_your-key
FROM_EMAIL=appointments@yourdomain.com
TOKEN_EXPIRE_HOURS=24
GROQ_MODEL=llama-3.1-8b-instant
UPLOAD_DIR=uploads
```

---

## 📁 Project Structure

```
Doctor-Appointment-Managment-System/
├── frontend/                   # Next.js application
│   ├── app/                    # Pages (App Router)
│   │   ├── patient/           # Patient dashboard pages
│   │   ├── doctor/            # Doctor dashboard pages
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── login/
│   │   └── register/
│   ├── components/             # React components
│   │   ├── ui/                # ShadCN base components
│   │   ├── layout/            # Navbar, Sidebar, Footer, DashboardLayout
│   │   ├── doctor/            # DoctorCard, DoctorFilter, StarRating
│   │   ├── appointment/       # AppointmentCard, TimeSlotPicker, StatusBadge
│   │   ├── chatbot/           # ChatWindow, ChatMessage, ChatInput
│   │   └── shared/            # LoadingSpinner, EmptyState, ConfirmDialog
│   ├── contexts/               # React contexts (Auth)
│   ├── hooks/                  # Custom hooks (useAppointments)
│   ├── lib/                    # Utilities (API, Auth)
│   └── types/                  # TypeScript interfaces
│
├── backend/                    # FastAPI application
│   ├── models/                 # SQLAlchemy database models
│   ├── schemas/                # Pydantic request/response schemas
│   ├── routes/                 # API endpoint routers
│   ├── middleware/             # Auth middleware
│   ├── utils/                  # Utilities (JWT, Email, Chatbot)
│   ├── uploads/                # Uploaded profile photos
│   ├── main.py                 # App entry point
│   ├── database.py             # Database connection
│   ├── requirements.txt        # Python dependencies
│   ├── Procfile                # Railway deployment
│   └── railway.json            # Railway configuration
│
├── README.md                   # This file
└── QWEN.md                     # AI assistant context
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Contact

**Muhammad Uzair**
- GitHub: [@ucdexpert](https://github.com/ucdexpert)
- Project: [Doctor-Appointment-Managment-System](https://github.com/ucdexpert/Doctor-Appointment-Managment-System)

---

## 📄 License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2025 Muhammad Uzair

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software.
```

---

**Made with ❤️ for better healthcare access in Pakistan**

*AI-powered healthcare platform connecting patients with doctors*
