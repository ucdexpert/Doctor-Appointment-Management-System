"""
Test Authentication Endpoints
Run with: pytest tests/test_auth.py -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
import os

# Use SQLite for testing
TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


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


class TestUserRegistration:
    """Test user registration"""

    def test_register_patient_success(self):
        """Test successful patient registration"""
        response = client.post("/auth/register", json={
            "name": "Test Patient",
            "email": "patient@test.com",
            "password": "testpass123",
            "role": "patient",
            "phone": "1234567890"
        })

        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "patient@test.com"
        assert data["user"]["role"] == "patient"

    def test_register_doctor_success(self):
        """Test successful doctor registration"""
        response = client.post("/auth/register", json={
            "name": "Test Doctor",
            "email": "doctor@test.com",
            "password": "testpass123",
            "role": "doctor",
            "phone": "0987654321"
        })

        assert response.status_code == 201
        data = response.json()
        assert data["user"]["email"] == "doctor@test.com"
        assert data["user"]["role"] == "doctor"

    def test_register_duplicate_email_fails(self):
        """Test registration with duplicate email"""
        # First registration
        client.post("/auth/register", json={
            "name": "Test User",
            "email": "duplicate@test.com",
            "password": "testpass123",
            "role": "patient"
        })

        # Second registration with same email
        response = client.post("/auth/register", json={
            "name": "Another User",
            "email": "duplicate@test.com",
            "password": "testpass456",
            "role": "patient"
        })

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_invalid_email_fails(self):
        """Test registration with invalid email"""
        response = client.post("/auth/register", json={
            "name": "Test User",
            "email": "invalid-email",
            "password": "testpass123",
            "role": "patient"
        })

        assert response.status_code == 422  # Validation error


class TestUserLogin:
    """Test user login"""

    def test_login_success(self):
        """Test successful login"""
        # Register first
        client.post("/auth/register", json={
            "name": "Login Test",
            "email": "login@test.com",
            "password": "testpass123",
            "role": "patient"
        })

        # Login
        response = client.post("/auth/login", json={
            "email": "login@test.com",
            "password": "testpass123"
        })

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "login@test.com"

    def test_login_wrong_password_fails(self):
        """Test login with wrong password"""
        # Register first
        client.post("/auth/register", json={
            "name": "Login Test",
            "email": "wrongpass@test.com",
            "password": "correctpass",
            "role": "patient"
        })

        # Login with wrong password
        response = client.post("/auth/login", json={
            "email": "wrongpass@test.com",
            "password": "wrongpass"
        })

        assert response.status_code == 401

    def test_login_nonexistent_user_fails(self):
        """Test login with non-existent user"""
        response = client.post("/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "testpass123"
        })

        assert response.status_code == 401


class TestUserProfile:
    """Test user profile endpoints"""

    def test_get_current_user(self):
        """Test getting current user profile"""
        # Register and get token
        response = client.post("/auth/register", json={
            "name": "Profile Test",
            "email": "profile@test.com",
            "password": "testpass123",
            "role": "patient"
        })
        token = response.json()["access_token"]

        # Get current user
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "profile@test.com"
        assert data["name"] == "Profile Test"

    def test_get_user_without_token_fails(self):
        """Test accessing profile without token"""
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_update_profile(self):
        """Test updating user profile"""
        # Register and get token
        response = client.post("/auth/register", json={
            "name": "Original Name",
            "email": "update@test.com",
            "password": "testpass123",
            "role": "patient"
        })
        token = response.json()["access_token"]

        # Update profile
        response = client.put(
            "/auth/profile",
            json={"name": "Updated Name", "phone": "1234567890"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["phone"] == "1234567890"


class TestPasswordChange:
    """Test password change"""

    def test_change_password_success(self):
        """Test successful password change"""
        # Register and get token
        response = client.post("/auth/register", json={
            "name": "Password Change Test",
            "email": "changepass@test.com",
            "password": "oldpass123",
            "role": "patient"
        })
        token = response.json()["access_token"]

        # Change password
        response = client.put(
            "/auth/change-password",
            json={"old_password": "oldpass123", "new_password": "newpass456"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200

        # Login with new password
        response = client.post("/auth/login", json={
            "email": "changepass@test.com",
            "password": "newpass456"
        })

        assert response.status_code == 200

    def test_change_password_wrong_old(self):
        """Test password change with wrong old password"""
        # Register and get token
        response = client.post("/auth/register", json={
            "name": "Password Test",
            "email": "wrongold@test.com",
            "password": "correctold",
            "role": "patient"
        })
        token = response.json()["access_token"]

        # Change password with wrong old password
        response = client.put(
            "/auth/change-password",
            json={"old_password": "wrongold", "new_password": "newpass123"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 400
