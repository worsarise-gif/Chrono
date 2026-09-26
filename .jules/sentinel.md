## 2025-03-05 - Fix User Enumeration in Password Reset
**Vulnerability:** Password reset endpoint allowed user enumeration by leaking `auth/user-not-found` errors and exposed internal system errors via `error?.message` on 500 responses.
**Learning:** Firebase `generatePasswordResetLink` throws when a user doesn't exist, which can be used to scan for valid accounts if the error reaches the client. Catch-all blocks that pass `error.message` to HTTP responses also risk leaking infrastructure details.
**Prevention:** Always return a generic success message for password reset endpoints regardless of user existence. Never pass raw `error.message` from catch blocks to client HTTP responses in production.
