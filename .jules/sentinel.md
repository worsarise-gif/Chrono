
## 2024-05-24 - Information Leakage in Auth Endpoints
**Vulnerability:** Authentication endpoints exposed internal error messages in 500 responses and allowed user enumeration via password reset.
**Learning:** Directly passing `error?.message` to the client and failing to catch `auth/user-not-found` can leak sensitive system state.
**Prevention:** Always return generic error messages for 500 responses and handle non-existent users gracefully with generic success messages.
