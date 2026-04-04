"""Comprehensive authentication tests."""
import pytest
from fastapi.testclient import TestClient


class TestRegistration:
    """Test user registration endpoints."""
    
    def test_register_patient_success(self, client: TestClient):
        """Test successful patient registration."""
        response = client.post("/auth/register", json={
            "name": "New Patient",
            "email": "newpatient@example.com",
            "password": "securepassword123",
            "role": "patient",
            "phone": "+923001234567"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data
        assert data["user"]["email"] == "newpatient@example.com"
        assert data["user"]["role"] == "patient"
    
    def test_register_doctor_success(self, client: TestClient):
        """Test successful doctor registration."""
        response = client.post("/auth/register", json={
            "name": "New Doctor",
            "email": "newdoctor@example.com",
            "password": "securepassword123",
            "role": "doctor",
            "phone": "+923001234568"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["role"] == "doctor"
    
    def test_register_admin_success(self, client: TestClient):
        """Test successful admin registration."""
        response = client.post("/auth/register", json={
            "name": "New Admin",
            "email": "newadmin@example.com",
            "password": "securepassword123",
            "role": "admin"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["role"] == "admin"
    
    def test_register_duplicate_email(self, client: TestClient, test_user):
        """Test registration with duplicate email."""
        response = client.post("/auth/register", json={
            "name": "Another User",
            "email": "test@example.com",  # Already exists
            "password": "securepassword123",
            "role": "patient"
        })
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_register_weak_password(self, client: TestClient):
        """Test registration with weak password."""
        response = client.post("/auth/register", json={
            "name": "Weak User",
            "email": "weak@example.com",
            "password": "123",  # Too short
            "role": "patient"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_register_invalid_email(self, client: TestClient):
        """Test registration with invalid email."""
        response = client.post("/auth/register", json={
            "name": "Invalid User",
            "email": "not-an-email",
            "password": "securepassword123",
            "role": "patient"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_register_invalid_role(self, client: TestClient):
        """Test registration with invalid role."""
        response = client.post("/auth/register", json={
            "name": "Invalid Role User",
            "email": "invalidrole@example.com",
            "password": "securepassword123",
            "role": "superadmin"  # Invalid role
        })
        
        assert response.status_code == 422  # Validation error


class TestLogin:
    """Test login endpoint."""
    
    def test_login_success(self, client: TestClient, test_user):
        """Test successful login."""
        response = client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data
        assert data["user"]["email"] == "test@example.com"
    
    def test_login_wrong_password(self, client: TestClient, test_user):
        """Test login with wrong password."""
        response = client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent user."""
        response = client.post("/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "password123"
        })
        
        assert response.status_code == 401
    
    def test_login_banned_user(self, client: TestClient, db_session):
        """Test login with banned user."""
        from models import User
        from passlib.context import CryptContext
        
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        user = User(
            name="Banned User",
            email="banned@example.com",
            password=pwd_context.hash("password123"),
            role="patient",
            is_banned=True
        )
        db_session.add(user)
        db_session.commit()
        
        response = client.post("/auth/login", json={
            "email": "banned@example.com",
            "password": "password123"
        })
        
        assert response.status_code == 403
        assert "banned" in response.json()["detail"].lower()


class TestTokenRefresh:
    """Test token refresh endpoint."""
    
    def test_refresh_token_success(self, client: TestClient, test_user, user_token):
        """Test successful token refresh."""
        # First, get refresh token from login
        login_response = client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword123"
        })
        refresh_token = login_response.json()["refresh_token"]
        
        # Use refresh token
        response = client.post("/auth/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == "test@example.com"
    
    def test_refresh_token_invalid(self, client: TestClient):
        """Test refresh with invalid token."""
        response = client.post("/auth/refresh", json={
            "refresh_token": "invalid_token_here"
        })
        
        assert response.status_code == 401
    
    def test_refresh_token_missing(self, client: TestClient):
        """Test refresh without token."""
        response = client.post("/auth/refresh", json={})
        
        assert response.status_code == 400
        assert "required" in response.json()["detail"].lower()


class TestUserProfile:
    """Test user profile endpoints."""
    
    def test_get_current_user(self, client: TestClient, user_token):
        """Test getting current user profile."""
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test Patient"
    
    def test_get_current_user_no_token(self, client: TestClient):
        """Test getting current user without token."""
        response = client.get("/auth/me")
        
        assert response.status_code == 401
    
    def test_update_profile(self, client: TestClient, user_token):
        """Test updating user profile."""
        response = client.put(
            "/auth/profile",
            json={"name": "Updated Name", "phone": "+923009876543"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["phone"] == "+923009876543"
    
    def test_change_password_success(self, client: TestClient, user_token):
        """Test successful password change."""
        response = client.put(
            "/auth/change-password",
            json={
                "old_password": "testpassword123",
                "new_password": "newpassword123"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200
        assert "successful" in response.json()["message"].lower()
    
    def test_change_password_wrong_old(self, client: TestClient, user_token):
        """Test password change with wrong old password."""
        response = client.put(
            "/auth/change-password",
            json={
                "old_password": "wrongpassword",
                "new_password": "newpassword123"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 400


class TestPasswordReset:
    """Test password reset endpoints."""
    
    def test_forgot_password_existing_user(self, client: TestClient):
        """Test forgot password for existing user."""
        response = client.post("/auth/forgot-password", json={
            "email": "test@example.com"
        })
        
        # Should always return success (security best practice)
        assert response.status_code == 200
        assert "reset email sent" in response.json()["message"].lower()
    
    def test_forgot_password_nonexistent_user(self, client: TestClient):
        """Test forgot password for non-existent user."""
        response = client.post("/auth/forgot-password", json={
            "email": "nonexistent@example.com"
        })
        
        # Should still return success (don't reveal if email exists)
        assert response.status_code == 200
    
    def test_reset_password_success(self, client: TestClient, db_session):
        """Test successful password reset with token."""
        from models import User
        from datetime import datetime, timedelta
        import secrets
        
        # Create user with reset token
        user = db_session.query(User).filter(User.email == "test@example.com").first()
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
        db_session.commit()
        
        response = client.post("/auth/reset-password", json={
            "token": reset_token,
            "new_password": "newresetpassword123"
        })
        
        assert response.status_code == 200
        assert "successful" in response.json()["message"].lower()
    
    def test_reset_password_invalid_token(self, client: TestClient):
        """Test password reset with invalid token."""
        response = client.post("/auth/reset-password", json={
            "token": "invalid_token",
            "new_password": "newpassword123"
        })
        
        assert response.status_code == 400
    
    def test_reset_password_weak_password(self, client: TestClient):
        """Test password reset with weak password."""
        response = client.post("/auth/reset-password", json={
            "token": "some_token",
            "new_password": "123"  # Too short
        })
        
        assert response.status_code == 400
