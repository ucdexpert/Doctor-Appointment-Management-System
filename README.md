# Doctor Appointment Booking System

A full-stack healthcare platform with AI chatbot integration.

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, ShadCN UI
- **Backend:** FastAPI, Python, SQLAlchemy, PostgreSQL
- **Database:** NeonDB (PostgreSQL)
- **AI:** Claude API (Anthropic)
- **Deployment:** Vercel (Frontend), Railway (Backend)

## Features

- 3 role-based dashboards (Patient, Doctor, Admin)
- AI Chatbot for health queries
- Real-time slot booking
- Email notifications
- Mobile responsive

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL database (NeonDB recommended)

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
cp .env.example .env
```

5. Update `.env` with your credentials:
```env
DATABASE_URL=postgresql://user:pass@host:port/dbname
SECRET_KEY=your-secret-key-here
FRONTEND_URL=http://localhost:3000
```

6. Run backend:
```bash
uvicorn main:app --reload
```

Backend will run on http://localhost:8000
API Docs: http://localhost:8000/docs

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Run frontend:
```bash
npm run dev
```

Frontend will run on http://localhost:3000

## Project Structure

```
Doctor-Appointment-Managment-System/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── database.py          # Database connection
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── routes/              # API routes
│   ├── middleware/          # Auth middleware
│   └── utils/               # Helper functions
│
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/          # UI components
│   ├── contexts/            # React contexts
│   ├── lib/                 # API client
│   └── types/               # TypeScript types
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user
- `PUT /auth/change-password` - Change password
- `PUT /auth/profile` - Update profile

### Doctors
- `GET /doctors` - Get all doctors (with filters)
- `GET /doctors/{id}` - Get doctor by ID
- `POST /doctors/profile` - Create doctor profile
- `PUT /doctors/profile` - Update doctor profile

### Appointments
- `POST /appointments` - Book appointment
- `GET /appointments/my` - Get patient appointments
- `GET /appointments/doctor` - Get doctor appointments
- `PUT /appointments/{id}/confirm` - Confirm appointment
- `PUT /appointments/{id}/cancel` - Cancel appointment

## License

MIT License
