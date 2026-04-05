---
title: Doctor Appointment System API
emoji: 🏥
colorFrom: blue
colorTo: teal
sdk: docker
pinned: false
license: mit
---

# 🏥 Doctor Appointment System API

A comprehensive REST API for managing doctor appointments, built with FastAPI and PostgreSQL.

## Features

- 👤 User authentication (JWT)
- 🩺 Doctor management & search
- 📅 Appointment booking & scheduling
- 💬 AI Health Chatbot (Groq/Llama 3.1)
- ⭐ Reviews & ratings
- 📧 Email notifications (Resend)
- 🔒 Admin dashboard APIs

## API Documentation

Once deployed, access interactive docs at:
- **Swagger UI:** `https://<your-space>.hf.space/docs`
- **ReDoc:** `https://<your-space>.hf.space/redoc`

## Environment Variables

Set these in Hugging Face Space Settings:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SECRET_KEY` | JWT secret (min 32 chars) | ✅ |
| `FRONTEND_URL` | Your Vercel frontend URL | ✅ |
| `GROQ_API_KEY` | Groq AI API key | ❌ |
| `RESEND_API_KEY` | Resend email API key | ❌ |
| `FROM_EMAIL` | Verified sender email | ❌ |

## Quick Start

1. Get PostgreSQL URL from [NeonDB](https://neon.tech/)
2. Generate secret key: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
3. Get Groq API key from [Groq Console](https://console.groq.com/keys)
4. Add all variables to Space Settings
5. Rebuild the space

## Frontend

Visit the patient/doctor/admin interface at:
👉 [https://doctor-appointment-management-sytem.vercel.app/](https://doctor-appointment-management-sytem.vercel.app/)

## Tech Stack

- **Backend:** FastAPI + SQLAlchemy
- **Database:** PostgreSQL (NeonDB)
- **AI:** Groq (Llama 3.1)
- **Email:** Resend

## License

MIT © Muhammad Uzair
