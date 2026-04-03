from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from utils.limiter import limiter
from database import engine, Base
import os
from datetime import datetime

# Import models BEFORE creating tables
from models import User, Doctor, Schedule, Appointment, Review, ChatSession, ChatMessage

# Import exception handlers
from middleware.exception_handler import register_exception_handlers

# Import scheduler
from utils.scheduler import start_scheduler

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Doctor Appointment System API",
    description="API for Doctor Appointment Booking System with AI Chatbot",
    version="1.0.0"
)

# Register global exception handlers
register_exception_handlers(app)

# Add rate limit error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Start appointment reminder scheduler
start_scheduler(app)

# CORS Configuration - Read allowed origins from FRONTEND_URL env var
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Build list of allowed origins
allowed_origins = list(set([
    frontend_url,
    "http://localhost:3000",
    "http://localhost:3001",
    "https://localhost:3000",
    "https://localhost:3001",
]))

# Add Vercel preview URLs pattern if frontend URL contains vercel.app
if "vercel.app" in frontend_url:
    allowed_origins.append(frontend_url.replace(".vercel.app", "-*.vercel.app"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Doctor Appointment System API is running!",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    """Health check endpoint - no auth required"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

# Import and include routers
from routes import auth, doctors, schedules, appointments, reviews, chatbot, upload, admin, favorites, search_history, notifications

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(doctors.router, tags=["Doctors"])
app.include_router(schedules.router, tags=["Schedules"])
app.include_router(appointments.router, tags=["Appointments"])
app.include_router(reviews.router, tags=["Reviews"])
app.include_router(chatbot.router, tags=["Chatbot"])
app.include_router(upload.router, tags=["File Upload"])
app.include_router(admin.router, tags=["Admin"])
app.include_router(favorites.router, tags=["Favorites"])
app.include_router(search_history.router, tags=["Search History"])
app.include_router(notifications.router, tags=["Notifications"])

# Mount static files for uploaded photos
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mount medical reports directory
medical_reports_dir = os.path.join("uploads", "medical_reports")
if not os.path.exists(medical_reports_dir):
    os.makedirs(medical_reports_dir, exist_ok=True)
