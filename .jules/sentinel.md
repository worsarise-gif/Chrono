## 2025-03-01 - Prevent Information Leakage and User Enumeration in Auth Endpoints
**Vulnerability:**
1. **User Enumeration**: The password reset endpoint leaked whether a user existed by directly returning errors for `auth/user-not-found`, which could allow attackers to build lists of registered users.
2. **Information Exposure**: Auth endpoints (`reset-password`, `send-otp`, `verify-otp`) were exposing internal error details to clients via 500 error responses (`error?.message`), which could disclose sensitive backend or database information.

**Learning:**
It is important to remember that error handling for endpoints, particularly around authentication, can inadvertently expose internal state to the end user. Firebase Auth throws explicit errors like `auth/user-not-found` that need to be carefully handled to avoid user enumeration.

**Prevention:**
1. Catch the `auth/user-not-found` error during password reset operations and return a generic success message so that the response looks identical whether the email exists or not.
2. Never pass internal error messages (like `error?.message`) directly to the client in a 500 server error response. Provide a generalized, secure error message instead.