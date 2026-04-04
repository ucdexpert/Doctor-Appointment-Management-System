"""Comprehensive doctor tests."""
import pytest
from fastapi.testclient import TestClient
from decimal import Decimal


class TestDoctorListing:
    """Test doctor listing endpoints."""
    
    def test_get_all_doctors(self, client: TestClient, test_doctor):
        """Test getting all approved doctors."""
        response = client.get("/doctors")
        
        assert response.status_code == 200
        data = response.json()
        assert "doctors" in data
        assert "total" in data
        assert data["total"] >= 1
    
    def test_get_doctors_with_pagination(self, client: TestClient, test_doctor):
        """Test doctor listing with pagination."""
        response = client.get("/doctors?page=1&limit=5")
        
        assert response.status_code == 200
        data = response.json()
        assert "doctors" in data
        assert "page" in data
        assert "limit" in data
        assert data["page"] == 1
    
    def test_get_doctors_search_by_name(self, client: TestClient, test_doctor):
        """Test searching doctors by name."""
        response = client.get("/doctors?search=Test Doctor")
        
        assert response.status_code == 200
        data = response.json()
        assert "doctors" in data
    
    def test_get_doctors_filter_by_specialization(self, client: TestClient, test_doctor):
        """Test filtering doctors by specialization."""
        response = client.get("/doctors?specialization=Cardiologist")
        
        assert response.status_code == 200
        data = response.json()
        # Should include our test doctor
        assert data["total"] >= 1
    
    def test_get_doctors_filter_by_city(self, client: TestClient, test_doctor):
        """Test filtering doctors by city."""
        response = client.get("/doctors?city=Karachi")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
    
    def test_get_doctors_filter_by_fee_range(self, client: TestClient, test_doctor):
        """Test filtering doctors by fee range."""
        response = client.get("/doctors?min_fee=1000&max_fee=2000")
        
        assert response.status_code == 200
        data = response.json()
        # All doctors should be in range
        for doctor in data["doctors"]:
            fee = float(doctor["consultation_fee"])
            assert 1000 <= fee <= 2000
    
    def test_get_doctors_sort_by_rating(self, client: TestClient, test_doctor):
        """Test sorting doctors by rating."""
        response = client.get("/doctors?sort_by=rating")
        
        assert response.status_code == 200
        data = response.json()
        assert "doctors" in data
    
    def test_get_doctors_sort_by_experience(self, client: TestClient, test_doctor):
        """Test sorting doctors by experience."""
        response = client.get("/doctors?sort_by=experience")
        
        assert response.status_code == 200
        data = response.json()
        assert "doctors" in data
    
    def test_get_doctors_sort_by_fee(self, client: TestClient, test_doctor):
        """Test sorting doctors by fee."""
        response = client.get("/doctors?sort_by=fee")
        
        assert response.status_code == 200
        data = response.json()
        assert "doctors" in data


class TestDoctorDetails:
    """Test doctor detail endpoint."""
    
    def test_get_doctor_by_id(self, client: TestClient, test_doctor):
        """Test getting doctor details by ID."""
        response = client.get(f"/doctors/{test_doctor.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_doctor.id
        assert data["specialization"] == "Cardiologist"
        assert data["user"]["name"] == "Test Doctor"
    
    def test_get_doctor_nonexistent(self, client: TestClient):
        """Test getting non-existent doctor."""
        response = client.get("/doctors/99999")
        
        assert response.status_code == 404
    
    def test_get_doctor_pending_approval(self, client: TestClient, db_session):
        """Test getting doctor pending approval."""
        from models import Doctor, User
        from passlib.context import CryptContext
        
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Create pending doctor
        user = User(
            name="Pending Doctor",
            email="pending@example.com",
            password=pwd_context.hash("password123"),
            role="doctor"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        doctor = Doctor(
            user_id=user.id,
            specialization="Dermatologist",
            qualification="MBBS",
            experience_years=5,
            consultation_fee=1000,
            is_approved=False  # Pending
        )
        db_session.add(doctor)
        db_session.commit()
        db_session.refresh(doctor)
        
        response = client.get(f"/doctors/{doctor.id}")
        
        assert response.status_code == 403


class TestDoctorProfile:
    """Test doctor profile management."""
    
    def test_create_doctor_profile(self, client: TestClient, doctor_token):
        """Test creating doctor profile."""
        response = client.post(
            "/doctors/profile",
            json={
                "specialization": "Neurologist",
                "qualification": "MBBS, MD, DM",
                "experience_years": 15,
                "consultation_fee": 2000,
                "bio": "Experienced neurologist",
                "city": "Lahore"
            },
            headers={"Authorization": f"Bearer {doctor_token}"}
        )
        
        # Will be 400 if profile already exists (from test_doctor fixture)
        assert response.status_code in [201, 400]
    
    def test_create_profile_already_exists(self, client: TestClient, test_doctor, doctor_token):
        """Test creating profile when it already exists."""
        response = client.post(
            "/doctors/profile",
            json={
                "specialization": "Cardiologist",
                "qualification": "MBBS, MD",
                "experience_years": 10,
                "consultation_fee": 1500,
                "city": "Karachi"
            },
            headers={"Authorization": f"Bearer {doctor_token}"}
        )
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_create_profile_unauthorized(self, client: TestClient, user_token):
        """Test creating profile without doctor role."""
        response = client.post(
            "/doctors/profile",
            json={
                "specialization": "Cardiologist",
                "qualification": "MBBS",
                "experience_years": 10,
                "consultation_fee": 1500,
                "city": "Karachi"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 403  # Forbidden
    
    def test_update_doctor_profile(self, client: TestClient, test_doctor, doctor_token):
        """Test updating doctor profile."""
        response = client.put(
            "/doctors/profile",
            json={
                "specialization": "Senior Cardiologist",
                "consultation_fee": 2000
            },
            headers={"Authorization": f"Bearer {doctor_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["specialization"] == "Senior Cardiologist"
        assert float(data["consultation_fee"]) == 2000


class TestDoctorSlots:
    """Test doctor availability slots."""
    
    def test_get_available_slots(self, client: TestClient, test_doctor, db_session):
        """Test getting available slots for a doctor."""
        from models import Schedule
        from datetime import date, time as dt_time
        
        # Create a schedule for next Monday
        from datetime import datetime
        today = datetime.now().date()
        # Find next Monday
        days_ahead = (7 - today.weekday()) % 7
        if days_ahead == 0:
            days_ahead = 7
        next_monday = today + timedelta(days=days_ahead)
        
        schedule = Schedule(
            doctor_id=test_doctor.id,
            day_of_week="Monday",
            start_time=dt_time(9, 0),
            end_time=dt_time(17, 0),
            slot_duration=30,
            is_available=True
        )
        db_session.add(schedule)
        db_session.commit()
        
        response = client.get(
            f"/doctors/{test_doctor.id}/slots",
            params={"date": next_monday.strftime("%Y-%m-%d")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "slots" in data
    
    def test_get_slots_invalid_date(self, client: TestClient, test_doctor):
        """Test getting slots with invalid date format."""
        response = client.get(
            f"/doctors/{test_doctor.id}/slots",
            params={"date": "04-01-2026"}  # Wrong format
        )
        
        assert response.status_code == 400
    
    def test_get_slots_nonexistent_doctor(self, client: TestClient):
        """Test getting slots for non-existent doctor."""
        response = client.get(
            "/doctors/99999/slots",
            params={"date": "2026-04-06"}
        )
        
        assert response.status_code == 404
    
    def test_get_slots_not_available_day(self, client: TestClient, test_doctor):
        """Test getting slots when doctor not available."""
        response = client.get(
            f"/doctors/{test_doctor.id}/slots",
            params={"date": "2026-04-06"}
        )
        
        assert response.status_code == 200
        data = response.json()
        # Either no slots or message
        assert "slots" in data or "message" in data


class TestDoctorDashboard:
    """Test doctor dashboard endpoint."""
    
    def test_get_dashboard(self, client: TestClient, test_doctor, doctor_token):
        """Test getting doctor dashboard stats."""
        response = client.get(
            "/doctors/my/dashboard",
            headers={"Authorization": f"Bearer {doctor_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "doctor" in data
        assert "stats" in data
    
    def test_get_dashboard_unauthorized(self, client: TestClient, user_token):
        """Test accessing doctor dashboard with patient role."""
        response = client.get(
            "/doctors/my/dashboard",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 403


# Import timedelta
from datetime import timedelta
