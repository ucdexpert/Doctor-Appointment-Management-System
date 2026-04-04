"""Admin endpoint tests."""
import pytest
from fastapi.testclient import TestClient


class TestAdminDoctorApproval:
    """Test admin doctor approval endpoints."""
    
    def test_get_pending_doctors(self, client: TestClient, admin_token, db_session):
        """Test getting pending doctors."""
        from models import Doctor, User
        from passlib.context import CryptContext
        
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Create pending doctor
        user = User(
            name="Pending Doctor",
            email="pending2@example.com",
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
            is_approved=False
        )
        db_session.add(doctor)
        db_session.commit()
        
        response = client.get(
            "/admin/doctors/pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_approve_doctor(self, client: TestClient, admin_token, db_session):
        """Test approving a doctor."""
        from models import Doctor, User
        from passlib.context import CryptContext
        
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Create pending doctor
        user = User(
            name="To Approve",
            email="toapprove@example.com",
            password=pwd_context.hash("password123"),
            role="doctor"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        doctor = Doctor(
            user_id=user.id,
            specialization="Orthopedic",
            qualification="MBBS, MS",
            experience_years=8,
            consultation_fee=1200,
            is_approved=False
        )
        db_session.add(doctor)
        db_session.commit()
        db_session.refresh(doctor)
        
        response = client.put(
            f"/admin/doctors/{doctor.id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        # Verify doctor is now approved
        db_session.refresh(doctor)
        assert doctor.is_approved == True
    
    def test_reject_doctor(self, client: TestClient, admin_token, db_session):
        """Test rejecting a doctor."""
        from models import Doctor, User
        from passlib.context import CryptContext
        
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Create pending doctor
        user = User(
            name="To Reject",
            email="toreject@example.com",
            password=pwd_context.hash("password123"),
            role="doctor"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        doctor = Doctor(
            user_id=user.id,
            specialization="Pediatrician",
            qualification="MBBS",
            experience_years=3,
            consultation_fee=800,
            is_approved=False
        )
        db_session.add(doctor)
        db_session.commit()
        db_session.refresh(doctor)
        
        response = client.put(
            f"/admin/doctors/{doctor.id}/reject",
            json={"reason": "Incomplete documentation"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200


class TestAdminUserManagement:
    """Test admin user management endpoints."""
    
    def test_get_all_users(self, client: TestClient, admin_token):
        """Test getting all users."""
        response = client.get(
            "/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_users_filter_by_role(self, client: TestClient, admin_token):
        """Test filtering users by role."""
        response = client.get(
            "/admin/users?role=patient",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        # All should be patients
        for user in data:
            assert user["role"] == "patient"
    
    def test_ban_user(self, client: TestClient, admin_token, db_session):
        """Test banning a user."""
        from models import User
        from passlib.context import CryptContext
        
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Create user to ban
        user = User(
            name="To Ban",
            email="toban@example.com",
            password=pwd_context.hash("password123"),
            role="patient"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        response = client.put(
            f"/admin/users/{user.id}/ban",
            json={"reason": "Violation of terms"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        # Verify user is banned
        db_session.refresh(user)
        assert user.is_banned == True
    
    def test_unban_user(self, client: TestClient, admin_token, db_session):
        """Test unbanning a user."""
        from models import User
        from passlib.context import CryptContext
        
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Create banned user
        user = User(
            name="To Unban",
            email="tounban@example.com",
            password=pwd_context.hash("password123"),
            role="patient",
            is_banned=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        response = client.put(
            f"/admin/users/{user.id}/unban",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        # Verify user is unbanned
        db_session.refresh(user)
        assert user.is_banned == False


class TestAdminStats:
    """Test admin statistics endpoint."""
    
    def test_get_stats(self, client: TestClient, admin_token):
        """Test getting admin statistics."""
        response = client.get(
            "/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        # Should contain various stats
        assert isinstance(data, dict)


class TestAdminAuthorization:
    """Test admin endpoint authorization."""
    
    def test_access_admin_endpoint_as_patient(self, client: TestClient, user_token):
        """Test accessing admin endpoint as patient."""
        response = client.get(
            "/admin/users",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 403
    
    def test_access_admin_endpoint_as_doctor(self, client: TestClient, doctor_token):
        """Test accessing admin endpoint as doctor."""
        response = client.get(
            "/admin/users",
            headers={"Authorization": f"Bearer {doctor_token}"}
        )
        
        assert response.status_code == 403
    
    def test_access_admin_endpoint_without_auth(self, client: TestClient):
        """Test accessing admin endpoint without authentication."""
        response = client.get("/admin/users")
        
        assert response.status_code == 401
