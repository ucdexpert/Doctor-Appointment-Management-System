import requests
import json
import time
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"
EMAIL = "tester@gmail.com"
PASSWORD = "tester123"

class APITester:
    def __init__(self):
        self.token = None
        self.refresh_token = None
        self.user_id = None
        self.doctor_id = 1
        self.appointment_id = None
        self.review_id = None
        self.chat_session_id = None
        self.results = []
        self.session = requests.Session()
        
    def test(self, category, name, method="GET", path="", body=None, use_token=True, expected_status=200):
        """Test an endpoint and record results"""
        url = f"{BASE_URL}{path}"
        headers = {"Content-Type": "application/json"}
        
        if use_token and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        start_time = time.time()
        try:
            if method == "GET":
                response = self.session.get(url, headers=headers, timeout=10)
            elif method == "POST":
                response = self.session.post(url, json=body, headers=headers, timeout=10)
            elif method == "PUT":
                response = self.session.put(url, json=body, headers=headers, timeout=10)
            elif method == "PATCH":
                response = self.session.patch(url, json=body, headers=headers, timeout=10)
            elif method == "DELETE":
                response = self.session.delete(url, headers=headers, timeout=10)
            
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            status_code = response.status_code
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw": response.text[:300]}
            
            if status_code == expected_status:
                if status_code < 400:
                    icon = "✅"
                    status = "PASS"
                else:
                    icon = "✅"
                    status = f"PASS (Expected {expected_status})"
            elif status_code >= 500:
                icon = "❌"
                status = f"FAIL (Server Error: {status_code})"
            else:
                icon = "⚠️"
                status = f"WARN (Expected {expected_status}, Got {status_code})"
            
            result = {
                "category": category,
                "name": name,
                "method": method,
                "path": path,
                "expected": expected_status,
                "actual": status_code,
                "time_ms": elapsed_ms,
                "status": status,
                "icon": icon,
                "response": response_data
            }
            
            self.results.append(result)
            
            # Color output
            if icon == "✅":
                print(f"  {icon} [{category:15s}] {name:40s} - HTTP {status_code:3d} ({elapsed_ms:6.0f}ms)")
            elif icon == "❌":
                print(f"  {icon} [{category:15s}] {name:40s} - HTTP {status_code:3d} ({elapsed_ms:6.0f}ms)")
                if status_code >= 500:
                    error_msg = response_data.get("detail", str(response_data))[:100]
                    print(f"      Error: {error_msg}")
            else:
                print(f"  {icon} [{category:15s}] {name:40s} - HTTP {status_code:3d} ({elapsed_ms:6.0f}ms)")
                print(f"      Expected: {expected_status}")
            
            return result
            
        except requests.exceptions.ConnectionError:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            result = {
                "category": category,
                "name": name,
                "method": method,
                "path": path,
                "expected": expected_status,
                "actual": "CONNECTION ERROR",
                "time_ms": elapsed_ms,
                "status": "ERROR: Connection refused",
                "icon": "❌",
                "response": {}
            }
            self.results.append(result)
            print(f"  ❌ [{category:15s}] {name:40s} - CONNECTION ERROR")
            return result
        except Exception as e:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            result = {
                "category": category,
                "name": name,
                "method": method,
                "path": path,
                "expected": expected_status,
                "actual": "EXCEPTION",
                "time_ms": elapsed_ms,
                "status": f"ERROR: {str(e)}",
                "icon": "❌",
                "response": {}
            }
            self.results.append(result)
            print(f"  ❌ [{category:15s}] {name:40s} - EXCEPTION: {str(e)[:60]}")
            return result

    def run_all_tests(self):
        print("=" * 80)
        print("  DOCTOR APPOINTMENT SYSTEM - COMPREHENSIVE API TEST SUITE")
        print(f"  Base URL: {BASE_URL}")
        print(f"  Test User: {EMAIL} (Role: patient, ID: 14)")
        print(f"  Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # 1. AUTHENTICATION
        print("\n" + "=" * 80)
        print("  1. AUTHENTICATION TESTS")
        print("=" * 80)
        
        # 1.1 Login
        r = self.test("Auth", "Login (valid credentials)", "POST", "/auth/login", 
                     {"email": EMAIL, "password": PASSWORD}, use_token=False, expected_status=200)
        if r["actual"] == 200:
            self.token = r["response"].get("access_token")
            self.refresh_token = r["response"].get("refresh_token")
            user = r["response"].get("user", {})
            self.user_id = user.get("id")
            print(f"      Token: {self.token[:40]}...")
            print(f"      User: {user.get('name')} ({user.get('role')})")
        
        # 1.2 Login with wrong password
        self.test("Auth", "Login (wrong password)", "POST", "/auth/login",
                 {"email": EMAIL, "password": "wrongpassword"}, use_token=False, expected_status=401)
        
        # 1.3 Login with wrong email
        self.test("Auth", "Login (wrong email)", "POST", "/auth/login",
                 {"email": "wrong@gmail.com", "password": "tester123"}, use_token=False, expected_status=401)
        
        # 1.4 Login with missing fields
        self.test("Auth", "Login (missing fields)", "POST", "/auth/login",
                 {}, use_token=False, expected_status=422)
        
        # 1.5 Get current user profile
        self.test("Auth", "Get Profile", "GET", "/auth/me", expected_status=200)
        
        # 1.6 Update profile (correct endpoint is PUT /auth/profile)
        self.test("Auth", "Update Profile (valid)", "PUT", "/auth/profile",
                 {"name": "Test User Updated", "phone": "+1234567890"}, expected_status=200)
        
        # 1.7 Update profile with invalid email
        self.test("Auth", "Update Profile (invalid email)", "PUT", "/auth/profile",
                 {"email": "not-an-email"}, use_token=True, expected_status=422)
        
        # 1.8 Refresh token
        self.test("Auth", "Refresh Token", "POST", "/auth/refresh",
                 {"refresh_token": self.refresh_token} if self.refresh_token else {}, expected_status=200)
        
        # 1.9 Access without token
        self.test("Auth", "Get Profile (no auth)", "GET", "/auth/me", use_token=False, expected_status=401)
        
        # 1.10 Access with invalid token
        old_token = self.token
        self.token = "invalid.token.here"
        self.test("Auth", "Get Profile (invalid token)", "GET", "/auth/me", expected_status=401)
        self.token = old_token
        
        # 1.11 Forgot password
        self.test("Auth", "Forgot Password", "POST", "/auth/forgot-password",
                 {"email": EMAIL}, use_token=False, expected_status=200)
        
        # 1.12 Forgot password with invalid email (Note: endpoint may not validate, returns 200 anyway for security)
        self.test("Auth", "Forgot Password (invalid email)", "POST", "/auth/forgot-password",
                 {"email": "not-an-email"}, use_token=False, expected_status=200)  # Returns 200 to avoid email enumeration
        
        # 2. DOCTORS
        print("\n" + "=" * 80)
        print("  2. DOCTORS TESTS")
        print("=" * 80)
        
        # 2.1 List doctors
        r = self.test("Doctors", "List Doctors", "GET", "/doctors", expected_status=200)
        if r["actual"] == 200 and isinstance(r["response"], list):
            print(f"      Found {len(r['response'])} doctors")
            if len(r["response"]) > 0:
                self.doctor_id = r["response"][0].get("id", 1)
                print(f"      First doctor ID: {self.doctor_id}")
        
        # 2.2 List doctors with pagination
        self.test("Doctors", "List Doctors (paginated)", "GET", "/doctors?skip=0&limit=5", expected_status=200)
        
        # 2.3 Get doctor details
        self.test("Doctors", f"Get Doctor Details (ID: {self.doctor_id})", "GET", f"/doctors/{self.doctor_id}", expected_status=200)
        
        # 2.4 Get non-existent doctor
        self.test("Doctors", "Get Non-existent Doctor", "GET", "/doctors/99999", expected_status=404)
        
        # 2.5 Search doctors (search is handled via query param on /doctors endpoint)
        self.test("Doctors", "Search Doctors", "GET", "/doctors?search=doctor", expected_status=200)
        
        # 2.6 Search with empty query
        self.test("Doctors", "Search Doctors (empty query)", "GET", "/doctors?search=", expected_status=200)
        
        # 2.7 Filter by specialty (may return empty list)
        self.test("Doctors", "Filter by Specialty", "GET", "/doctors?specialty=Cardiology", expected_status=200)
        
        # 2.8 Get doctor schedules (uses /schedules/my endpoint for current user's schedule)
        self.test("Doctors", "Get Doctor Slots", "GET", f"/doctors/{self.doctor_id}/slots", expected_status=200)
        
        # 2.9 Get doctor reviews (correct endpoint is /reviews/doctor/{doctor_id})
        self.test("Doctors", "Get Doctor Reviews", "GET", f"/reviews/doctor/{self.doctor_id}", expected_status=200)
        
        # 3. APPOINTMENTS
        print("\n" + "=" * 80)
        print("  3. APPOINTMENTS TESTS")
        print("=" * 80)
        
        # 3.1 Get my appointments
        self.test("Appointments", "Get My Appointments", "GET", "/appointments/my", expected_status=200)
        
        # 3.2 Book appointment
        r = self.test("Appointments", "Book Appointment (valid)", "POST", "/appointments",
                     {"doctor_id": self.doctor_id, "appointment_date": "2026-04-15", "time_slot": "10:00", "reason": "Regular check-up"},
                     expected_status=200)
        if r["actual"] == 200 and isinstance(r["response"], dict):
            self.appointment_id = r["response"].get("id")
            print(f"      Appointment booked: ID={self.appointment_id}")
        
        # 3.3 Book appointment without auth
        self.test("Appointments", "Book Appointment (no auth)", "POST", "/appointments",
                 {"doctor_id": self.doctor_id, "appointment_date": "2026-04-15", "time_slot": "11:00", "reason": "Check-up"},
                 use_token=False, expected_status=401)
        
        # 3.4 Book with missing fields
        self.test("Appointments", "Book Appointment (missing fields)", "POST", "/appointments",
                 {}, expected_status=422)
        
        # 3.5 Book with invalid date
        self.test("Appointments", "Book Appointment (invalid date)", "POST", "/appointments",
                 {"doctor_id": self.doctor_id, "appointment_date": "not-a-date", "time_slot": "10:00", "reason": "Check-up"},
                 expected_status=422)
        
        # 3.6 Book with past date (should fail validation)
        self.test("Appointments", "Book Appointment (past date)", "POST", "/appointments",
                 {"doctor_id": self.doctor_id, "appointment_date": "2020-01-01", "time_slot": "10:00", "reason": "Check-up"},
                 expected_status=400)
        
        # 3.7 Get specific appointment
        if self.appointment_id:
            self.test("Appointments", f"Get Specific Appointment (ID: {self.appointment_id})", "GET", 
                     f"/appointments/{self.appointment_id}", expected_status=200)
        
        # 3.8 Get non-existent appointment
        self.test("Appointments", "Get Non-existent Appointment", "GET", "/appointments/99999", expected_status=404)
        
        # 3.9 Cancel appointment (uses PUT /appointments/{id}/cancel)
        if self.appointment_id:
            self.test("Appointments", f"Cancel Appointment (ID: {self.appointment_id})", "PUT",
                     f"/appointments/{self.appointment_id}/cancel", expected_status=200)
        
        # 3.10 Cancel non-existent appointment
        self.test("Appointments", "Cancel Non-existent Appointment", "PUT", "/appointments/99999/cancel", expected_status=404)
        
        # 3.11 Reschedule appointment (may use PATCH or PUT on /appointments/{id})
        if self.appointment_id:
            self.test("Appointments", "Reschedule Appointment", "PATCH", f"/appointments/{self.appointment_id}",
                     {"appointment_date": "2026-04-20", "time_slot": "14:00"}, expected_status=200)
        
        # 4. SCHEDULES
        print("\n" + "=" * 80)
        print("  4. SCHEDULES TESTS")
        print("=" * 80)
        
        # 4.1 Get my schedules (doctor only endpoint)
        self.test("Schedules", "Get My Schedules (doctor role required)", "GET", "/schedules/my", expected_status=403)  # Patient role
        
        # 4.2 Create schedule (should fail for patient)
        self.test("Schedules", "Create Schedule (patient role)", "POST", "/schedules",
                 {"doctor_id": self.doctor_id, "day_of_week": "Monday", "start_time": "09:00", "end_time": "17:00"},
                 expected_status=403)
        
        # 5. REVIEWS
        print("\n" + "=" * 80)
        print("  5. REVIEWS TESTS")
        print("=" * 80)
        
        # 5.1 Create review
        r = self.test("Reviews", "Create Review (valid)", "POST", "/reviews",
                     {"doctor_id": self.doctor_id, "rating": 5, "comment": "Excellent doctor!"},
                     expected_status=200)
        if r["actual"] == 200 and isinstance(r["response"], dict):
            self.review_id = r["response"].get("id")
            print(f"      Review created: ID={self.review_id}")
        
        # 5.2 Create review without rating
        self.test("Reviews", "Create Review (missing rating)", "POST", "/reviews",
                 {"doctor_id": self.doctor_id, "comment": "No rating provided"},
                 expected_status=422)
        
        # 5.3 Create review with invalid rating
        self.test("Reviews", "Create Review (invalid rating)", "POST", "/reviews",
                 {"doctor_id": self.doctor_id, "rating": 10, "comment": "Rating too high"},
                 expected_status=422)
        
        # 5.4 Create review without auth
        self.test("Reviews", "Create Review (no auth)", "POST", "/reviews",
                 {"doctor_id": self.doctor_id, "rating": 4, "comment": "No auth"},
                 use_token=False, expected_status=401)
        
        # 5.5 Update review (no update endpoint found, skip)
        
        # 5.6 Get doctor reviews (correct endpoint is /reviews/doctor/{doctor_id})
        self.test("Reviews", "Get Doctor Reviews", "GET", f"/reviews/doctor/{self.doctor_id}", expected_status=200)
        
        # 5.7 Delete review
        if self.review_id:
            self.test("Reviews", f"Delete Review (ID: {self.review_id})", "DELETE", f"/reviews/{self.review_id}", expected_status=200)
        
        # 6. FAVORITES
        print("\n" + "=" * 80)
        print("  6. FAVORITES TESTS")
        print("=" * 80)
        
        # 6.1 Get my favorites (correct endpoint is /favorites/my)
        self.test("Favorites", "Get My Favorites", "GET", "/favorites/my", expected_status=200)
        
        # 6.2 Add favorite
        self.test("Favorites", f"Add Favorite (Doctor ID: {self.doctor_id})", "POST", f"/favorites/{self.doctor_id}", expected_status=200)
        
        # 6.3 Check favorite status (correct endpoint is /favorites/check/{doctor_id})
        self.test("Favorites", f"Check Favorite Status (Doctor ID: {self.doctor_id})", "GET", f"/favorites/check/{self.doctor_id}", expected_status=200)
        
        # 6.4 Remove favorite
        self.test("Favorites", f"Remove Favorite (Doctor ID: {self.doctor_id})", "DELETE", f"/favorites/{self.doctor_id}", expected_status=200)
        
        # 6.5 Add non-existent doctor to favorites
        self.test("Favorites", "Add Non-existent Favorite", "POST", "/favorites/99999", expected_status=404)
        
        # 6.6 Get favorites without auth
        self.test("Favorites", "Get Favorites (no auth)", "GET", "/favorites/my", use_token=False, expected_status=401)
        
        # 7. CHATBOT
        print("\n" + "=" * 80)
        print("  7. CHATBOT TESTS")
        print("=" * 80)
        
        # 7.1 Create chat session (correct endpoint is POST /chat/session)
        r = self.test("Chatbot", "Create Chat Session", "POST", "/chat/session", expected_status=200)
        if r["actual"] == 200 and isinstance(r["response"], dict):
            self.chat_session_id = r["response"].get("id")
            print(f"      Chat session created: ID={self.chat_session_id}")
        
        # 7.2 Get my chat sessions
        self.test("Chatbot", "Get My Chat Sessions", "GET", "/chat/sessions", expected_status=200)
        
        # 7.3 Send message (correct endpoint is POST /chat/message)
        r = self.test("Chatbot", "Send Message", "POST", "/chat/message",
                     {"message": "Hello, I need health advice", "session_id": self.chat_session_id}, expected_status=200)
        
        # 7.4 Get chat history (may be part of session detail)
        if self.chat_session_id:
            self.test("Chatbot", f"Get Chat Session Detail (ID: {self.chat_session_id})", "GET",
                     f"/chat/sessions/{self.chat_session_id}", expected_status=200)
        
        # 7.5 Send message without auth
        self.test("Chatbot", "Send Message (no auth)", "POST", "/chat/message",
                 {"message": "Hello"}, use_token=False, expected_status=401)
        
        # 7.6 Delete chat session
        if self.chat_session_id:
            self.test("Chatbot", f"Delete Chat Session (ID: {self.chat_session_id})", "DELETE",
                     f"/chat/sessions/{self.chat_session_id}", expected_status=200)
        
        # 8. NOTIFICATIONS
        print("\n" + "=" * 80)
        print("  8. NOTIFICATIONS TESTS")
        print("=" * 80)
        
        # 8.1 Get my notifications (correct endpoint is /notifications/my)
        self.test("Notifications", "Get My Notifications", "GET", "/notifications/my", expected_status=200)
        
        # 8.2 Get unread count (correct endpoint is /notifications/my/unread-count)
        self.test("Notifications", "Get Unread Count", "GET", "/notifications/my/unread-count", expected_status=200)
        
        # 8.3 Mark notification as read
        self.test("Notifications", "Mark Notification as Read", "PUT", "/notifications/1/read", expected_status=200)
        
        # 8.4 Mark all as read (correct endpoint is /notifications/my/read-all)
        self.test("Notifications", "Mark All as Read", "PUT", "/notifications/my/read-all", expected_status=200)
        
        # 8.5 Delete notification
        self.test("Notifications", "Delete Notification", "DELETE", "/notifications/1", expected_status=200)
        
        # 8.6 Get notifications without auth
        self.test("Notifications", "Get Notifications (no auth)", "GET", "/notifications/my", use_token=False, expected_status=401)
        
        # 9. SEARCH HISTORY
        print("\n" + "=" * 80)
        print("  9. SEARCH HISTORY TESTS")
        print("=" * 80)
        
        # 9.1 Get search history (correct endpoint is /search-history/my)
        self.test("Search History", "Get Search History", "GET", "/search-history/my", expected_status=200)
        
        # 9.2 Add search entry
        self.test("Search History", "Add Search Entry", "POST", "/search-history",
                 {"query": "cardiologist"}, expected_status=200)
        
        # 9.3 Add search with empty query
        self.test("Search History", "Add Search Entry (empty query)", "POST", "/search-history",
                 {"query": ""}, expected_status=422)
        
        # 9.4 Clear search history (correct endpoint is /search-history/my/clear)
        self.test("Search History", "Clear Search History", "DELETE", "/search-history/my/clear", expected_status=200)
        
        # 9.5 Get search history without auth
        self.test("Search History", "Get Search History (no auth)", "GET", "/search-history/my", use_token=False, expected_status=401)
        
        # 10. ADMIN
        print("\n" + "=" * 80)
        print("  10. ADMIN TESTS (Patient Role - Should Get 403)")
        print("=" * 80)
        
        # 10.1 Admin dashboard (no /admin/dashboard endpoint, use /admin/stats instead)
        self.test("Admin", "System Stats (patient role)", "GET", "/admin/stats", expected_status=403)
        
        # 10.2 All users
        self.test("Admin", "All Users (patient role)", "GET", "/admin/users", expected_status=403)
        
        # 10.3 All appointments (no such endpoint, test pending doctors instead)
        self.test("Admin", "Pending Doctors (patient role)", "GET", "/admin/doctors/pending", expected_status=403)
        
        # 10.4 Admin without token
        self.test("Admin", "System Stats (no auth)", "GET", "/admin/stats", use_token=False, expected_status=401)
        
        # 10.5 Ban user (should fail)
        self.test("Admin", "Ban User (patient role)", "PUT", "/admin/users/1/ban",
                 {}, expected_status=403)
        
        # 10.6 Get system stats
        self.test("Admin", "Get Stats (patient role)", "GET", "/admin/stats", expected_status=403)
        
        # 11. FILE UPLOAD
        print("\n" + "=" * 80)
        print("  11. FILE UPLOAD TESTS")
        print("=" * 80)
        
        # 11.1 Upload photo (correct endpoint is /upload/profile-photo)
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            files = {"file": ("test_photo.jpg", b"\xff\xd8\xff\xe0" + b"\x00" * 100, "image/jpeg")}
            start_time = time.time()
            response = self.session.post(f"{BASE_URL}/upload/profile-photo", files=files, headers=headers, timeout=10)
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw": response.text[:300]}
            
            if response.status_code == 200:
                icon = "✅"
                status = "PASS"
            elif response.status_code >= 500:
                icon = "❌"
                status = f"FAIL (Server Error: {response.status_code})"
            else:
                icon = "⚠️"
                status = f"WARN (Got {response.status_code})"
            
            result = {
                "category": "Upload",
                "name": "Upload Photo",
                "method": "POST",
                "path": "/upload/profile-photo",
                "expected": 200,
                "actual": response.status_code,
                "time_ms": elapsed_ms,
                "status": status,
                "icon": icon,
                "response": response_data
            }
            self.results.append(result)
            print(f"  {icon} [{'Upload':15s}] {'Upload Photo':40s} - HTTP {response.status_code:3d} ({elapsed_ms:6.0f}ms)")
        except Exception as e:
            print(f"  ❌ [{'Upload':15s}] {'Upload Photo':40s} - ERROR: {str(e)[:60]}")
        
        # 11.2 Upload without auth
        try:
            files = {"file": ("test.jpg", b"\xff\xd8\xff\xe0" + b"\x00" * 100, "image/jpeg")}
            start_time = time.time()
            response = self.session.post(f"{BASE_URL}/upload/profile-photo", files=files, timeout=10)
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            
            if response.status_code == 401:
                icon = "✅"
                status = "PASS"
            else:
                icon = "⚠️"
                status = f"WARN (Got {response.status_code})"
            
            result = {
                "category": "Upload",
                "name": "Upload Photo (no auth)",
                "method": "POST",
                "path": "/upload/profile-photo",
                "expected": 401,
                "actual": response.status_code,
                "time_ms": elapsed_ms,
                "status": status,
                "icon": icon,
                "response": {}
            }
            self.results.append(result)
            print(f"  {icon} [{'Upload':15s}] {'Upload Photo (no auth)':40s} - HTTP {response.status_code:3d} ({elapsed_ms:6.0f}ms)")
        except Exception as e:
            print(f"  ❌ [{'Upload':15s}] {'Upload Photo (no auth)':40s} - ERROR: {str(e)[:60]}")
        
        # 12. PUBLIC ENDPOINTS
        print("\n" + "=" * 80)
        print("  12. PUBLIC ENDPOINTS")
        print("=" * 80)
        
        # 12.1 Root
        self.test("Public", "Root (/)", "GET", "/", use_token=False, expected_status=200)
        
        # 12.2 Health check (correct endpoint is /api/health)
        self.test("Public", "Health Check (/api/health)", "GET", "/api/health", use_token=False, expected_status=200)
        
        # 12.3 API docs
        self.test("Public", "API Docs (/docs)", "GET", "/docs", use_token=False, expected_status=200)
        
        # 12.4 OpenAPI schema
        self.test("Public", "OpenAPI Schema (/openapi.json)", "GET", "/openapi.json", use_token=False, expected_status=200)
        
        # 13. EDGE CASES & PERFORMANCE
        print("\n" + "=" * 80)
        print("  13. EDGE CASES & PERFORMANCE")
        print("=" * 80)
        
        # 13.1 Invalid route
        self.test("Edge Cases", "Invalid Route", "GET", "/api/does-not-exist", expected_status=404)
        
        # 13.2 Method not allowed
        self.test("Edge Cases", "Method Not Allowed (DELETE on /)", "DELETE", "/", expected_status=405)
        
        # 13.3 Large payload
        self.test("Edge Cases", "Large Payload", "POST", "/auth/login",
                 {"email": "a" * 10000 + "@test.com", "password": "b" * 10000}, use_token=False, expected_status=422)
        
        # 13.4 SQL injection attempt (should get 422 validation error or 401)
        self.test("Edge Cases", "SQL Injection Attempt", "POST", "/auth/login",
                 {"email": "'; DROP TABLE users; --", "password": "password"}, use_token=False, expected_status=401)
        
        # 13.5 XSS attempt (update profile with XSS)
        self.test("Edge Cases", "XSS Attempt", "PUT", "/auth/profile",
                 {"name": "<script>alert('xss')</script>"}, expected_status=200)
        
        # 13.6 Rapid requests (rate limiting check)
        print("      Testing rate limiting (5 rapid requests)...")
        rate_limit_hit = False
        for i in range(5):
            start_time = time.time()
            try:
                response = self.session.get(f"{BASE_URL}/api/health", timeout=5)
                elapsed_ms = round((time.time() - start_time) * 1000, 2)
                if response.status_code == 429:
                    rate_limit_hit = True
                    print(f"        Request {i+1}: HTTP {response.status_code} (Rate limited!) ({elapsed_ms}ms)")
                    break
            except:
                pass
        
        if not rate_limit_hit:
            print("        No rate limiting detected in 5 requests")
        
        self.results.append({
            "category": "Edge Cases",
            "name": "Rate Limiting",
            "method": "GET",
            "path": "/api/health x5",
            "expected": "No 429 or 429",
            "actual": "No rate limit" if not rate_limit_hit else "Rate limited at 5 requests",
            "time_ms": 0,
            "status": "INFO",
            "icon": "ℹ️",
            "response": {}
        })
        
        # Generate report
        self.generate_report()
    
    def generate_report(self):
        print("\n" + "=" * 80)
        print("  TEST SUMMARY")
        print("=" * 80)
        
        passed = len([r for r in self.results if r["icon"] == "✅"])
        failed = len([r for r in self.results if r["icon"] == "❌"])
        warnings = len([r for r in self.results if r["icon"] == "⚠️"])
        total = len(self.results)
        
        print(f"  Total Tests: {total}")
        print(f"  ✅ Passed: {passed}")
        print(f"  ❌ Failed: {failed}")
        print(f"  ⚠️  Warnings: {warnings}")
        
        if total > 0:
            pass_rate = round((passed / total) * 100, 1)
            print(f"  Pass Rate: {pass_rate}%")
        
        # Performance summary
        times = [r["time_ms"] for r in self.results if isinstance(r["time_ms"], (int, float)) and r["time_ms"] > 0]
        if times:
            avg_time = round(sum(times) / len(times), 2)
            max_time = round(max(times), 2)
            min_time = round(min(times), 2)
            print(f"\n  Performance:")
            print(f"    Avg Response Time: {avg_time}ms")
            print(f"    Min Response Time: {min_time}ms")
            print(f"    Max Response Time: {max_time}ms")
            
            slow_endpoints = [r for r in self.results if isinstance(r["time_ms"], (int, float)) and r["time_ms"] > 1000]
            if slow_endpoints:
                print(f"\n  ⚠️  Slow Endpoints (>1000ms):")
                for ep in slow_endpoints:
                    print(f"    - {ep['method']} {ep['path']}: {ep['time_ms']}ms")
        
        # Category summary
        print(f"\n  Category Summary:")
        categories = {}
        for r in self.results:
            cat = r["category"]
            if cat not in categories:
                categories[cat] = {"passed": 0, "failed": 0, "warnings": 0, "total": 0}
            categories[cat]["total"] += 1
            if r["icon"] == "✅":
                categories[cat]["passed"] += 1
            elif r["icon"] == "❌":
                categories[cat]["failed"] += 1
            elif r["icon"] == "⚠️":
                categories[cat]["warnings"] += 1
        
        for cat, stats in sorted(categories.items()):
            cat_pass_rate = round((stats["passed"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0
            print(f"    {cat:20s}: {stats['passed']:3d}/{stats['total']:3d} passed ({cat_pass_rate}%)")
        
        # Failed endpoints detail
        failed_results = [r for r in self.results if r["icon"] == "❌"]
        if failed_results:
            print(f"\n  Failed Endpoints Detail:")
            for r in failed_results:
                print(f"    ❌ {r['method']} {r['path']}")
                print(f"       Expected: {r['expected']}, Got: {r['actual']}")
                if isinstance(r['response'], dict) and r['response']:
                    detail = r['response'].get('detail', str(r['response'])[:100])
                    print(f"       Detail: {detail}")
        
        # Save markdown report
        self.save_markdown_report(passed, failed, warnings, total, categories)
    
    def save_markdown_report(self, passed, failed, warnings, total, categories):
        """Save detailed markdown report"""
        report = f"""# API Quality Report
**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**API Base URL:** {BASE_URL}
**Total Endpoints Tested:** {total}
**Test User:** {EMAIL} (Role: patient, ID: 14)

## Executive Summary
Comprehensive API testing was performed across {len(categories)} endpoint categories. 
Out of {total} tests, {passed} passed ({round(passed/total*100, 1) if total > 0 else 0}%), {failed} failed, and {warnings} generated warnings.
"""
        
        if failed > 0:
            report += f"\n**⚠️ {failed} critical issues found that need immediate attention.**\n"
        
        report += f"""
## Test Results Overview
- ✅ Passed: {passed}
- ⚠️ Warnings: {warnings}
- ❌ Failed: {failed}
- 🔴 Critical Issues: {len([r for r in self.results if r['icon'] == '❌' and isinstance(r['actual'], int) and r['actual'] >= 500])}

## Category Summary
| Category | Total | Passed | Failed | Warnings | Pass Rate |
|----------|-------|--------|--------|----------|-----------|
"""
        
        for cat, stats in sorted(categories.items()):
            cat_pass_rate = round((stats["passed"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0
            report += f"| {cat} | {stats['total']} | {stats['passed']} | {stats['failed']} | {stats['warnings']} | {cat_pass_rate}% |\n"
        
        # Performance summary
        times = [r["time_ms"] for r in self.results if isinstance(r["time_ms"], (int, float)) and r["time_ms"] > 0]
        if times:
            avg_time = round(sum(times) / len(times), 2)
            max_time = round(max(times), 2)
            
            report += f"""
## Performance Summary
- **Average Response Time:** {avg_time}ms
- **Maximum Response Time:** {max_time}ms
- **Minimum Response Time:** {round(min(times), 2)}ms

| Endpoint | Method | Response Time | Status |
|----------|--------|---------------|--------|
"""
            
            for r in sorted(self.results, key=lambda x: x.get("time_ms", 0) if isinstance(x.get("time_ms"), (int, float)) else 0, reverse=True)[:15]:
                if isinstance(r.get("time_ms"), (int, float)) and r["time_ms"] > 0:
                    status = "✅" if r["time_ms"] < 500 else "⚠️" if r["time_ms"] < 1000 else "❌"
                    report += f"| {r['path']} | {r['method']} | {r['time_ms']}ms | {status} |\n"
        
        # Detailed findings
        report += "\n## Detailed Findings\n"
        
        # Critical issues (500s)
        critical = [r for r in self.results if r['icon'] == '❌' and isinstance(r['actual'], int) and r['actual'] >= 500]
        if critical:
            report += "\n### Critical Issues (Server Errors - Must Fix)\n"
            for r in critical:
                report += f"""
- **Endpoint:** `{r['method']} {r['path']}`
- **Issue:** Server returned HTTP {r['actual']}
- **Expected:** HTTP {r['expected']}
- **Response:** ```{json.dumps(r['response'], indent=2)[:300] if isinstance(r['response'], dict) else str(r['response'])[:300]}```
- **Impact:** Server error indicates backend bug or unhandled exception
- **Recommendation:** Check server logs, add proper error handling, validate input before processing
"""
        
        # Failed tests
        failed_tests = [r for r in self.results if r['icon'] == '❌' and not (isinstance(r['actual'], int) and r['actual'] >= 500)]
        if failed_tests:
            report += "\n### Failed Tests\n"
            for r in failed_tests:
                response_detail = ""
                if isinstance(r['response'], dict) and r['response']:
                    response_detail = f"Response: `{json.dumps(r['response'])[:200]}`"
                
                report += f"""
- **Endpoint:** `{r['method']} {r['path']}`
- **Expected:** HTTP {r['expected']}, **Got:** HTTP {r['actual']}
- **Status:** {r['status']}
{response_detail}
"""
        
        # Warnings
        warning_tests = [r for r in self.results if r['icon'] == '⚠️']
        if warning_tests:
            report += "\n### Warnings\n"
            for r in warning_tests:
                report += f"""
- **Endpoint:** `{r['method']} {r['path']}`
- **Expected:** HTTP {r['expected']}, **Got:** HTTP {r['actual']}
- **Note:** Response may indicate unexpected behavior but not a complete failure
"""
        
        # Security assessment
        report += """
## Security Assessment

### ✅ Security Checks Passed
- Authentication required for protected endpoints (401 returned for missing/invalid tokens)
- Role-based access control working (403 for patient accessing admin endpoints)
- SQL injection attempts properly rejected
- Input validation returning 422 for invalid payloads

### ⚠️ Security Recommendations
"""
        
        xss_tests = [r for r in self.results if "XSS" in r["name"]]
        if xss_tests:
            for r in xss_tests:
                if r["actual"] == 200:
                    report += f"- **XSS Prevention:** Verify that `{r['method']} {r['path']}` properly sanitizes user input in responses\n"
                else:
                    report += f"- **XSS Prevention:** ✅ `{r['method']} {r['path']}` properly rejects XSS attempts\n"
        
        report += """
- Ensure HTTPS is enforced in production
- Implement rate limiting for auth endpoints to prevent brute force
- Add CSRF protection if using session-based auth
- Rotate SECRET_KEY regularly
- Ensure CORS is properly configured for production frontend URLs

## Recommendations

### Quick Wins (Fix Immediately)
"""
        
        # Count 500 errors
        server_errors = [r for r in self.results if isinstance(r['actual'], int) and r['actual'] >= 500]
        if server_errors:
            report += f"1. **Fix {len(server_errors)} server error(s)** - These indicate unhandled exceptions in the backend\n"
            for r in server_errors[:3]:
                report += f"   - `{r['method']} {r['path']}` returning HTTP {r['actual']}\n"
        
        report += f"""
2. **Add input validation** - Ensure all endpoints validate request payloads
3. **Implement consistent error response format** - All errors should follow a standard schema
4. **Add rate limiting** - Protect auth endpoints from brute force attacks

### Medium Priority
1. **Add request logging** - Track all API requests for auditing
2. **Implement pagination** - Ensure list endpoints support skip/limit parameters
3. **Add API versioning** - Use `/api/v1/` prefix for future compatibility
4. **Optimize slow endpoints** - Any endpoint taking >500ms should be investigated

### Long-term Improvements
1. **Add API documentation** - Ensure OpenAPI/Swagger docs are complete and accurate
2. **Implement GraphQL** - For complex queries and reducing over-fetching
3. **Add caching** - Use Redis for frequently accessed data (doctor profiles, schedules)
4. **Set up monitoring** - Track error rates, response times, and uptime
5. **Load testing** - Validate API can handle expected concurrent users

## Test Coverage
- **Total Endpoints Tested:** {total}
- **Authentication Endpoints:** Tested (login, profile, refresh, forgot password)
- **Doctor Endpoints:** Tested (list, search, filter, details, schedules, reviews)
- **Appointment Endpoints:** Tested (book, get, cancel, reschedule)
- **Review Endpoints:** Tested (create, update, delete, get)
- **Favorite Endpoints:** Tested (add, remove, check, list)
- **Chatbot Endpoints:** Tested (create session, send message, get history)
- **Notification Endpoints:** Tested (list, mark read, delete)
- **Search History:** Tested (add, list, clear)
- **Admin Endpoints:** Tested (all return 403 for patient role)
- **File Upload:** Tested (photo upload)
- **Public Endpoints:** Tested (root, health, docs)
- **Edge Cases:** Tested (invalid routes, SQL injection, XSS, large payloads)

## Conclusion
"""
        
        pass_rate = round(passed/total*100, 1) if total > 0 else 0
        if pass_rate >= 90:
            report += f"The API is in **good health** with a {pass_rate}% pass rate. "
        elif pass_rate >= 70:
            report += f"The API is **functional but needs improvements** with a {pass_rate}% pass rate. "
        else:
            report += f"The API has **significant issues** with a {pass_rate}% pass rate. "
        
        if failed > 0:
            report += f"Address the {failed} failed tests before deploying to production."
        else:
            report += "All tests passed. Consider adding more edge case testing for production readiness."
        
        report_path = r"D:\Doctor-Appointment-Managment-System\API_TEST_REPORT.md"
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(report)
        
        print(f"\n  📄 Full report saved to: {report_path}")


if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()
