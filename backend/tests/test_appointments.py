"""
Test Appointment Endpoints
Run with: pytest tests/test_appointments.py -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
from models import User, Doctor
from passlib.context import CryptContext
from datetime import datetime, date, time

# Use SQLite for testing
TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop them after"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def override_get_db():
    """Override database dependency for testing"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture
def patient_token():
    """Create a test patient and return token"""
    db = TestingSessionLocal()
    
    # Create patient user
    patient = User(
        name="Test Patient",
        email="patient@test.com",
        password=pwd_context.hash("testpass123"),
        role="patient"
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    # Login to get token
    response = client.post("/auth/login", json={
        "email": "patient@test.com",
        "password": "testpass123"
    })
    
    token = response.json()["access_token"]
    db.close()
    return token


@pytest.fixture
def doctor_token():
    """Create a test doctor and return token"""
    db = TestingSessionLocal()
    
    # Create doctor user
    doctor_user = User(
        name="Test Doctor",
        email="doctor@test.com",
        password=pwd_context.hash("testpass123"),
        role="doctor"
    )
    db.add(doctor_user)
    db.commit()
    db.refresh(doctor_user)
    
    # Create doctor profile
    doctor = Doctor(
        user_id=doctor_user.id,
        specialization="Cardiologist",
        qualification="MBBS, MD",
        experience_years=10,
        consultation_fee=1000.00,
        city="Karachi",
        is_approved=True
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    
    # Login to get token
    response = client.post("/auth/login", json={
        "email": "doctor@test.com",
        "password": "testpass123"
    })
    
    token = response.json()["access_token"]
    doctor_id = doctor.id
    db.close()
    return token, doctor_id


class TestCreateAppointment:
    """Test appointment creation"""

    def test_create_appointment_success(self, patient_token, doctor_token):
        """Test successful appointment creation"""
        doctor_tok, doctor_id = doctor_token
        
        response = client.post(
            "/appointments",
            json={
                "doctor_id": doctor_id,
                "appointment_date": "2025-04-10",
                "time_slot": "10:00",
                "reason": "Regular checkup"
            },
            headers={"Authorization": f"Bearer {patient_token}"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["doctor_id"] == doctor_id
        assert data["status"] == "pending"
        assert data["reason"] == "Regular checkup"

    def test_create_appointment_unapproved_doctor_fails(self, patient_token):
        """Test appointment with unapproved doctor fails"""
        db = TestingSessionLocal()
        
        # Create unapproved doctor
        doctor_user = User(
            name="Unapproved Doctor",
            email="unapproved@test.com",
            password=pwd_context.hash("testpass123"),
            role="doctor"
        )
        db.add(doctor_user)
        db.commit()
        db.refresh(doctor_user)
        
        doctor = Doctor(
            user_id=doctor_user.id,
            specialization="Dermatologist",
            qualification="MBBS",
            experience_years=5,
            consultation_fee=800.00,
            city="Lahore",
            is_approved=False
        )
        db.add(doctor)
        db.commit()
        db.refresh(doctor)
        doctor_id = doctor.id
        db.close()
        
        response = client.post(
            "/appointments",
            json={
                "doctor_id": doctor_id,
                "appointment_date": "2025-04-10",
                "time_slot": "11:00",
                "reason": "Skin checkup"
            },
            headers={"Authorization": f"Bearer {patient_token}"}
        )

        assert response.status_code == 400

    def test_create_duplicate_appointment_fails(self, patient_token, doctor_token):
        """Test double booking prevention"""
        doctor_tok, doctor_id = doctor_token
        
        # First appointment
        client.post(
            "/appointments",
            json={
                "doctor_id": doctor_id,
                "appointment_date": "2025-04-10",
                "time_slot": "10:00",
                "reason": "First booking"
            },
            headers={"Authorization": f"Bearer {patient_token}"}
        )
        
        # Second appointment at same time
        response = client.post(
            "/appointments",
            json={
                "doctor_id": doctor_id,
                "appointment_date": "2025-04-10",
                "time_slot": "10:00",
                "reason": "Second booking"
            },
            headers={"Authorization": f"Bearer {patient_token}"}
        )

        assert response.status_code == 409  # Conflict

    def test_create_appointment_without_auth_fails(self):
        """Test appointment creation without authentication"""
        response = client.post(
            "/appointments",
            json={
                "doctor_id": 1,
                "appointment_date": "2025-04-10",
                "time_slot": "10:00",
                "reason": "No auth"
            }
        )

        assert response.status_code == 401


class TestGetAppointments:
    """Test getting appointments"""

    def test_get_patient_appointments(self, patient_token, doctor_token):
        """Test getting patient's appointments"""
        doctor_tok, doctor_id = doctor_token
        
        # Create appointment
        client.post(
            "/appointments",
            json={
                "doctor_id": doctor_id,
                "appointment_date": "2025-04-10",
                "time_slot": "10:00",
                "reason": "Checkup"
            },
            headers={"Authorization": f"Bearer {patient_token}"}
        )
        
        # Get appointments
        response = client.get(
            "/appointments/my",
            headers={"Authorization": f"Bearer {patient_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["doctor_id"] == doctor_id

    def test_get_doctor_appointments(self, patient_token, doctor_token):
        """Test getting doctor's appointments"""
        doctor_tok, doctor_id = doctor_token
        
        # Create appointment
        client.post(
            "/appointments",
            json={
                "doctor_id": doctor_id,
                "appointment_date": "2025-04-10",
                "time_slot": "10:00",
                "reason": "Checkup"
            },
            headers={"Authorization": f"Bearer {patient_token}"}
        )
        
        # Get doctor appointments
        response = client.get(
            "/appointments/doctor",
            headers={"Authorization": f"Bearer {doctor_tok}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1


class TestCancelAppointment:
    """Test appointment cancellation"""

    def test_cancel_appointment_success(self, patient_token, doctor_token):
        """Test successful appointment cancellation"""
        doctor_tok, doctor_id = doctor_token
        
        # Create appointment
        create_response = client.post(
            "/appointments",
            json={
                "doctor_id": doctor_id,
                "appointment_date": "2025-04-10",
                "time_slot": "10:00",
                "reason": "Checkup"
            },
            headers={"Authorization": f"Bearer {patient_token}"}
        )
        appointment_id = create_response.json()["id"]
        
        # Cancel appointment
        response = client.put(
            f"/appointments/{appointment_id}/cancel",
            json={"reason": "Personal reason"},
            headers={"Authorization": f"Bearer {patient_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cancelled"
        assert data["cancel_reason"] == "Personal reason"

    def test_cancel_completed_appointment_fails(self, patient_token, doctor_token):
        """Test cancelling completed appointment"""
        doctor_tok, doctor_id = doctor_token
        
        # Create appointment
        create_response = client.post(
            "/appointments",
            json={
                "doctor_id": doctor_id,
                "appointment_date": "2025-04-10",
                "time_slot": "10:00",
                "reason": "Checkup"
            },
            headers={"Authorization": f"Bearer {patient_token}"}
        )
        appointment_id = create_response.json()["id"]
        
        # Mark as completed
        client.put(
            f"/appointments/{appointment_id}/complete",
            headers={"Authorization": f"Bearer {doctor_tok}"}
        )
        
        # Try to cancel
        response = client.put(
            f"/appointments/{appointment_id}/cancel",
            json={"reason": "Should fail"},
            headers={"Authorization": f"Bearer {patient_token}"}
        )

        assert response.status_code == 400


class TestCompleteAppointment:
    """Test completing appointments"""

    def test_complete_appointment_success(self, patient_token, doctor_token):
        """Test successful appointment completion"""
        doctor_tok, doctor_id = doctor_token
        
        # Create appointment
        create_response = client.post(
            "/appointments",
            json={
                "doctor_id": doctor_id,
                "appointment_date": "2025-04-10",
                "time_slot": "10:00",
                "reason": "Checkup"
            },
            headers={"Authorization": f"Bearer {patient_token}"}
        )
        appointment_id = create_response.json()["id"]
        
        # Complete appointment
        response = client.put(
            f"/appointments/{appointment_id}/complete",
            headers={"Authorization": f"Bearer {doctor_tok}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
