# API Comprehensive Test Script
$baseUrl = "http://127.0.0.1:8000"
$token = ""
$refreshToken = ""
$doctorId = 1
$appointmentId = 1
$scheduleId = 1
$reviewId = 1
$chatSessionId = 1
$notificationId = 1

$results = @()
$totalTests = 0
$passed = 0
$failed = 0
$warnings = 0

function Test-Endpoint {
    param(
        [string]$Category,
        [string]$Name,
        [string]$Method = "GET",
        [string]$Url,
        [string]$Body = "",
        [string]$AuthToken = "",
        [int]$ExpectedStatus = 200,
        [hashtable]$Headers = @{}
    )

    $global:totalTests++
    $startTime = Get-Date

    try {
        $curlHeaders = @("-s", "-w", "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}s")
        
        if ($Method -ne "GET") {
            $curlHeaders += "-X", $Method
        }

        $curlHeaders += "-H", "Content-Type: application/json"
        
        if ($AuthToken -ne "") {
            $curlHeaders += "-H", "Authorization: Bearer $AuthToken"
        }

        if ($Body -ne "") {
            $curlHeaders += "-d", $Body
        }

        $curlHeaders += $Url

        $result = & curl @curlHeaders 2>&1
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds

        # Parse response
        $responseLines = $result -split "`n"
        $httpStatus = 0
        $responseTime = 0
        $responseBody = ""

        foreach ($line in $responseLines) {
            if ($line -match "HTTP_STATUS:(\d+)") {
                $httpStatus = [int]$Matches[1]
            } elseif ($line -match "TIME:([\d.]+)") {
                $responseTime = [double]$Matches[1] * 1000
            } else {
                $responseBody += $line
            }
        }

        $statusIcon = "✅"
        $statusText = "PASS"
        
        if ($httpStatus -eq $ExpectedStatus) {
            $global:passed++
        } elseif ($httpStatus -ge 500) {
            $statusIcon = "❌"
            $statusText = "FAIL (Server Error: $httpStatus)"
            $global:failed++
        } else {
            $statusIcon = "⚠️"
            $statusText = "WARN (Expected: $ExpectedStatus, Got: $httpStatus)"
            $global:warnings++
        }

        $obj = @{
            Category = $Category
            Name = $Name
            Method = $Method
            Url = $Url.Replace($baseUrl, "")
            ExpectedStatus = $ExpectedStatus
            ActualStatus = $httpStatus
            ResponseTime = [math]::Round($responseTime, 2)
            Status = $statusText
            Icon = $statusIcon
            ResponseBody = $responseBody.Substring(0, [Math]::Min(300, $responseBody.Length))
        }

        $global:results += $obj
        
        Write-Host "$statusIcon [$Category] $Name - HTTP $httpStatus ($([math]::Round($responseTime, 0))ms)" -ForegroundColor $(if($httpStatus -eq $ExpectedStatus){"Green"}elseif($httpStatus -ge 500){"Red"}else{"Yellow"})
        
        if ($httpStatus -ne $ExpectedStatus) {
            Write-Host "   Response: $($responseBody.Substring(0, [Math]::Min(200, $responseBody.Length)))" -ForegroundColor Yellow
        }

        return $obj

    } catch {
        $global:failed++
        $global:totalTests++
        Write-Host "❌ [$Category] $Name - ERROR: $_" -ForegroundColor Red
        
        $obj = @{
            Category = $Category
            Name = $Name
            Method = $Method
            Url = $Url.Replace($baseUrl, "")
            ExpectedStatus = $ExpectedStatus
            ActualStatus = "ERROR"
            ResponseTime = 0
            Status = "ERROR: $_"
            Icon = "❌"
            ResponseBody = $_.Exception.Message
        }

        $global:results += $obj
        return $obj
    }
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Doctor Appointment System - API Test Suite" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ==========================================
# 1. AUTHENTICATION TESTS
# ==========================================
Write-Host "`n=== 1. AUTHENTICATION ===" -ForegroundColor Magenta

# 1.1 Login
Write-Host "`n--- Login ---" -ForegroundColor Yellow
$loginResult = Test-Endpoint -Category "Auth" -Name "Login" -Method "POST" -Url "$baseUrl/auth/login" -Body '{"email": "tester@gmail.com", "password": "tester123"}' -ExpectedStatus 200

# Parse token from login response
try {
    $loginJson = $loginResult.ResponseBody | ConvertFrom-Json
    $token = $loginJson.access_token
    $refreshToken = $loginJson.refresh_token
    Write-Host "   Token obtained: $($token.Substring(0, 30))..." -ForegroundColor Green
} catch {
    Write-Host "   Failed to parse token!" -ForegroundColor Red
}

# 1.2 Login with wrong password
Test-Endpoint -Category "Auth" -Name "Login - Wrong Password" -Method "POST" -Url "$baseUrl/auth/login" -Body '{"email": "tester@gmail.com", "password": "wrongpassword"}' -ExpectedStatus 401

# 1.3 Get current user profile
Test-Endpoint -Category "Auth" -Name "Get Profile" -Url "$baseUrl/auth/me" -AuthToken $token -ExpectedStatus 200

# 1.4 Update profile
Test-Endpoint -Category "Auth" -Name "Update Profile" -Method "PUT" -Url "$baseUrl/auth/me" -AuthToken $token -Body '{"name": "Test User Updated", "phone": "+1234567890"}' -ExpectedStatus 200

# 1.5 Refresh token
Test-Endpoint -Category "Auth" -Name "Refresh Token" -Method "POST" -Url "$baseUrl/auth/refresh" -AuthToken $token -Body "{\"refresh_token\": \"$refreshToken\"}" -ExpectedStatus 200

# 1.6 Access without token (should fail)
Test-Endpoint -Category "Auth" -Name "Get Profile - No Auth" -Url "$baseUrl/auth/me" -ExpectedStatus 401

# 1.7 Access with invalid token
Test-Endpoint -Category "Auth" -Name "Get Profile - Invalid Token" -Url "$baseUrl/auth/me" -AuthToken "invalid_token_here" -ExpectedStatus 401

# ==========================================
# 2. DOCTORS TESTS
# ==========================================
Write-Host "`n=== 2. DOCTORS ===" -ForegroundColor Magenta

# 2.1 List doctors
Test-Endpoint -Category "Doctors" -Name "List Doctors" -Url "$baseUrl/doctors" -ExpectedStatus 200

# 2.2 List doctors with pagination
Test-Endpoint -Category "Doctors" -Name "List Doctors - Paginated" -Url "$baseUrl/doctors?skip=0&limit=5" -ExpectedStatus 200

# 2.3 Get doctor details (ID 1)
Test-Endpoint -Category "Doctors" -Name "Get Doctor Details" -Url "$baseUrl/doctors/1" -ExpectedStatus 200

# 2.4 Get non-existent doctor
Test-Endpoint -Category "Doctors" -Name "Get Non-existent Doctor" -Url "$baseUrl/doctors/99999" -ExpectedStatus 404

# 2.5 Search doctors
Test-Endpoint -Category "Doctors" -Name "Search Doctors" -Url "$baseUrl/doctors/search?q=doctor" -ExpectedStatus 200

# 2.6 Filter by specialty
Test-Endpoint -Category "Doctors" -Name "Filter by Specialty" -Url "$baseUrl/doctors?specialty=Cardiology" -ExpectedStatus 200

# 2.7 Get doctor schedules
Test-Endpoint -Category "Doctors" -Name "Get Doctor Schedules" -Url "$baseUrl/doctors/1/schedules" -ExpectedStatus 200

# ==========================================
# 3. APPOINTMENTS TESTS
# ==========================================
Write-Host "`n=== 3. APPOINTMENTS ===" -ForegroundColor Magenta

# 3.1 Get my appointments
Test-Endpoint -Category "Appointments" -Name "Get My Appointments" -Url "$baseUrl/appointments/my" -AuthToken $token -ExpectedStatus 200

# 3.2 Book appointment
$bookResult = Test-Endpoint -Category "Appointments" -Name "Book Appointment" -Method "POST" -Url "$baseUrl/appointments" -AuthToken $token -Body '{"doctor_id": 1, "date": "2026-04-10", "time": "10:00", "reason": "Check-up"}' -ExpectedStatus 200

# Parse appointment ID
try {
    $bookJson = $bookResult.ResponseBody | ConvertFrom-Json
    if ($bookJson.id) {
        $appointmentId = $bookJson.id
        Write-Host "   Appointment booked: ID=$appointmentId" -ForegroundColor Green
    }
} catch {}

# 3.3 Get specific appointment
if ($appointmentId -ne 1) {
    Test-Endpoint -Category "Appointments" -Name "Get Specific Appointment" -Url "$baseUrl/appointments/$appointmentId" -AuthToken $token -ExpectedStatus 200
}

# 3.4 Cancel appointment
if ($appointmentId -ne 1) {
    Test-Endpoint -Category "Appointments" -Name "Cancel Appointment" -Method "DELETE" -Url "$baseUrl/appointments/$appointmentId" -AuthToken $token -ExpectedStatus 200
}

# 3.5 Get non-existent appointment
Test-Endpoint -Category "Appointments" -Name "Get Non-existent Appointment" -Url "$baseUrl/appointments/99999" -AuthToken $token -ExpectedStatus 404

# 3.6 Book without auth
Test-Endpoint -Category "Appointments" -Name "Book Without Auth" -Method "POST" -Url "$baseUrl/appointments" -Body '{"doctor_id": 1, "date": "2026-04-10", "time": "10:00", "reason": "Check-up"}' -ExpectedStatus 401

# 3.7 Book with invalid date
Test-Endpoint -Category "Appointments" -Name "Book - Invalid Date" -Method "POST" -Url "$baseUrl/appointments" -AuthToken $token -Body '{"doctor_id": 1, "date": "invalid-date", "time": "10:00", "reason": "Check-up"}' -ExpectedStatus 422

# ==========================================
# 4. SCHEDULES TESTS
# ==========================================
Write-Host "`n=== 4. SCHEDULES ===" -ForegroundColor Magenta

# 4.1 Get doctor schedules
Test-Endpoint -Category "Schedules" -Name "Get Doctor Schedules" -Url "$baseUrl/doctors/1/schedules" -ExpectedStatus 200

# 4.2 Get schedule by ID
Test-Endpoint -Category "Schedules" -Name "Get Schedule by ID" -Url "$baseUrl/schedules/1" -ExpectedStatus 200

# 4.3 Get non-existent schedule
Test-Endpoint -Category "Schedules" -Name "Get Non-existent Schedule" -Url "$baseUrl/schedules/99999" -ExpectedStatus 404

# 4.4 Create schedule (should fail for patient)
Test-Endpoint -Category "Schedules" -Name "Create Schedule - Patient Role" -Method "POST" -Url "$baseUrl/schedules" -AuthToken $token -Body '{"doctor_id": 1, "day_of_week": "Monday", "start_time": "09:00", "end_time": "17:00"}' -ExpectedStatus 403

# ==========================================
# 5. REVIEWS TESTS
# ==========================================
Write-Host "`n=== 5. REVIEWS ===" -ForegroundColor Magenta

# 5.1 Get reviews for doctor
Test-Endpoint -Category "Reviews" -Name "Get Doctor Reviews" -Url "$baseUrl/doctors/1/reviews" -ExpectedStatus 200

# 5.2 Create review
$reviewResult = Test-Endpoint -Category "Reviews" -Name "Create Review" -Method "POST" -Url "$baseUrl/reviews" -AuthToken $token -Body '{"doctor_id": 1, "rating": 5, "comment": "Excellent doctor!"}' -ExpectedStatus 200

# Parse review ID
try {
    $reviewJson = $reviewResult.ResponseBody | ConvertFrom-Json
    if ($reviewJson.id) {
        $reviewId = $reviewJson.id
        Write-Host "   Review created: ID=$reviewId" -ForegroundColor Green
    }
} catch {}

# 5.3 Update review
if ($reviewId -ne 1) {
    Test-Endpoint -Category "Reviews" -Name "Update Review" -Method "PUT" -Url "$baseUrl/reviews/$reviewId" -AuthToken $token -Body '{"rating": 4, "comment": "Updated review"}' -ExpectedStatus 200
}

# 5.4 Delete review
if ($reviewId -ne 1) {
    Test-Endpoint -Category "Reviews" -Name "Delete Review" -Method "DELETE" -Url "$baseUrl/reviews/$reviewId" -AuthToken $token -ExpectedStatus 200
}

# 5.5 Create review without rating (should fail)
Test-Endpoint -Category "Reviews" -Name "Create Review - Missing Rating" -Method "POST" -Url "$baseUrl/reviews" -AuthToken $token -Body '{"doctor_id": 1, "comment": "No rating"}' -ExpectedStatus 422

# ==========================================
# 6. FAVORITES TESTS
# ==========================================
Write-Host "`n=== 6. FAVORITES ===" -ForegroundColor Magenta

# 6.1 Get my favorites
Test-Endpoint -Category "Favorites" -Name "Get My Favorites" -Url "$baseUrl/favorites" -AuthToken $token -ExpectedStatus 200

# 6.2 Add favorite
Test-Endpoint -Category "Favorites" -Name "Add Favorite" -Method "POST" -Url "$baseUrl/favorites/1" -AuthToken $token -ExpectedStatus 200

# 6.3 Check if doctor is favorite
Test-Endpoint -Category "Favorites" -Name "Check Favorite Status" -Url "$baseUrl/favorites/1/check" -AuthToken $token -ExpectedStatus 200

# 6.4 Remove favorite
Test-Endpoint -Category "Favorites" -Name "Remove Favorite" -Method "DELETE" -Url "$baseUrl/favorites/1" -AuthToken $token -ExpectedStatus 200

# 6.5 Add non-existent doctor to favorites
Test-Endpoint -Category "Favorites" -Name "Add Non-existent Favorite" -Method "POST" -Url "$baseUrl/favorites/99999" -AuthToken $token -ExpectedStatus 404

# ==========================================
# 7. CHATBOT TESTS
# ==========================================
Write-Host "`n=== 7. CHATBOT ===" -ForegroundColor Magenta

# 7.1 Create chat session
$chatResult = Test-Endpoint -Category "Chatbot" -Name "Create Chat Session" -Method "POST" -Url "$baseUrl/chat/sessions" -AuthToken $token -ExpectedStatus 200

# Parse chat session ID
try {
    $chatJson = $chatResult.ResponseBody | ConvertFrom-Json
    if ($chatJson.id) {
        $chatSessionId = $chatJson.id
        Write-Host "   Chat session created: ID=$chatSessionId" -ForegroundColor Green
    }
} catch {}

# 7.2 Get my chat sessions
Test-Endpoint -Category "Chatbot" -Name "Get My Chat Sessions" -Url "$baseUrl/chat/sessions" -AuthToken $token -ExpectedStatus 200

# 7.3 Send message
if ($chatSessionId -ne 1) {
    Test-Endpoint -Category "Chatbot" -Name "Send Message" -Method "POST" -Url "$baseUrl/chat/sessions/$chatSessionId/messages" -AuthToken $token -Body '{"message": "Hello, I need health advice"}' -ExpectedStatus 200
}

# 7.4 Get chat history
if ($chatSessionId -ne 1) {
    Test-Endpoint -Category "Chatbot" -Name "Get Chat History" -Url "$baseUrl/chat/sessions/$chatSessionId/messages" -AuthToken $token -ExpectedStatus 200
}

# 7.5 Send message without auth
Test-Endpoint -Category "Chatbot" -Name "Send Message - No Auth" -Method "POST" -Url "$baseUrl/chat/sessions/1/messages" -Body '{"message": "Hello"}' -ExpectedStatus 401

# ==========================================
# 8. NOTIFICATIONS TESTS
# ==========================================
Write-Host "`n=== 8. NOTIFICATIONS ===" -ForegroundColor Magenta

# 8.1 Get my notifications
Test-Endpoint -Category "Notifications" -Name "Get My Notifications" -Url "$baseUrl/notifications" -AuthToken $token -ExpectedStatus 200

# 8.2 Get unread count
Test-Endpoint -Category "Notifications" -Name "Get Unread Count" -Url "$baseUrl/notifications/unread-count" -AuthToken $token -ExpectedStatus 200

# 8.3 Mark notification as read
Test-Endpoint -Category "Notifications" -Name "Mark as Read" -Method "PUT" -Url "$baseUrl/notifications/1/read" -AuthToken $token -ExpectedStatus 200

# 8.4 Mark all as read
Test-Endpoint -Category "Notifications" -Name "Mark All as Read" -Method "PUT" -Url "$baseUrl/notifications/read-all" -AuthToken $token -ExpectedStatus 200

# 8.5 Delete notification
Test-Endpoint -Category "Notifications" -Name "Delete Notification" -Method "DELETE" -Url "$baseUrl/notifications/1" -AuthToken $token -ExpectedStatus 200

# ==========================================
# 9. SEARCH HISTORY TESTS
# ==========================================
Write-Host "`n=== 9. SEARCH HISTORY ===" -ForegroundColor Magenta

# 9.1 Get search history
Test-Endpoint -Category "Search History" -Name "Get Search History" -Url "$baseUrl/search-history" -AuthToken $token -ExpectedStatus 200

# 9.2 Add search entry
Test-Endpoint -Category "Search History" -Name "Add Search Entry" -Method "POST" -Url "$baseUrl/search-history" -AuthToken $token -Body '{"query": "cardiologist"}' -ExpectedStatus 200

# 9.3 Clear search history
Test-Endpoint -Category "Search History" -Name "Clear Search History" -Method "DELETE" -Url "$baseUrl/search-history" -AuthToken $token -ExpectedStatus 200

# ==========================================
# 10. ADMIN TESTS (should fail for patient)
# ==========================================
Write-Host "`n=== 10. ADMIN ===" -ForegroundColor Magenta

# 10.1 Get admin dashboard (should get 403)
Test-Endpoint -Category "Admin" -Name "Dashboard - Patient Role" -Url "$baseUrl/admin/dashboard" -AuthToken $token -ExpectedStatus 403

# 10.2 Get all users (should get 403)
Test-Endpoint -Category "Admin" -Name "All Users - Patient Role" -Url "$baseUrl/admin/users" -AuthToken $token -ExpectedStatus 403

# 10.3 Get all appointments (should get 403)
Test-Endpoint -Category "Admin" -Name "All Appointments - Patient Role" -Url "$baseUrl/admin/appointments" -AuthToken $token -ExpectedStatus 403

# 10.4 Admin without token (should get 401)
Test-Endpoint -Category "Admin" -Name "Dashboard - No Auth" -Url "$baseUrl/admin/dashboard" -ExpectedStatus 401

# ==========================================
# 11. FILE UPLOAD TESTS
# ==========================================
Write-Host "`n=== 11. FILE UPLOAD ===" -ForegroundColor Magenta

# 11.1 Upload photo
$photoPath = "$env:TEMP\test_photo.jpg"
# Create a small test file
[System.IO.File]::WriteAllBytes($photoPath, [byte[]](1..100))

Test-Endpoint -Category "Upload" -Name "Upload Photo" -Method "POST" -Url "$baseUrl/upload/photo" -AuthToken $token -Body "test" -ExpectedStatus 200

# ==========================================
# 12. PUBLIC ENDPOINTS
# ==========================================
Write-Host "`n=== 12. PUBLIC ENDPOINTS ===" -ForegroundColor Magenta

# 12.1 Root endpoint
Test-Endpoint -Category "Public" -Name "Root" -Url "$baseUrl/" -ExpectedStatus 200

# 12.2 Health check
Test-Endpoint -Category "Public" -Name "Health Check" -Url "$baseUrl/health" -ExpectedStatus 200

# 12.3 Forgot password
Test-Endpoint -Category "Public" -Name "Forgot Password" -Method "POST" -Url "$baseUrl/auth/forgot-password" -Body '{"email": "tester@gmail.com"}' -ExpectedStatus 200

# ==========================================
# GENERATE REPORT
# ==========================================
Write-Host "`n`n================================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Total Tests: $global:totalTests" -ForegroundColor White
Write-Host "Passed: $global:passed" -ForegroundColor Green
Write-Host "Failed: $global:failed" -ForegroundColor Red
Write-Host "Warnings: $global:warnings" -ForegroundColor Yellow

# Calculate pass rate
if ($global:totalTests -gt 0) {
    $passRate = [math]::Round(($global:passed / $global:totalTests) * 100, 1)
    Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if($passRate -ge 80){"Green"}elseif($passRate -ge 50){"Yellow"}else{"Red"})
}

# Save results for report generation
$global:results | Export-Csv -Path "$PSScriptRoot\test_results.csv" -NoTypeInformation
Write-Host "`nResults saved to: $PSScriptRoot\test_results.csv" -ForegroundColor Cyan
