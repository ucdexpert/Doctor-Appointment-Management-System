"""Test configuration and fixtures."""
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from datetime import datetime

# Set test environment variables
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test_secret_key_for_testing"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"
os.environ["REFRESH_TOKEN_EXPIRE_DAYS"] = "7"
os.environ["ENVIRONMENT"] = "testing"

# Import after setting env vars
from database import Base, get_db
from main import app
from models import User
from utils.jwt import create_access_token

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create test database tables before tests and drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    # Clean up test file
    if os.path.exists("./test.db"):
        os.remove("./test.db")


@pytest.fixture
def db_session():
    """Create a new database session for each test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    """Create test client with overridden database dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    """Create a test patient user."""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    user = User(
        name="Test Patient",
        email="test@example.com",
        password=pwd_context.hash("testpassword123"),
        role="patient",
        phone="+923001234567",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_doctor(db_session):
    """Create a test doctor user."""
    from passlib.context import CryptContext
    from models import Doctor
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Create user
    user = User(
        name="Test Doctor",
        email="doctor@example.com",
        password=pwd_context.hash("testpassword123"),
        role="doctor",
        phone="+923001234568",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Create doctor profile
    doctor = Doctor(
        user_id=user.id,
        specialization="Cardiologist",
        qualification="MBBS, MD",
        experience_years=10,
        consultation_fee=1500,
        bio="Experienced cardiologist",
        city="Karachi",
        is_approved=True
    )
    db_session.add(doctor)
    db_session.commit()
    db_session.refresh(doctor)
    return doctor


@pytest.fixture
def test_admin(db_session):
    """Create a test admin user."""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    user = User(
        name="Test Admin",
        email="admin@example.com",
        password=pwd_context.hash("adminpassword123"),
        role="admin",
        phone="+923001234569",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def user_token(test_user):
    """Create JWT token for test user."""
    return create_access_token(data={"sub": test_user.id})


@pytest.fixture
def doctor_token(test_doctor):
    """Create JWT token for test doctor."""
    return create_access_token(data={"sub": test_doctor.user_id})


@pytest.fixture
def admin_token(test_admin):
    """Create JWT token for test admin."""
    return create_access_token(data={"sub": test_admin.id})
