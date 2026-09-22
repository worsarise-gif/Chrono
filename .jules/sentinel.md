## 2024-05-27 - [Fix authentication info leakage and enumeration]
**Vulnerability:** Authentication endpoints (password reset, OTP generation/verification) leaked internal error messages (e.g., `error?.message`) to clients on 500 status codes, and user enumeration was possible during password reset because `auth/user-not-found` wasn't caught.
**Learning:** Returning `error?.message` directly in Next.js API routes exposes internal stack traces or database errors, and not catching `auth/user-not-found` allows attackers to verify email existence.
**Prevention:** Always return generic error messages on 500 status codes in authentication endpoints. Catch `auth/user-not-found` and return generic success messages to prevent user enumeration.
