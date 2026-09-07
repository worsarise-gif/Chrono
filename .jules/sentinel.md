
## 2024-11-20 - Prevent User Enumeration in Password Reset
**Vulnerability:** The password reset endpoint leaked information about whether an email existed in the system by returning an error if the user was not found, enabling user enumeration attacks. It also exposed internal error messages in 500 responses.
**Learning:** Password reset and similar authentication flows must return generic success messages regardless of whether the user exists. Error messages should never be passed directly to the client.
**Prevention:** Catch `auth/user-not-found` errors and return a 200 success response. Always use generic error strings for 500 responses instead of passing `error?.message`.
