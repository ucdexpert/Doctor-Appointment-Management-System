from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
import os

# Import models BEFORE creating tables
from models import User, Doctor, Schedule, Appointment, Review, ChatSession, ChatMessage

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Doctor Appointment System API",
    description="API for Doctor Appointment Booking System with AI Chatbot",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
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

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Import and include routers
from routes import auth, doctors, schedules, appointments, reviews, chatbot, upload

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(doctors.router, tags=["Doctors"])
app.include_router(schedules.router, tags=["Schedules"])
app.include_router(appointments.router, tags=["Appointments"])
app.include_router(reviews.router, tags=["Reviews"])
app.include_router(chatbot.router, tags=["Chatbot"])
app.include_router(upload.router, tags=["File Upload"])

# Mount static files for uploaded photos
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
