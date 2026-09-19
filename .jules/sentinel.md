## 2025-03-09 - Fix User Enumeration in Password Reset
**Vulnerability:** User Enumeration via Password Reset API
**Learning:** The password reset endpoint explicitly returned an error if a user's email was not found in Firebase. This allowed attackers to enumerate registered users by checking for error vs. success responses, confirming user existence in the system. The 500 server error responses also appended `error?.message`, leaking internal application details/errors.
**Prevention:** Implement fail-secure practices by returning a generic success response regardless of user existence. Ensure 500 error catch blocks do not leak raw `error.message` to the client. Always mask backend behavior from unauthenticated users during authentication flows like OTP and password resets.
