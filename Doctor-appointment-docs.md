# Doctor Appointment Booking System + AI Chatbot
## Complete Project Documentation
**Developer:** Muhammad Uzair  
**Stack:** Next.js · TypeScript · FastAPI · PostgreSQL · LLM API  
**GitHub:** github.com/ucdexpert

---

# TABLE OF CONTENTS

1. Project Overview
2. Features (Patient, Doctor, Admin, Chatbot)
3. Tech Stack
4. Database Design
5. Folder Structure
6. API Endpoints
7. Page List (Frontend)
8. AI Chatbot — Full Details
9. Mobile Responsive Guide
10. Email Notifications
11. Week-by-Week Plan
12. Setup Guide (Day 1)
13. Deployment
14. CV Points + Checklist

---

# 1. PROJECT OVERVIEW

Yeh ek full-stack Doctor Appointment Booking System hai jisme:
- Patients online doctor dhundh kar appointment book kar saktay hain
- Doctors apna schedule manage kar saktay hain
- Admin poore platform ko control karta hai
- Built-in AI Chatbot hai jo patients ke sawaalon ka jawab deta hai

**Target Market:** Pakistan ki local clinics, hospitals, aur health startups (Marham, Oladoc jaise)

**Why this project for CV:**
- 3 role-based dashboards (rare for freshers)
- AI chatbot integration (hot skill in 2025)
- Real-world use case, easily explainable in interview
- Pakistan-specific features (local health market)

---

# 2. FEATURES — COMPLETE LIST

## 2A. Patient Features

### Authentication
- Email + Password se register karna
- Login karna, JWT token milta hai
- Password change karna
- Profile update karna (name, phone, photo)

### Doctor Search & Discovery
- Sab doctors ki list dekhna
- Filter by: Specialization (Cardiologist, Dermatologist etc.)
- Filter by: City (Karachi, Lahore, Islamabad)
- Filter by: Consultation fee range (min - max)
- Filter by: Available days (Monday, Tuesday etc.)
- Sort by: Rating (high to low)
- Sort by: Experience (years)
- Real-time search bar (type name, results aayein)

### Doctor Profile Page
- Doctor ki photo, name, specialization
- Qualification aur experience years
- Consultation fee
- City & location
- Bio / description
- Average star rating (1-5)
- All patient reviews
- Available time slots calendar

### Appointment Booking
- Calendar pe available slot select karo
- Date aur time choose karo
- Reason for visit likhna (optional)
- Booking confirm karo
- Confirmation email milti hai automatically

### My Appointments Dashboard
- Upcoming appointments (date, time, doctor name)
- Past appointments history
- Appointment status: pending / confirmed / cancelled / completed
- Appointment cancel karna (24 hours pehle)
- Doctor ka prescription / notes dekhna (after appointment)
- Review likhna (after completed appointment)

### AI Chatbot (Patient Side)
- Health-related sawaal pooch saktay hain
- "Mujhe bukhaar hai kaunsa doctor dekhna chahiye?" type queries
- Doctor recommendations (by symptom)
- Appointment booking help
- General health tips

---

## 2B. Doctor Features

### Profile Setup
- Photo upload karna
- Specialization select karna (dropdown)
- Qualification likhna (MBBS, MD etc.)
- Experience years likhna
- Consultation fee set karna
- City select karna
- Bio / about me likhna
- Status: Pending approval (admin approve karega)

### Schedule Management
- Har din ke liye availability set karo
  - Example: Monday 9am-5pm, Wednesday 10am-2pm
- Slot duration choose karo: 15 / 30 / 60 minutes
- Off days mark karo (holidays, leave)
- Specific dates block karo

### Appointment Management
- Pending appointments dekhna
- Confirm karna ya Cancel karna
- Cancellation reason likhna
- Mark as Completed
- Prescription / notes add karna (after appointment)

### Doctor Dashboard
- Today's appointments count
- This week ka schedule
- Total patients (all time)
- Average rating
- Recent reviews

---

## 2C. Admin Features

### Doctor Approval
- New doctor registrations ki list
- Doctor ka profile review karna
- Approve karna (doctor visible ho jata hai patients ko)
- Reject karna (reason likhna, email jayegi doctor ko)

### User Management
- All patients list (search, filter)
- All doctors list (approved + pending)
- Any user ban / unban karna
- Ban reason likhna

### Analytics Dashboard
- Total registered users (patients + doctors)
- Total appointments today
- Total appointments this week / month
- Most popular specializations (chart)
- Revenue overview (consultation fees)
- New registrations this month

### System Control
- Any appointment cancel karna
- Reviews moderate karna (spam delete)

---

## 2D. AI Chatbot — Full Features (Separate Section 8 mein detail)

- Patients ke health sawaalon ka jawab
- Symptom-based doctor recommendation
- Appointment booking guidance
- 24/7 available
- Chat history save hoti hai

---

# 3. TECH STACK

## Frontend
```
Next.js 14          — React framework, file-based routing, SSR/SSG
TypeScript          — Type safety, less bugs
Tailwind CSS        — Utility-first styling, fast UI development
ShadCN UI           — Ready-made components (Button, Card, Dialog etc.)
Recharts            — Charts for admin dashboard
React Hook Form     — Form handling + validation
Axios               — API calls to backend
```

## Backend
```
FastAPI (Python)    — Fast REST API framework
SQLAlchemy          — ORM for database queries
Pydantic            — Data validation
python-jose         — JWT token creation + verification
passlib + bcrypt    — Password hashing
Resend              — Email sending (free 3000/month)
```

## Database
```
NeonDB (PostgreSQL) — Cloud PostgreSQL, free tier available
```

## AI / Chatbot
```
Claude API (Anthropic)  — LLM for chatbot responses (or OpenAI GPT)
LangChain (optional)    — For advanced prompt chaining
```

## Deployment
```
Vercel              — Frontend hosting (free)
Railway             — Backend hosting (free tier)
NeonDB              — Database (free tier)
```

---

# 4. DATABASE DESIGN

## Tables Overview

```
users               — Sab users (patient, doctor, admin)
doctors             — Doctor ki extra profile info
schedules           — Doctor ka weekly availability
appointments        — Booking records
reviews             — Patient ka doctor ko rating + comment
chat_sessions       — Chatbot conversation history
chat_messages       — Har message (user + bot)
```

---

## Table: users

```sql
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20) DEFAULT 'patient',
                -- Values: 'patient' / 'doctor' / 'admin'
    phone       VARCHAR(20),
    photo_url   TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    is_banned   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## Table: doctors

```sql
CREATE TABLE doctors (
    id                  SERIAL PRIMARY KEY,
    user_id             INT REFERENCES users(id) ON DELETE CASCADE,
    specialization      VARCHAR(100) NOT NULL,
    qualification       VARCHAR(200),
    experience_years    INT DEFAULT 0,
    consultation_fee    DECIMAL(10, 2) NOT NULL,
    bio                 TEXT,
    city                VARCHAR(100),
    is_approved         BOOLEAN DEFAULT FALSE,
    rejection_reason    TEXT,
    avg_rating          DECIMAL(3, 2) DEFAULT 0.0,
    total_reviews       INT DEFAULT 0,
    created_at          TIMESTAMP DEFAULT NOW()
);
```

---

## Table: schedules

```sql
CREATE TABLE schedules (
    id              SERIAL PRIMARY KEY,
    doctor_id       INT REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week     VARCHAR(10) NOT NULL,
                    -- 'Monday', 'Tuesday', ... 'Sunday'
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    slot_duration   INT DEFAULT 30,
                    -- minutes: 15, 30, or 60
    is_available    BOOLEAN DEFAULT TRUE
);
```

---

## Table: appointments

```sql
CREATE TABLE appointments (
    id                  SERIAL PRIMARY KEY,
    patient_id          INT REFERENCES users(id),
    doctor_id           INT REFERENCES doctors(id),
    appointment_date    DATE NOT NULL,
    time_slot           TIME NOT NULL,
    reason              TEXT,
    status              VARCHAR(20) DEFAULT 'pending',
                        -- 'pending' / 'confirmed' / 'cancelled' / 'completed'
    cancel_reason       TEXT,
    notes               TEXT,   -- doctor ka prescription / advice
    created_at          TIMESTAMP DEFAULT NOW()
);
```

---

## Table: reviews

```sql
CREATE TABLE reviews (
    id          SERIAL PRIMARY KEY,
    patient_id  INT REFERENCES users(id),
    doctor_id   INT REFERENCES doctors(id),
    appointment_id INT REFERENCES appointments(id),
    rating      INT CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(patient_id, appointment_id)  -- ek appointment pe ek hi review
);
```

---

## Table: chat_sessions

```sql
CREATE TABLE chat_sessions (
    id          SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id),
    title       VARCHAR(200),   -- first message se auto-generate
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

---

## Table: chat_messages

```sql
CREATE TABLE chat_messages (
    id          SERIAL PRIMARY KEY,
    session_id  INT REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        VARCHAR(10) NOT NULL,   -- 'user' or 'assistant'
    content     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);
```

---

# 5. FOLDER STRUCTURE

## Frontend (Next.js)

```
frontend/
├── app/
│   ├── layout.tsx                    ← Root layout (fonts, providers)
│   ├── page.tsx                      ← Landing/Home page
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx              ← Login page
│   │   └── register/
│   │       └── page.tsx              ← Register (Patient / Doctor choice)
│   ├── patient/
│   │   ├── layout.tsx                ← Patient sidebar layout
│   │   ├── dashboard/
│   │   │   └── page.tsx              ← Patient home
│   │   ├── doctors/
│   │   │   ├── page.tsx              ← Doctors search + list
│   │   │   └── [id]/
│   │   │       └── page.tsx          ← Doctor profile page
│   │   ├── book/
│   │   │   └── [id]/
│   │   │       └── page.tsx          ← Booking page (slot picker)
│   │   ├── appointments/
│   │   │   └── page.tsx              ← My appointments list
│   │   ├── chatbot/
│   │   │   └── page.tsx              ← AI chatbot page
│   │   └── profile/
│   │       └── page.tsx              ← Patient profile settings
│   ├── doctor/
│   │   ├── layout.tsx                ← Doctor sidebar layout
│   │   ├── dashboard/
│   │   │   └── page.tsx              ← Doctor home + stats
│   │   ├── profile/
│   │   │   └── page.tsx              ← Edit doctor profile
│   │   ├── schedule/
│   │   │   └── page.tsx              ← Set weekly availability
│   │   └── appointments/
│   │       └── page.tsx              ← Manage appointments
│   └── admin/
│       ├── layout.tsx                ← Admin sidebar layout
│       ├── dashboard/
│       │   └── page.tsx              ← Stats + charts
│       ├── doctors/
│       │   └── page.tsx              ← Approve/reject doctors
│       └── users/
│           └── page.tsx              ← All users management
│
├── components/
│   ├── ui/                           ← ShadCN components (auto-generated)
│   ├── layout/
│   │   ├── Navbar.tsx                ← Top navigation bar
│   │   ├── Sidebar.tsx               ← Dashboard sidebar
│   │   └── Footer.tsx                ← Footer
│   ├── doctor/
│   │   ├── DoctorCard.tsx            ← Doctor listing card
│   │   ├── DoctorFilter.tsx          ← Search + filter sidebar
│   │   └── StarRating.tsx            ← Star rating component
│   ├── appointment/
│   │   ├── TimeSlotPicker.tsx        ← Calendar slot selector
│   │   ├── AppointmentCard.tsx       ← Single appointment item
│   │   └── StatusBadge.tsx           ← pending/confirmed/cancelled badge
│   ├── chatbot/
│   │   ├── ChatWindow.tsx            ← Chat UI container
│   │   ├── ChatMessage.tsx           ← Single message bubble
│   │   └── ChatInput.tsx             ← Input + send button
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── EmptyState.tsx
│       └── ConfirmDialog.tsx
│
├── lib/
│   ├── api.ts                        ← All API call functions (axios)
│   ├── auth.ts                       ← Token save/get/delete
│   └── utils.ts                      ← Helper functions
│
├── hooks/
│   ├── useAuth.ts                    ← Current user hook
│   └── useAppointments.ts            ← Appointments data hook
│
├── types/
│   └── index.ts                      ← TypeScript interfaces
│
└── .env.local
    NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Backend (FastAPI)

```
backend/
├── main.py                           ← App entry, CORS settings, routers
├── database.py                       ← NeonDB connection + session
├── .env                              ← Secrets (never push to GitHub!)
│
├── models/
│   ├── user.py                       ← User SQLAlchemy model
│   ├── doctor.py                     ← Doctor model
│   ├── appointment.py                ← Appointment model
│   ├── review.py                     ← Review model
│   └── chat.py                       ← ChatSession + ChatMessage models
│
├── schemas/
│   ├── user.py                       ← Pydantic schemas (request/response)
│   ├── doctor.py
│   ├── appointment.py
│   └── chat.py
│
├── routes/
│   ├── auth.py                       ← /auth/register, /auth/login
│   ├── doctors.py                    ← /doctors CRUD + search
│   ├── schedules.py                  ← /schedules management
│   ├── appointments.py               ← /appointments CRUD
│   ├── reviews.py                    ← /reviews
│   ├── chatbot.py                    ← /chat routes
│   └── admin.py                      ← /admin/* routes
│
├── middleware/
│   └── auth.py                       ← JWT token verification dependency
│
└── utils/
    ├── jwt.py                        ← Token create + decode
    ├── email.py                      ← Resend API email sender
    └── chatbot.py                    ← LLM API call logic
```

---

# 6. API ENDPOINTS

## Auth Routes

```
POST   /auth/register          → New user register karna
                                 Body: { name, email, password, role }
                                 Returns: { user, token }

POST   /auth/login             → Login karna
                                 Body: { email, password }
                                 Returns: { user, token }

GET    /auth/me                → Current user info (token required)
                                 Returns: { id, name, email, role }

PUT    /auth/change-password   → Password change karna
                                 Body: { old_password, new_password }
```

---

## Doctor Routes

```
GET    /doctors                → Sab approved doctors ki list
                                 Query params:
                                   ?search=          (name search)
                                   ?specialization=  (filter)
                                   ?city=            (filter)
                                   ?min_fee=         (filter)
                                   ?max_fee=         (filter)
                                   ?day=             (available day)
                                   ?sort_by=         (rating/experience)
                                 Returns: [doctors array]

GET    /doctors/{id}           → Single doctor ki full profile
                                 Returns: { doctor, reviews, schedule }

POST   /doctors/profile        → Doctor profile create karo
                                 Auth: Doctor only
                                 Body: { specialization, qualification, fee, ... }

PUT    /doctors/profile        → Profile update karo
                                 Auth: Doctor only

GET    /doctors/{id}/slots     → Available booking slots
                                 Query: ?date=2025-08-15
                                 Returns: [ "09:00", "09:30", "10:00", ... ]

GET    /doctors/my/dashboard   → Doctor ka dashboard stats
                                 Auth: Doctor only
```

---

## Schedule Routes

```
GET    /schedules/my           → Doctor ka apna schedule
                                 Auth: Doctor only

POST   /schedules              → New schedule day add karo
                                 Auth: Doctor only
                                 Body: { day_of_week, start_time, end_time, slot_duration }

PUT    /schedules/{id}         → Schedule update karo
                                 Auth: Doctor only

DELETE /schedules/{id}         → Schedule remove karo
                                 Auth: Doctor only
```

---

## Appointment Routes

```
POST   /appointments           → New appointment book karo
                                 Auth: Patient only
                                 Body: { doctor_id, appointment_date, time_slot, reason }
                                 Action: Email jayegi patient + doctor ko

GET    /appointments/my        → Patient ki appointments
                                 Auth: Patient only
                                 Query: ?status=pending (filter)
                                 Returns: [appointments list]

GET    /appointments/doctor    → Doctor ke appointments
                                 Auth: Doctor only
                                 Query: ?date=today (filter)

PUT    /appointments/{id}/confirm   → Appointment confirm karo
                                      Auth: Doctor only
                                      Action: Patient ko email jayegi

PUT    /appointments/{id}/cancel    → Appointment cancel karo
                                      Auth: Patient or Doctor
                                      Body: { reason }
                                      Action: Dono ko email jayegi

PUT    /appointments/{id}/complete  → Mark as completed
                                      Auth: Doctor only

PUT    /appointments/{id}/notes     → Prescription add karo
                                      Auth: Doctor only
                                      Body: { notes }
```

---

## Review Routes

```
POST   /reviews                → Review submit karo
                                 Auth: Patient only
                                 Body: { doctor_id, appointment_id, rating, comment }
                                 Condition: appointment status = 'completed' hona chahiye

GET    /reviews/doctor/{id}    → Doctor ke sab reviews
                                 Returns: [reviews], avg_rating
```

---

## Chatbot Routes

```
POST   /chat/session           → New chat session start karo
                                 Auth: Patient only
                                 Returns: { session_id }

POST   /chat/message           → Message bhejo, AI reply milta hai
                                 Auth: Patient only
                                 Body: { session_id, message }
                                 Returns: { reply }

GET    /chat/sessions          → Patient ki sab chat sessions
                                 Auth: Patient only

GET    /chat/sessions/{id}     → Specific session ki messages history
                                 Auth: Patient only

DELETE /chat/sessions/{id}     → Chat session delete karo
                                 Auth: Patient only
```

---

## Admin Routes

```
GET    /admin/doctors/pending       → Approval pending doctors list
                                      Auth: Admin only

PUT    /admin/doctors/{id}/approve  → Doctor approve karo
                                      Auth: Admin only
                                      Action: Doctor ko email jayegi

PUT    /admin/doctors/{id}/reject   → Doctor reject karo
                                      Auth: Admin only
                                      Body: { reason }

GET    /admin/users                 → All users list
                                      Auth: Admin only
                                      Query: ?role=patient&search=

PUT    /admin/users/{id}/ban        → User ban karo
                                      Auth: Admin only
                                      Body: { reason }

PUT    /admin/users/{id}/unban      → User unban karo

GET    /admin/stats                 → Dashboard statistics
                                      Returns: {
                                        total_patients,
                                        total_doctors,
                                        total_appointments_today,
                                        total_appointments_month,
                                        popular_specializations: [],
                                        recent_registrations: []
                                      }
```

---

# 7. PAGE LIST (FRONTEND)

```
Route                           Page Name               Who Can Access
─────────────────────────────────────────────────────────────────────
/                               Landing Page            Everyone
/login                          Login                   Everyone
/register                       Register                Everyone
/patient/dashboard              Patient Home            Patient
/patient/doctors                Find Doctors            Patient
/patient/doctors/[id]           Doctor Profile          Patient
/patient/book/[id]              Book Appointment        Patient
/patient/appointments           My Appointments         Patient
/patient/chatbot                AI Chatbot              Patient
/patient/profile                My Profile              Patient
/doctor/dashboard               Doctor Home             Doctor
/doctor/profile                 Edit Profile            Doctor
/doctor/schedule                Manage Schedule         Doctor
/doctor/appointments            Appointments List       Doctor
/admin/dashboard                Admin Overview          Admin
/admin/doctors                  Approve Doctors         Admin
/admin/users                    All Users               Admin
```

**Route Protection:**
Har protected route pe check karo:
1. Token hai localStorage mein?
2. Token valid hai? (expire toh nahi hua)
3. User ka role match karta hai?

Agar nahi → /login pe redirect kar do.

---

# 8. AI CHATBOT — FULL DETAILS

## 8A. What the Chatbot Does

Yeh chatbot specifically healthcare ke liye train hoga (system prompt se). Yeh kar sakta hai:

1. Symptom sun ke doctor specialization suggest karna
   - "Mujhe seene mein dard hai" → Cardiologist recommend
   - "Meri skin pe rashes hain" → Dermatologist recommend

2. General health guidance dena
   - "Bukhaar mein kya karein"
   - "Diabetes mein kya nahi khana chahiye"

3. Platform help
   - "Doctor kaise book karein?"
   - "Appointment cancel kaise hogi?"

4. Doctors recommend karna (database se)
   - User city aur symptom deta hai
   - Bot relevant doctors suggest karta hai

## 8B. Tech

```
LLM API:    Claude (Anthropic) ya OpenAI GPT-3.5-turbo
Backend:    FastAPI /chat/message route
Frontend:   React chat UI (ChatWindow component)
Storage:    PostgreSQL mein chat_sessions + chat_messages
```

## 8C. System Prompt (Backend mein likho)

```python
SYSTEM_PROMPT = """
You are a helpful medical assistant for a doctor appointment booking platform in Pakistan.

Your job is to:
1. Help patients understand their symptoms and suggest which type of doctor they should see
2. Answer general health questions in simple Urdu or English (based on user's language)
3. Guide users on how to use the platform (booking, cancelling appointments)
4. Recommend doctor specializations based on symptoms

Rules you must follow:
- NEVER give specific medication names or dosages
- Always recommend consulting a real doctor for serious issues
- Be empathetic and simple in your language
- If user writes in Urdu, respond in Urdu
- If user writes in English, respond in English
- Keep responses concise and easy to understand
- Do not discuss topics outside health and this platform

Specializations available on this platform:
General Physician, Cardiologist, Dermatologist, Orthopedic,
Neurologist, Gynecologist, Pediatrician, ENT Specialist,
Eye Specialist, Psychiatrist, Urologist, Gastroenterologist

Platform features:
- Search doctors by specialization and city
- Book 30-minute appointment slots
- View appointment history
- Leave reviews after appointments
"""
```

## 8D. Backend Code (utils/chatbot.py)

```python
import anthropic
import os

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def get_chatbot_reply(conversation_history: list, user_message: str) -> str:
    """
    conversation_history format:
    [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi! How can I help?"},
        ...
    ]
    """
    # Add new user message to history
    messages = conversation_history + [
        {"role": "user", "content": user_message}
    ]

    response = client.messages.create(
        model="claude-3-haiku-20240307",   # Fast + cheap model
        max_tokens=500,
        system=SYSTEM_PROMPT,
        messages=messages
    )

    return response.content[0].text
```

## 8E. Backend Route (routes/chatbot.py)

```python
from fastapi import APIRouter, Depends
from utils.chatbot import get_chatbot_reply
from middleware.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["chatbot"])

@router.post("/message")
async def send_message(
    session_id: int,
    message: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    # 1. Session verify karo (user ki apni session hai?)
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 2. Previous messages load karo (last 10 for context)
    prev_messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).limit(10).all()

    history = [{"role": m.role, "content": m.content} for m in prev_messages]

    # 3. LLM se reply lo
    reply = get_chatbot_reply(history, message)

    # 4. Dono messages save karo DB mein
    db.add(ChatMessage(session_id=session_id, role="user", content=message))
    db.add(ChatMessage(session_id=session_id, role="assistant", content=reply))
    db.commit()

    return {"reply": reply}
```

## 8F. Frontend Chat UI (components/chatbot/ChatWindow.tsx)

```typescript
"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWindow({ sessionId }: { sessionId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json",
                   "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ session_id: sessionId, message: userMessage }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, kuch masla ho gaya. Dobara try karein."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // <div className="flex flex-col h-[600px] md:h-[700px] border rounded-xl bg-white shadow-sm">

      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-blue-50 rounded-t-xl">
        <Bot className="text-blue-600" size={24} />
        <div>
          <h3 className="font-semibold text-gray-800">Health Assistant</h3>
          <p className="text-xs text-gray-500">Apne sawaal poochein</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <Bot size={40} className="mx-auto mb-2 text-blue-300" />
            <p>Assalamu Alaikum! Mujhe apni health problems batayein.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
              ${msg.role === "user" ? "bg-blue-600" : "bg-gray-200"}`}>
              {msg.role === "user"
                ? <User size={14} className="text-white" />
                : <Bot size={14} className="text-gray-600" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm
              ${msg.role === "user"
                ? "bg-blue-600 text-white rounded-tr-sm"
                : "bg-gray-100 text-gray-800 rounded-tl-sm"}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot size={14} className="text-gray-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "0ms"}} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "150ms"}} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "300ms"}} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Apna sawaal likhein..."
          className="flex-1"
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon">
          <Send size={16} />
        </Button>
      </div>

    </div>
  );
}
```

## 8G. Environment Variable

```
# backend .env mein add karo
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx

# Ya agar OpenAI use karo:
OPENAI_API_KEY=sk-xxxxxxxxxx
```

## 8H. Chatbot Cost

```
Claude Haiku (Anthropic):
- Input:  $0.25 per million tokens
- Output: $1.25 per million tokens
- Ek message average 200 tokens = $0.0003 per message
- 1000 messages = $0.30 (bahut sasta!)

Free option: Groq API
- llama3 model FREE hai
- Sign up: console.groq.com
- Bahut fast response
```

---

# 9. MOBILE RESPONSIVE GUIDE

## 9A. Kyun Important Hai

Pakistan mein 90%+ users mobile pe hain. Agar mobile responsive nahi hai toh project ka koi fayda nahi.

## 9B. Tailwind Responsive Prefixes

```
sm:   640px se upar    (small phones landscape)
md:   768px se upar    (tablets)
lg:   1024px se upar   (laptops)
xl:   1280px se upar   (desktops)
```

**Mobile-first approach:** pehle mobile ke liye likho, phir md: lg: add karo.

## 9C. Common Patterns

### Navigation — Mobile mein hamburger menu

```typescript
// Navbar.tsx
const [menuOpen, setMenuOpen] = useState(false);

<nav className="flex items-center justify-between p-4">
  <Logo />

  {/* Desktop menu */}
  <div className="hidden md:flex gap-6">
    <NavLinks />
  </div>

  {/* Mobile hamburger */}
  <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
    {menuOpen ? <X /> : <Menu />}
  </button>
</nav>

{/* Mobile dropdown */}
{menuOpen && (
  <div className="md:hidden flex flex-col p-4 border-t bg-white">
    <NavLinks />
  </div>
)}
```

### Doctor Cards Grid — 1 column mobile, 2 tablet, 3 desktop

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {doctors.map(doc => <DoctorCard key={doc.id} doctor={doc} />)}
</div>
```

### Dashboard Sidebar — Mobile mein hidden, button se toggle

```tsx
<div className="flex">
  {/* Sidebar */}
  <aside className={`
    fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    md:relative md:translate-x-0
  `}>
    <SidebarContent />
  </aside>

  {/* Overlay on mobile */}
  {sidebarOpen && (
    <div
      className="fixed inset-0 bg-black/50 z-40 md:hidden"
      onClick={() => setSidebarOpen(false)}
    />
  )}

  {/* Main content */}
  <main className="flex-1 p-4 md:p-6">
    {children}
  </main>
</div>
```

### Stats Cards — Stack on mobile

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <StatCard title="Total Patients" value="1,240" />
  <StatCard title="Today's Appointments" value="18" />
  <StatCard title="Pending Approvals" value="5" />
  <StatCard title="Revenue" value="PKR 45,000" />
</div>
```

### Table — Scroll on mobile

```tsx
<div className="overflow-x-auto rounded-lg border">
  <table className="min-w-full">
    {/* ... */}
  </table>
</div>
```

### Chatbot — Full screen on mobile

```tsx
<div className="
  fixed inset-0 z-50
  md:relative md:inset-auto md:rounded-xl
  flex flex-col bg-white
">
  <ChatWindow />
</div>
```

### Forms — Full width on mobile

```tsx
<form className="space-y-4 max-w-lg mx-auto px-4 md:px-0">
  <input className="w-full border rounded-lg px-4 py-3 text-sm md:text-base" />
  <button className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg">
    Submit
  </button>
</form>
```

## 9D. Responsive Checklist

```
[ ] Navbar — hamburger menu on mobile
[ ] All grids — grid-cols-1 by default
[ ] Tables — overflow-x-auto wrapper
[ ] Forms — full width inputs on mobile
[ ] Buttons — large enough to tap (min h-10)
[ ] Font sizes — readable without zooming
[ ] Sidebar — hidden on mobile, toggle with button
[ ] Chatbot — usable on small screens
[ ] Images — responsive (w-full, object-cover)
[ ] Modals/Dialogs — full screen or properly sized on mobile
```

---

# 10. EMAIL NOTIFICATIONS

## When Emails Are Sent

```
Event                       → To Whom
─────────────────────────────────────
Appointment Booked          → Patient (confirmation)
                            → Doctor (new booking alert)
Appointment Confirmed       → Patient (doctor ne confirm kiya)
Appointment Cancelled       → Patient + Doctor (with reason)
Appointment Completed       → Patient (please leave a review)
Doctor Account Approved     → Doctor (login kar saktay hain ab)
Doctor Account Rejected     → Doctor (reason ke saath)
```

## Setup (Resend API)

1. resend.com pe account banao (free)
2. API key lo: Settings → API Keys → Create
3. .env mein add karo: `RESEND_API_KEY=re_xxxxx`

## Backend Code (utils/email.py)

```python
import resend
import os

resend.api_key = os.getenv("RESEND_API_KEY")

def send_appointment_confirmation(patient_email: str, doctor_name: str,
                                   date: str, time: str):
    resend.Emails.send({
        "from": "appointments@yourdomain.com",
        "to": patient_email,
        "subject": "Appointment Confirmed!",
        "html": f"""
            <h2>Appointment Booked Successfully!</h2>
            <p>Dr. {doctor_name} se appointment book ho gayi hai.</p>
            <p><strong>Date:</strong> {date}</p>
            <p><strong>Time:</strong> {time}</p>
            <p>Appointment se pehle yahan aayein.</p>
        """
    })

def send_doctor_approved(doctor_email: str, doctor_name: str):
    resend.Emails.send({
        "from": "support@yourdomain.com",
        "to": doctor_email,
        "subject": "Account Approved!",
        "html": f"""
            <h2>Mubarak ho Dr. {doctor_name}!</h2>
            <p>Aapka account approve ho gaya hai.</p>
            <p>Ab aap login kar ke appointments receive kar saktay hain.</p>
        """
    })
```

---

# 11. WEEK-BY-WEEK PLAN

## Week 1 — Setup + Auth

**Backend:**
- FastAPI project banao
- NeonDB connect karo
- Sab tables create karo (Section 4 ka SQL)
- /auth/register API
- /auth/login API (JWT token return kare)
- auth middleware (token verify kare)

**Frontend:**
- Next.js 14+ + TypeScript + Tailwind + ShadCN setup
- Register page (3 role options: Patient, Doctor, Admin)
- Login page
- JWT token localStorage mein save karo
- Protected route wrapper banao

**Test:** Postman ya browser se register + login karo, token milna chahiye.

---

## Week 2 — Doctor Profile + Schedule

**Backend:**
- Doctor profile create/update API
- Schedule CRUD APIs
- Available slots calculate karne ki logic
  - Doctor ke schedule se slots nikaalein
  - Already booked slots remove karein

**Frontend:**
- Doctor profile setup form (registration ke baad)
- Schedule management page
  - Days select karo (Mon to Sun checkboxes)
  - Start/end time input
  - Slot duration dropdown

**Test:** Doctor register karo, profile banao, schedule set karo.

---

## Week 3 — Patient Side — Search + Booking

**Backend:**
- Doctors list API with search + filters
- Single doctor profile API (with reviews + schedule)
- Available slots API (for specific date)

**Frontend:**
- Doctors listing page
  - Search bar
  - Filter sidebar (specialization, city, fee)
  - Doctor cards grid (responsive)
- Doctor detail page
  - Profile info
  - Reviews section
  - Time slot picker
- Booking form
  - Date picker
  - Available slots show karo
  - Reason textarea
  - Confirm booking button

**Test:** Patient login karo, doctor dhundho, appointment book karo.

---

## Week 4 — Appointments Management

**Backend:**
- My appointments API (patient)
- Doctor appointments API
- Confirm / Cancel / Complete APIs
- Notes add API

**Frontend:**
- Patient: My Appointments page
  - Upcoming tab
  - Past tab
  - Status badges
  - Cancel button (with confirm dialog)
- Doctor: Appointments page
  - Pending tab
  - Today tab
  - Confirm/Cancel buttons
  - Notes/prescription textarea

**Test:** Doctor ne appointment confirm kiya, patient ne cancel kiya.

---

## Week 5 — Admin Panel + Reviews

**Backend:**
- Pending doctors API
- Approve/reject API
- All users API
- Stats API
- Reviews CRUD

**Frontend:**
- Admin dashboard (stats cards + simple charts)
- Doctors approval table
- Users management table
- Patient: Review form (after completed appointment)

**Test:** Admin login karo, doctor approve karo.

---

## Week 6 — AI Chatbot

**Backend:**
- Anthropic API integrate karo
- Chat session create/get APIs
- Message send + LLM reply API

**Frontend:**
- Chatbot page
- ChatWindow component
- Typing indicator
- Chat history

**Test:** Patient login karo, chatbot se baat karo.

---

## Week 7 — Polish + Deploy

- Mobile responsive test karo (sab pages phone pe dekhna)
- Loading states add karo (spinner, skeleton)
- Error handling improve karo (toast messages)
- Empty states add karo (koi data nahi toh message dikhao)
- GitHub README likho (screenshots + live link)
- Vercel pe frontend deploy karo
- Railway pe backend deploy karo
- .env variables production mein set karo

---

# 12. SETUP GUIDE (DAY 1)

## Step 1 — Folders Banao

```bash
mkdir doctor-appointment-system
cd doctor-appointment-system
mkdir frontend backend
```

## Step 2 — Backend Setup

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install fastapi uvicorn sqlalchemy psycopg2-binary
pip install python-jose[cryptography] passlib[bcrypt]
pip install python-dotenv resend anthropic
```

**.env file banao (backend folder mein):**
```
DATABASE_URL=postgresql://user:password@host/dbname
SECRET_KEY=koi-bhi-lambi-string-likhdo-yahan-123456
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
RESEND_API_KEY=re_xxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```

**main.py:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Doctor Appointment System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API is running!"}
```

**Run karo:**
```bash
uvicorn main:app --reload
# http://localhost:8000 pe open karo
```

## Step 3 — Frontend Setup

```bash
cd ../frontend

npx create-next-app@latest . --typescript --tailwind --app --src-dir no

npx shadcn@latest init
# Style: Default
# Color: Blue
# CSS variables: Yes

npx shadcn@latest add button input card badge table dialog toast calendar select
```

**.env.local file banao (frontend folder mein):**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Run karo:**
```bash
npm run dev
# http://localhost:3000 pe open karo
```

## Step 4 — NeonDB Setup

1. neon.tech pe jaao → Free account banao
2. New Project banao: "doctor-appointment"
3. Dashboard pe "Connection string" copy karo
4. backend/.env mein DATABASE_URL mein paste karo
5. NeonDB ke SQL Editor mein jaao
6. Section 4 ka poora SQL paste karo → Run karo
7. Tables ban jayengi

## Step 5 — Test Karo

```bash
# Backend terminal mein:
uvicorn main:app --reload

# Frontend terminal mein:
npm run dev

# Browser mein:
# http://localhost:3000 → Frontend
# http://localhost:8000/docs → API documentation (automatic!)
```

---

# 13. DEPLOYMENT

## Frontend — Vercel

1. GitHub pe repo push karo: `git push origin main`
2. vercel.com pe login karo
3. "Add New Project" → GitHub repo select karo
4. Root Directory: `frontend` set karo
5. Environment Variables add karo:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend.up.railway.app
   ```
6. Deploy karo → 2 minute mein live ho jata hai

## Backend — Railway

1. railway.app pe account banao (GitHub se login)
2. "New Project" → "Deploy from GitHub repo"
3. Backend folder select karo
4. Environment Variables mein sab .env ka content add karo
5. Settings → Start Command:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
6. Deploy karo → URL milega (copy karo Vercel mein daalo)

## GitHub README Template

```markdown
# Doctor Appointment Booking System

Live Demo: https://your-app.vercel.app

## Features
- 3 role-based dashboards (Patient, Doctor, Admin)
- AI Chatbot for health queries
- Real-time slot booking
- Email notifications
- Mobile responsive

## Tech Stack
Next.js · TypeScript · FastAPI · PostgreSQL · Claude AI

## Screenshots
[screenshots yahan add karo]

## Setup
[setup instructions]
```

---

# 14. CV POINTS + FINAL CHECKLIST

## CV Mein Add Karo (Copy-Paste Ready)

```
Project: Doctor Appointment Booking System + AI Chatbot
Live: https://your-project.vercel.app
GitHub: github.com/ucdexpert/doctor-appointment

• Built a full-stack healthcare platform with 3 role-based dashboards
  (Patient, Doctor, Admin) using Next.js and FastAPI

• Integrated AI chatbot using geminiApi for symptom-based doctor
  recommendations and health guidance

• Implemented JWT authentication, dynamic slot booking, and automated
  email notifications via Resend API

• Designed RESTful APIs with 25+ endpoints covering appointments,
  schedules, reviews, and admin management

• Built fully mobile-responsive UI using Tailwind CSS and ShadCN UI

• Tech: Next.js, TypeScript, Tailwind CSS, FastAPI, PostgreSQL,
  Claude API, Vercel, Railway
```

---

## Final Checklist

### Backend
```
[ ] Database tables banaye (users, doctors, schedules, appointments, reviews, chat)
[ ] Auth APIs (register, login, JWT)
[ ] Doctor profile + schedule APIs
[ ] Appointment CRUD APIs (book, confirm, cancel, complete)
[ ] Reviews APIs
[ ] Chatbot APIs (session, message, history)
[ ] Admin APIs (approve, reject, stats)
[ ] Email notifications (Resend)
[ ] Backend deployed on Railway
```

### Frontend
```
[ ] Login + Register pages
[ ] Patient dashboard
[ ] Doctor search + filter page
[ ] Doctor profile page
[ ] Slot picker + booking form
[ ] My appointments page
[ ] Doctor dashboard + schedule management
[ ] Doctor appointments management
[ ] Admin dashboard + approval + users
[ ] AI Chatbot page
[ ] Mobile responsive (test on phone!)
[ ] Loading states + error handling
[ ] Frontend deployed on Vercel
```

### GitHub
```
[ ] README with screenshots + live link
[ ] .env.example file (actual keys nahi, sirf variable names)
[ ] .gitignore mein .env add kiya hai?
[ ] Code clean hai (unused imports remove karo)
```

### CV + Portfolio
```
[ ] CV mein project add kiya
[ ] LinkedIn pe project add kiya
[ ] Portfolio website pe add kiya
```

---

*All the best Muhammad Uzair — You got this! 🚀*
*github.com/ucdexpert*