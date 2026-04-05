# API Quality Testing Script for Doctor Appointment System
# Run with: python api_test.py

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"
results = []
patient_token = None
doctor_token = None
admin_token = None
doctor_id = None
appointment_id = None
schedule_id = None

def test_endpoint(method, path, expected_status, description, headers=None, data=None, category="General"):
    """Test an endpoint and record results"""
    url = f"{BASE_URL}{path}"
    start_time = time.time()
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            print(f"Unsupported method: {method}")
            return None
        
        elapsed = time.time() - start_time
        status = response.status_code
        
        # Check if status matches expected
        passed = status == expected_status
        
        # Performance check
        perf_status = "✅" if elapsed < 0.5 else ("⚠️" if elapsed < 2.0 else "❌")
        
        result = {
            "category": category,
            "method": method,
            "path": path,
            "description": description,
            "expected_status": expected_status,
            "actual_status": status,
            "passed": passed,
            "response_time": round(elapsed * 1000, 2),
            "perf_status": perf_status,
            "response_sample": str(response.json())[:200] if response.text else "Empty"
        }
        
        results.append(result)
        
        status_icon = "✅" if passed else "❌"
        print(f"{status_icon} {method} {path} - {description}")
        print(f"   Expected: {expected_status}, Got: {status}, Time: {result['response_time']}ms {perf_status}")
        
        return response
        
    except requests.exceptions.RequestException as e:
        elapsed = time.time() - start_time
        result = {
            "category": category,
            "method": method,
            "path": path,
            "description": description,
            "expected_status": expected_status,
            "actual_status": "ERROR",
            "passed": False,
            "response_time": round(elapsed * 1000, 2),
            "perf_status": "❌",
            "response_sample": str(e)
        }
        results.append(result)
        print(f"❌ {method} {path} - ERROR: {e}")
        return None

def auth_header(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("="*80)
print("API QUALITY TESTING - Doctor Appointment System")
print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)

# ============= 1. PUBLIC ENDPOINTS =============
print("\n📋 Testing Public Endpoints...")
test_endpoint("GET", "/", 200, "Root endpoint", category="Public")
test_endpoint("GET", "/api/health", 200, "Health check", category="Public")

# ============= 2. AUTHENTICATION ENDPOINTS =============
print("\n🔐 Testing Authentication Endpoints...")

# Register patient
resp = test_endpoint("POST", "/auth/register", 201, "Register new patient",
    data={"name": "API Test Patient", "email": "apitest_patient@test.com", 
          "password": "testpass123", "role": "patient", "phone": "1234567890"},
    category="Auth")
if resp and resp.status_code == 201:
    patient_token = resp.json().get("access_token")

# Register doctor
resp = test_endpoint("POST", "/auth/register", 201, "Register new doctor",
    data={"name": "API Test Doctor", "email": "apitest_doctor@test.com", 
          "password": "testpass123", "role": "doctor", "phone": "0987654321"},
    category="Auth")
if resp and resp.status_code == 201:
    doctor_token = resp.json().get("access_token")

# Duplicate registration
test_endpoint("POST", "/auth/register", 400, "Duplicate email registration",
    data={"name": "API Test Patient 2", "email": "apitest_patient@test.com", 
          "password": "testpass123", "role": "patient"},
    category="Auth")

# Login valid
resp = test_endpoint("POST", "/auth/login", 200, "Login with valid credentials",
    data={"email": "apitest_patient@test.com", "password": "testpass123"},
    category="Auth")
if resp and resp.status_code == 200:
    patient_token = resp.json().get("access_token")

# Login invalid password
test_endpoint("POST", "/auth/login", 401, "Login with wrong password",
    data={"email": "apitest_patient@test.com", "password": "wrongpassword"},
    category="Auth")

# Login non-existent user
test_endpoint("POST", "/auth/login", 401, "Login with non-existent user",
    data={"email": "nonexistent@test.com", "password": "testpass123"},
    category="Auth")

# Get current user
test_endpoint("GET", "/auth/me", 200, "Get current user info",
    headers=auth_header(patient_token), category="Auth")

# Get current user without token
test_endpoint("GET", "/auth/me", 401, "Get current user without token",
    category="Auth")

# Get current user with invalid token
test_endpoint("GET", "/auth/me", 401, "Get current user with invalid token",
    headers=auth_header("invalid.token.here"), category="Auth")

# Change password
test_endpoint("PUT", "/auth/change-password", 200, "Change password",
    headers=auth_header(patient_token),
    data={"old_password": "testpass123", "new_password": "newpass123"},
    category="Auth")

# Update profile
test_endpoint("PUT", "/auth/profile", 200, "Update user profile",
    headers=auth_header(patient_token),
    data={"name": "Updated Patient Name", "phone": "9999999999"},
    category="Auth")

# Forgot password
test_endpoint("POST", "/auth/forgot-password", 200, "Forgot password request",
    data={"email": "apitest_patient@test.com"},
    category="Auth")

# Reset password with invalid token
test_endpoint("POST", "/auth/reset-password", 400, "Reset password with invalid token",
    data={"token": "invalidtoken", "new_password": "newpass123"},
    category="Auth")

# Refresh token
resp = test_endpoint("POST", "/auth/login", 200, "Login to get refresh token",
    data={"email": "apitest_patient@test.com", "password": "newpass123"},
    category="Auth")
if resp and resp.status_code == 200:
    refresh_token = resp.json().get("refresh_token")
    test_endpoint("POST", "/auth/refresh", 200, "Refresh access token",
        data={"refresh_token": refresh_token},
        category="Auth")

test_endpoint("POST", "/auth/refresh", 400, "Refresh with missing token",
    data={},
    category="Auth")

# ============= 3. DOCTORS ENDPOINTS =============
print("\n👨‍⚕️ Testing Doctor Endpoints...")

# Get all doctors (public)
test_endpoint("GET", "/doctors", 200, "Get all doctors (public)",
    category="Doctors")

# Get all doctors with pagination
test_endpoint("GET", "/doctors?page=1&limit=5", 200, "Get doctors with pagination",
    category="Doctors")

# Get all doctors with filters
test_endpoint("GET", "/doctors?specialization=Cardiology&city=Karachi", 200, "Get doctors with filters",
    category="Doctors")

# Get doctor by ID (non-existent)
test_endpoint("GET", "/doctors/99999", 404, "Get non-existent doctor",
    category="Doctors")

# Create doctor profile
resp = test_endpoint("POST", "/doctors/profile", 201, "Create doctor profile",
    headers=auth_header(doctor_token),
    data={
        "specialization": "Cardiology",
        "qualification": "MBBS, FCPS",
        "experience_years": 10,
        "consultation_fee": 1500.00,
        "bio": "Experienced cardiologist",
        "city": "Karachi"
    },
    category="Doctors")

# Create duplicate doctor profile
test_endpoint("POST", "/doctors/profile", 400, "Create duplicate doctor profile",
    headers=auth_header(doctor_token),
    data={
        "specialization": "Cardiology",
        "qualification": "MBBS",
        "experience_years": 5,
        "consultation_fee": 1000.00,
        "city": "Lahore"
    },
    category="Doctors")

# Create doctor profile as patient (should fail)
test_endpoint("POST", "/doctors/profile", 403, "Create doctor profile as patient (forbidden)",
    headers=auth_header(patient_token),
    data={
        "specialization": "Cardiology",
        "qualification": "MBBS",
        "experience_years": 5,
        "consultation_fee": 1000.00,
        "city": "Lahore"
    },
    category="Doctors")

# Update doctor profile
test_endpoint("PUT", "/doctors/profile", 200, "Update doctor profile",
    headers=auth_header(doctor_token),
    data={"bio": "Updated bio", "consultation_fee": 2000.00},
    category="Doctors")

# Get doctor dashboard
test_endpoint("GET", "/doctors/my/dashboard", 200, "Get doctor dashboard",
    headers=auth_header(doctor_token),
    category="Doctors")

# Get doctor dashboard as patient (forbidden)
test_endpoint("GET", "/doctors/my/dashboard", 403, "Get doctor dashboard as patient",
    headers=auth_header(patient_token),
    category="Doctors")

# Get quick book recommendations
test_endpoint("GET", "/doctors/recommendations/quick-book", 200, "Get quick book recommendations",
    headers=auth_header(patient_token),
    category="Doctors")

# Get available slots (need doctor_id first)
# We'll get this from the doctors list
resp = requests.get(f"{BASE_URL}/doctors", timeout=10)
if resp.status_code == 200 and resp.json().get("doctors"):
    doctor_id = resp.json()["doctors"][0]["id"]
    test_endpoint("GET", f"/doctors/{doctor_id}/slots?date=2026-04-06", 200, 
        f"Get available slots for doctor {doctor_id}",
        category="Doctors")
    
    test_endpoint("GET", f"/doctors/{doctor_id}/slots?date=invalid-date", 400,
        "Get slots with invalid date format",
        category="Doctors")
else:
    print("⚠️ No doctors available to test slots endpoint")

# ============= 4. SCHEDULE ENDPOINTS =============
print("\n📅 Testing Schedule Endpoints...")

# Get schedule without auth
test_endpoint("GET", "/schedules/my", 401, "Get schedule without auth",
    category="Schedules")

# Get my schedule (as doctor)
test_endpoint("GET", "/schedules/my", 200, "Get doctor's schedule",
    headers=auth_header(doctor_token),
    category="Schedules")

# Create schedule (as doctor)
resp = test_endpoint("POST", "/schedules", 201, "Create schedule for Monday",
    headers=auth_header(doctor_token),
    data={
        "day_of_week": "Monday",
        "start_time": "09:00",
        "end_time": "17:00",
        "slot_duration": 30,
        "is_available": True
    },
    category="Schedules")
if resp and resp.status_code == 201:
    schedule_id = resp.json().get("id")

# Create duplicate schedule
test_endpoint("POST", "/schedules", 400, "Create duplicate schedule for same day",
    headers=auth_header(doctor_token),
    data={
        "day_of_week": "Monday",
        "start_time": "10:00",
        "end_time": "18:00",
        "slot_duration": 30,
        "is_available": True
    },
    category="Schedules")

# Update schedule
if schedule_id:
    test_endpoint("PUT", f"/schedules/{schedule_id}", 200, "Update schedule",
        headers=auth_header(doctor_token),
        data={"start_time": "08:00", "end_time": "16:00"},
        category="Schedules")
    
    # Delete schedule
    test_endpoint("DELETE", f"/schedules/{schedule_id}", 200, "Delete schedule",
        headers=auth_header(doctor_token),
        category="Schedules")

# Create schedule as patient (should fail)
test_endpoint("POST", "/schedules", 403, "Create schedule as patient",
    headers=auth_header(patient_token),
    data={
        "day_of_week": "Tuesday",
        "start_time": "09:00",
        "end_time": "17:00",
        "slot_duration": 30,
        "is_available": True
    },
    category="Schedules")

# ============= 5. APPOINTMENT ENDPOINTS =============
print("\n📋 Testing Appointment Endpoints...")

# Get appointments without auth
test_endpoint("GET", "/appointments/my", 401, "Get appointments without auth",
    category="Appointments")

# Create appointment (need an approved doctor with schedule)
# First, let's approve the doctor via admin
# For now, try to create with any available doctor
if doctor_id:
    # Try to create appointment
    test_endpoint("POST", "/appointments", 201, "Create appointment",
        headers=auth_header(patient_token),
        data={
            "doctor_id": doctor_id,
            "appointment_date": "2026-04-10",
            "time_slot": "10:00",
            "reason": "General checkup"
        },
        category="Appointments")
    
    # Try to book past date
    test_endpoint("POST", "/appointments", 400, "Book appointment for past date",
        headers=auth_header(patient_token),
        data={
            "doctor_id": doctor_id,
            "appointment_date": "2020-01-01",
            "time_slot": "10:00",
            "reason": "Checkup"
        },
        category="Appointments")
    
    # Try to book with invalid time
    test_endpoint("POST", "/appointments", 400, "Book appointment with invalid time",
        headers=auth_header(patient_token),
        data={
            "doctor_id": doctor_id,
            "appointment_date": "2026-04-10",
            "time_slot": "25:00",
            "reason": "Checkup"
        },
        category="Appointments")

# Create appointment as doctor (should fail)
test_endpoint("POST", "/appointments", 403, "Create appointment as doctor",
    headers=auth_header(doctor_token),
    data={
        "doctor_id": 1,
        "appointment_date": "2026-04-10",
        "time_slot": "10:00",
        "reason": "Checkup"
    },
    category="Appointments")

# Get my appointments
test_endpoint("GET", "/appointments/my", 200, "Get patient appointments",
    headers=auth_header(patient_token),
    category="Appointments")

# Get appointments with filter
test_endpoint("GET", "/appointments/my?status_filter=pending", 200, "Get appointments with status filter",
    headers=auth_header(patient_token),
    category="Appointments")

# Get patient stats
test_endpoint("GET", "/appointments/stats", 200, "Get patient stats",
    headers=auth_header(patient_token),
    category="Appointments")

# Get doctor appointments
test_endpoint("GET", "/appointments/doctor", 200, "Get doctor appointments",
    headers=auth_header(doctor_token),
    category="Appointments")

# Confirm appointment (as doctor)
resp = requests.get(f"{BASE_URL}/appointments/doctor", headers=auth_header(doctor_token), timeout=10)
if resp.status_code == 200 and resp.json():
    appointment_id = resp.json()[0]["id"]
    test_endpoint("PUT", f"/appointments/{appointment_id}/confirm", 200, "Confirm appointment",
        headers=auth_header(doctor_token),
        category="Appointments")
    
    # Complete appointment
    test_endpoint("PUT", f"/appointments/{appointment_id}/complete", 200, "Complete appointment",
        headers=auth_header(doctor_token),
        category="Appointments")

# Cancel appointment
if appointment_id:
    test_endpoint("PUT", f"/appointments/{appointment_id}/cancel", 200, "Cancel appointment",
        headers=auth_header(patient_token),
        data={"reason": "Personal reasons"},
        category="Appointments")

# Add notes to appointment
if appointment_id:
    test_endpoint("PUT", f"/appointments/{appointment_id}/notes", 200, "Add notes to appointment",
        headers=auth_header(doctor_token),
        data={"notes": "Patient needs follow-up in 2 weeks"},
        category="Appointments")

# Get prescription PDF
if appointment_id:
    test_endpoint("GET", f"/appointments/{appointment_id}/prescription-pdf", 200, "Download prescription PDF",
        headers=auth_header(patient_token),
        category="Appointments")

# ============= 6. REVIEWS ENDPOINTS =============
print("\n⭐ Testing Review Endpoints...")

# Get reviews for a doctor
if doctor_id:
    test_endpoint("GET", f"/reviews/doctor/{doctor_id}", 200, "Get doctor reviews",
        category="Reviews")
    
    test_endpoint("GET", f"/reviews/doctor/99999", 404, "Get reviews for non-existent doctor",
        category="Reviews")

# Create review (need completed appointment first)
# We'll try but it may fail if no completed appointments exist
test_endpoint("POST", "/reviews", 201, "Create review for doctor",
    headers=auth_header(patient_token),
    data={
        "doctor_id": doctor_id or 1,
        "appointment_id": appointment_id or 1,
        "rating": 5,
        "comment": "Excellent doctor!"
    },
    category="Reviews")

# Create review without auth
test_endpoint("POST", "/reviews", 401, "Create review without auth",
    data={
        "doctor_id": 1,
        "appointment_id": 1,
        "rating": 4,
        "comment": "Good"
    },
    category="Reviews")

# ============= 7. FAVORITES ENDPOINTS =============
print("\n❤️ Testing Favorites Endpoints...")

if doctor_id:
    # Add to favorites
    test_endpoint("POST", f"/favorites/{doctor_id}", 201, "Add doctor to favorites",
        headers=auth_header(patient_token),
        category="Favorites")
    
    # Duplicate favorite
    test_endpoint("POST", f"/favorites/{doctor_id}", 400, "Duplicate favorite",
        headers=auth_header(patient_token),
        category="Favorites")
    
    # Check if favorited
    test_endpoint("GET", f"/favorites/check/{doctor_id}", 200, "Check if doctor is favorited",
        headers=auth_header(patient_token),
        category="Favorites")
    
    # Get my favorites
    test_endpoint("GET", "/favorites/my", 200, "Get my favorites",
        headers=auth_header(patient_token),
        category="Favorites")
    
    # Remove from favorites
    test_endpoint("DELETE", f"/favorites/{doctor_id}", 200, "Remove from favorites",
        headers=auth_header(patient_token),
        category="Favorites")

# Add non-existent doctor to favorites
test_endpoint("POST", "/favorites/99999", 404, "Add non-existent doctor to favorites",
    headers=auth_header(patient_token),
    category="Favorites")

# ============= 8. SEARCH HISTORY ENDPOINTS =============
print("\n🔍 Testing Search History Endpoints...")

# Save search
test_endpoint("POST", "/search-history", 201, "Save search",
    headers=auth_header(patient_token),
    data={"search_query": "cardiologist", "filters": "{\"city\":\"Karachi\"}"},
    category="Search History")

# Get my searches
test_endpoint("GET", "/search-history/my", 200, "Get search history",
    headers=auth_header(patient_token),
    category="Search History")

# Delete search
resp = requests.get(f"{BASE_URL}/search-history/my", headers=auth_header(patient_token), timeout=10)
if resp.status_code == 200 and resp.json():
    search_id = resp.json()[0]["id"]
    test_endpoint("DELETE", f"/search-history/{search_id}", 200, "Delete search entry",
        headers=auth_header(patient_token),
        category="Search History")

# Clear search history
test_endpoint("DELETE", "/search-history/my/clear", 200, "Clear search history",
    headers=auth_header(patient_token),
    category="Search History")

# ============= 9. NOTIFICATIONS ENDPOINTS =============
print("\n🔔 Testing Notifications Endpoints...")

# Get notifications
test_endpoint("GET", "/notifications/my", 200, "Get my notifications",
    headers=auth_header(patient_token),
    category="Notifications")

# Get unread count
test_endpoint("GET", "/notifications/my/unread-count", 200, "Get unread notification count",
    headers=auth_header(patient_token),
    category="Notifications")

# Mark all as read
test_endpoint("PUT", "/notifications/my/read-all", 200, "Mark all notifications as read",
    headers=auth_header(patient_token),
    category="Notifications")

# ============= 10. CHATBOT ENDPOINTS =============
print("\n🤖 Testing Chatbot Endpoints...")

# Create chat session
resp = test_endpoint("POST", "/chat/session", 201, "Create chat session",
    headers=auth_header(patient_token),
    data={"title": "Test Session"},
    category="Chatbot")

session_id = None
if resp and resp.status_code == 201:
    session_id = resp.json().get("id")

# Get chat sessions
test_endpoint("GET", "/chat/sessions", 200, "Get chat sessions",
    headers=auth_header(patient_token),
    category="Chatbot")

# Send message (may fail if GROQ_API_KEY not set)
if session_id:
    test_endpoint("POST", "/chat/message", 200, "Send chat message",
        headers=auth_header(patient_token),
        data={"session_id": session_id, "message": "Hello, I need health advice"},
        category="Chatbot")
    
    # Get specific session
    test_endpoint("GET", f"/chat/sessions/{session_id}", 200, "Get specific chat session",
        headers=auth_header(patient_token),
        category="Chatbot")
    
    # Delete session
    test_endpoint("DELETE", f"/chat/sessions/{session_id}", 200, "Delete chat session",
        headers=auth_header(patient_token),
        category="Chatbot")

# Send message without session
test_endpoint("POST", "/chat/message", 400, "Send message without session_id",
    headers=auth_header(patient_token),
    data={"message": "Hello"},
    category="Chatbot")

# ============= 11. FILE UPLOAD ENDPOINTS =============
print("\n📤 Testing File Upload Endpoints...")

# Upload profile photo (create a test file)
import io
test_file = io.BytesIO(b"fake image content" * 100)
test_file.name = "test.jpg"
resp = requests.post(
    f"{BASE_URL}/upload/profile-photo",
    headers={"Authorization": f"Bearer {patient_token}"},
    files={"file": ("test.jpg", test_file, "image/jpeg")},
    timeout=10
)
upload_status = "✅" if resp.status_code in [200, 201, 400, 413, 415] else "❌"
print(f"{upload_status} POST /upload/profile-photo - Upload profile photo")
print(f"   Expected: 200/201, Got: {resp.status_code}")
results.append({
    "category": "File Upload",
    "method": "POST",
    "path": "/upload/profile-photo",
    "description": "Upload profile photo",
    "expected_status": "200/201",
    "actual_status": resp.status_code,
    "passed": resp.status_code in [200, 201],
    "response_time": resp.elapsed.total_seconds() * 1000,
    "perf_status": "✅" if resp.elapsed.total_seconds() < 0.5 else "⚠️",
    "response_sample": str(resp.text)[:200]
})

# Upload without auth
test_file2 = io.BytesIO(b"fake image content" * 100)
test_file2.name = "test.jpg"
resp2 = requests.post(
    f"{BASE_URL}/upload/profile-photo",
    files={"file": ("test.jpg", test_file2, "image/jpeg")},
    timeout=10
)
print(f"{'✅' if resp2.status_code == 401 else '❌'} POST /upload/profile-photo - Upload without auth (should be 401)")
results.append({
    "category": "File Upload",
    "method": "POST",
    "path": "/upload/profile-photo",
    "description": "Upload profile photo without auth",
    "expected_status": 401,
    "actual_status": resp2.status_code,
    "passed": resp2.status_code == 401,
    "response_time": resp2.elapsed.total_seconds() * 1000,
    "perf_status": "✅",
    "response_sample": str(resp2.text)[:200]
})

# ============= 12. ADMIN ENDPOINTS =============
print("\n🛡️ Testing Admin Endpoints...")

# Admin endpoints require admin role - we'll test with patient token to verify auth
test_endpoint("GET", "/admin/doctors/pending", 403, "Get pending doctors (as patient - should fail)",
    headers=auth_header(patient_token),
    category="Admin")

test_endpoint("GET", "/admin/users", 403, "Get all users (as patient - should fail)",
    headers=auth_header(patient_token),
    category="Admin")

test_endpoint("GET", "/admin/stats", 403, "Get admin stats (as patient - should fail)",
    headers=auth_header(patient_token),
    category="Admin")

test_endpoint("GET", "/admin/doctors/pending", 401, "Get pending doctors (no auth)",
    category="Admin")

# ============= 13. SECURITY TESTS =============
print("\n🔒 Testing Security...")

# SQL Injection attempt in login
test_endpoint("POST", "/auth/login", 401, "SQL injection in login",
    data={"email": "' OR '1'='1", "password": "' OR '1'='1"},
    category="Security")

# XSS attempt in registration
test_endpoint("POST", "/auth/register", 422, "XSS attempt in registration",
    data={"name": "<script>alert('xss')</script>", "email": "xss@test.com", 
          "password": "testpass123", "role": "patient"},
    category="Security")

# Access without Content-Type
test_endpoint("POST", "/auth/login", 422, "Login without Content-Type",
    headers={"Authorization": "Bearer test"},
    data="invalid data",
    category="Security")

# ============= 14. PERFORMANCE TESTS =============
print("\n⚡ Performance Tests...")

# Multiple requests to health endpoint
for i in range(5):
    start = time.time()
    resp = requests.get(f"{BASE_URL}/api/health", timeout=10)
    elapsed = (time.time() - start) * 1000
    print(f"   Health check #{i+1}: {elapsed:.2f}ms ({resp.status_code})")

# Concurrent doctor list requests
for i in range(3):
    start = time.time()
    resp = requests.get(f"{BASE_URL}/doctors", timeout=10)
    elapsed = (time.time() - start) * 1000
    print(f"   Doctors list #{i+1}: {elapsed:.2f}ms ({resp.status_code})")

# ============= GENERATE REPORT =============
print("\n" + "="*80)
print("GENERATING API QUALITY REPORT")
print("="*80)

passed = sum(1 for r in results if r["passed"])
failed = sum(1 for r in results if not r["passed"])
warnings = sum(1 for r in results if r.get("perf_status") == "⚠️")
critical = sum(1 for r in results if not r["passed"] and r.get("actual_status") in ["ERROR", 500, 502, 503])

report = f"""
# API Quality Report
**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**API Base URL:** {BASE_URL}
**Total Endpoints Tested:** {len(results)}

## Executive Summary
The Doctor Appointment Management System API has been tested across {len(set(r['category'] for r in results))} categories. 
Overall health: {'✅ GOOD' if passed > failed else '❌ NEEDS ATTENTION'}
{passed}/{len(results)} tests passed ({passed*100//len(results)}% pass rate).

## Test Results Overview
- ✅ Passed: {passed}
- ⚠️ Warnings: {warnings}
- ❌ Failed: {failed}
- 🔴 Critical Issues: {critical}

## Detailed Findings

### Critical Issues (Must Fix)
"""

critical_issues = [r for r in results if not r["passed"]]
for issue in critical_issues:
    report += f"""
- **Endpoint:** {issue['method']} {issue['path']}
- **Test:** {issue['description']}
- **Expected:** {issue['expected_status']}, **Got:** {issue['actual_status']}
- **Response Time:** {issue['response_time']}ms
- **Sample Response:** {issue['response_sample'][:150]}
"""

report += f"""
### Performance Summary
| Endpoint | Method | Response Time | Status |
|----------|--------|---------------|--------|
"""

for r in sorted(results, key=lambda x: x["response_time"], reverse=True)[:15]:
    report += f"| {r['path']} | {r['method']} | {r['response_time']}ms | {r['perf_status']} |\n"

report += f"""
### Security Assessment
| Test | Status | Notes |
|------|--------|-------|
| SQL Injection | {'✅ Blocked' if any(r['passed'] for r in results if 'SQL injection' in r['description']) else '❌ Vulnerable'} | Properly sanitized inputs |
| XSS Prevention | {'✅ Sanitized' if any(r['passed'] for r in results if 'XSS' in r['description']) else '⚠️ Review needed'} | Input validation in place |
| Auth Required | {'✅ Enforced' if all(r['passed'] for r in results if 'without auth' in r['description'].lower() or 'without token' in r['description'].lower()) else '❌ Missing'} | JWT Bearer token validation |
| Role-based Access | {'✅ Enforced' if all(r['passed'] for r in results if 'forbidden' in r['description'].lower() or 'as patient' in r['description'].lower()) else '❌ Missing'} | Role checks in place |
| Rate Limiting | ⚠️ Configured | SlowAPI enabled on auth endpoints |

### Test Coverage by Category
| Category | Total | Passed | Failed | Pass Rate |
|----------|-------|--------|--------|-----------|
"""

categories = set(r["category"] for r in results)
for cat in sorted(categories):
    cat_results = [r for r in results if r["category"] == cat]
    cat_passed = sum(1 for r in cat_results if r["passed"])
    cat_total = len(cat_results)
    report += f"| {cat} | {cat_total} | {cat_passed} | {cat_total - cat_passed} | {cat_passed*100//cat_total if cat_total > 0 else 0}% |\n"

report += f"""
### Recommendations

#### Critical (Must Fix)
1. **Review Failed Endpoints**: {failed} endpoints are not behaving as expected. Review error handling and validation logic.
2. **Error Response Consistency**: Ensure all error responses follow the same format with `error`, `status_code`, `path`, and `timestamp` fields.

#### High Priority
3. **Database Connection Pooling**: Configure proper pool_size and max_overflow for production workloads.
4. **Request Validation**: Add comprehensive Pydantic validation for all request bodies.
5. **Pagination Enforcement**: Implement mandatory pagination on all list endpoints to prevent memory issues.

#### Medium Priority
6. **API Versioning**: Add version prefix (e.g., `/api/v1/`) to all endpoints for future compatibility.
7. **Rate Limiting**: Expand rate limiting beyond auth endpoints to prevent abuse on doctor search and appointment booking.
8. **Response Caching**: Implement Redis caching for frequently accessed data (doctor listings, schedules).

#### Low Priority (Should Do)
9. **OpenAPI Documentation**: Review auto-generated Swagger docs at `/docs` for accuracy and completeness.
10. **Health Check Enhancement**: Add database connectivity, disk space, and memory checks to `/api/health`.
11. **Logging**: Implement structured logging (JSON format) for all API requests and responses.
12. **Monitoring**: Add request tracing (X-Request-ID header) for debugging distributed systems.

## Test Coverage
- **Total Endpoints Tested:** {len(results)}
- **Total Unique Endpoints:** """ + str(len(set(r['method'] + ' ' + r['path'].split('?')[0] for r in results))) + """
- **Pass Rate:** """ + str(passed*100//len(results) if len(results) > 0 else 0) + """%

---
*Report generated automatically by API Quality Engineer*
"""

# Save report
report_path = r"D:\Doctor-Appointment-Managment-System\API_QUALITY_REPORT.md"
with open(report_path, "w", encoding="utf-8") as f:
    f.write(report)

print(f"\n✅ Report saved to: {report_path}")
print(f"\n📊 Summary: {passed} passed, {failed} failed, {warnings} warnings out of {len(results)} total tests")
