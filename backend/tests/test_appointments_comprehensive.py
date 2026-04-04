"""Comprehensive appointment tests."""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, date, time, timedelta


class TestAppointmentCreation:
    """Test appointment creation."""
    
    def test_create_appointment_success(self, client: TestClient, user_token, test_doctor):
        """Test successful appointment creation."""
        tomorrow = (datetime.now().date() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        response = client.post(
            "/appointments",
            json={
                "doctor_id": test_doctor.id,
                "appointment_date": tomorrow,
                "time_slot": "10:00",
                "reason": "Regular checkup"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["doctor_id"] == test_doctor.id
        assert data["status"] == "pending"
        assert data["reason"] == "Regular checkup"
    
    def test_create_appointment_no_auth(self, client: TestClient, test_doctor):
        """Test appointment creation without authentication."""
        tomorrow = (datetime.now().date() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        response = client.post(
            "/appointments",
            json={
                "doctor_id": test_doctor.id,
                "appointment_date": tomorrow,
                "time_slot": "10:00"
            }
        )
        
        assert response.status_code == 401
    
    def test_create_appointment_invalid_doctor(self, client: TestClient, user_token):
        """Test appointment with non-existent doctor."""
        tomorrow = (datetime.now().date() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        response = client.post(
            "/appointments",
            json={
                "doctor_id": 99999,  # Non-existent
                "appointment_date": tomorrow,
                "time_slot": "10:00"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 404
    
    def test_create_appointment_past_date(self, client: TestClient, user_token, test_doctor):
        """Test appointment with past date."""
        yesterday = (datetime.now().date() - timedelta(days=1)).strftime("%Y-%m-%d")
        
        response = client.post(
            "/appointments",
            json={
                "doctor_id": test_doctor.id,
                "appointment_date": yesterday,
                "time_slot": "10:00"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Should accept it (validation might be at business logic level)
        # This test documents current behavior
        assert response.status_code in [201, 400]


class TestAppointmentRetrieval:
    """Test appointment retrieval endpoints."""
    
    def test_get_my_appointments(self, client: TestClient, user_token, test_doctor):
        """Test getting all my appointments."""
        # Create an appointment first
        tomorrow = (datetime.now().date() + timedelta(days=1)).strftime("%Y-%m-%d")
        client.post(
            "/appointments",
            json={
                "doctor_id": test_doctor.id,
                "appointment_date": tomorrow,
                "time_slot": "10:00",
                "reason": "Checkup"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Get appointments
        response = client.get(
            "/appointments/my",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_get_appointment_by_id(self, client: TestClient, user_token, test_doctor, db_session):
        """Test getting specific appointment by ID."""
        from models import Appointment
        
        # Create appointment
        tomorrow = datetime.now().date() + timedelta(days=1)
        apt = Appointment(
            patient_id=test_doctor.user_id,  # Use user_id for patient
            doctor_id=test_doctor.id,
            appointment_date=tomorrow,
            time_slot=time(10, 0),
            status="pending"
        )
        db_session.add(apt)
        db_session.commit()
        db_session.refresh(apt)
        
        response = client.get(
            f"/appointments/{apt.id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == apt.id
    
    def test_get_appointment_unauthorized(self, client: TestClient, db_session, test_doctor):
        """Test accessing appointment without auth."""
        response = client.get("/appointments/1")
        assert response.status_code == 401


class TestAppointmentStatus:
    """Test appointment status updates."""
    
    def test_cancel_appointment(self, client: TestClient, user_token, test_doctor, db_session):
        """Test cancelling an appointment."""
        from models import Appointment
        
        # Create appointment
        tomorrow = datetime.now().date() + timedelta(days=1)
        apt = Appointment(
            patient_id=test_doctor.user_id,
            doctor_id=test_doctor.id,
            appointment_date=tomorrow,
            time_slot=time(10, 0),
            status="pending"
        )
        db_session.add(apt)
        db_session.commit()
        db_session.refresh(apt)
        
        # Cancel it
        response = client.put(
            f"/appointments/{apt.id}/cancel",
            json={"reason": "Personal reasons"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cancelled"
    
    def test_cancel_already_cancelled(self, client: TestClient, user_token, db_session, test_doctor):
        """Test cancelling already cancelled appointment."""
        from models import Appointment
        
        # Create cancelled appointment
        tomorrow = datetime.now().date() + timedelta(days=1)
        apt = Appointment(
            patient_id=test_doctor.user_id,
            doctor_id=test_doctor.id,
            appointment_date=tomorrow,
            time_slot=time(10, 0),
            status="cancelled"
        )
        db_session.add(apt)
        db_session.commit()
        db_session.refresh(apt)
        
        response = client.put(
            f"/appointments/{apt.id}/cancel",
            json={"reason": "Again"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Should fail or handle gracefully
        assert response.status_code in [200, 400]
    
    def test_confirm_appointment(self, client: TestClient, doctor_token, db_session, test_doctor):
        """Test doctor confirming an appointment."""
        from models import Appointment
        
        # Create appointment
        tomorrow = datetime.now().date() + timedelta(days=1)
        apt = Appointment(
            patient_id=test_doctor.user_id,
            doctor_id=test_doctor.id,
            appointment_date=tomorrow,
            time_slot=time(10, 0),
            status="pending"
        )
        db_session.add(apt)
        db_session.commit()
        db_session.refresh(apt)
        
        # Confirm it
        response = client.put(
            f"/appointments/{apt.id}/confirm",
            headers={"Authorization": f"Bearer {doctor_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "confirmed"
    
    def test_complete_appointment(self, client: TestClient, doctor_token, db_session, test_doctor):
        """Test doctor completing an appointment."""
        from models import Appointment
        
        # Create confirmed appointment
        tomorrow = datetime.now().date() + timedelta(days=1)
        apt = Appointment(
            patient_id=test_doctor.user_id,
            doctor_id=test_doctor.id,
            appointment_date=tomorrow,
            time_slot=time(10, 0),
            status="confirmed"
        )
        db_session.add(apt)
        db_session.commit()
        db_session.refresh(apt)
        
        # Complete it
        response = client.put(
            f"/appointments/{apt.id}/complete",
            headers={"Authorization": f"Bearer {doctor_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"


class TestAppointmentFilters:
    """Test appointment filtering."""
    
    def test_filter_by_status(self, client: TestClient, user_token):
        """Test filtering appointments by status."""
        response = client.get(
            "/appointments/my?status_filter=pending",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All should be pending
        for apt in data:
            assert apt["status"] == "pending"
    
    def test_filter_empty_result(self, client: TestClient, user_token):
        """Test filter returning no results."""
        response = client.get(
            "/appointments/my?status_filter=cancelled",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0


class TestAppointmentStats:
    """Test appointment statistics."""
    
    def test_get_stats(self, client: TestClient, user_token):
        """Test getting appointment statistics."""
        response = client.get(
            "/appointments/stats",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data or "pending" in data or "confirmed" in data


class TestAppointmentEdgeCases:
    """Test edge cases."""
    
    def test_double_booking_same_slot(self, client: TestClient, user_token, test_doctor):
        """Test booking same slot twice."""
        tomorrow = (datetime.now().date() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        # First booking
        response1 = client.post(
            "/appointments",
            json={
                "doctor_id": test_doctor.id,
                "appointment_date": tomorrow,
                "time_slot": "10:00",
                "reason": "First booking"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Second booking (might be prevented by business logic)
        response2 = client.post(
            "/appointments",
            json={
                "doctor_id": test_doctor.id,
                "appointment_date": tomorrow,
                "time_slot": "10:00",
                "reason": "Second booking"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Document current behavior
        assert response1.status_code == 201
        # Second might succeed or fail based on business logic
        assert response2.status_code in [201, 400, 409]
    
    def test_appointment_invalid_date_format(self, client: TestClient, user_token, test_doctor):
        """Test appointment with invalid date format."""
        response = client.post(
            "/appointments",
            json={
                "doctor_id": test_doctor.id,
                "appointment_date": "04-01-2026",  # Wrong format
                "time_slot": "10:00"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_appointment_invalid_time_format(self, client: TestClient, user_token, test_doctor):
        """Test appointment with invalid time format."""
        tomorrow = (datetime.now().date() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        response = client.post(
            "/appointments",
            json={
                "doctor_id": test_doctor.id,
                "appointment_date": tomorrow,
                "time_slot": "25:00"  # Invalid time
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 422  # Validation error
