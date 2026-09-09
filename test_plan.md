1. **Fix User Enumeration and Info Leakage in `src/app/api/auth/reset-password/route.ts`**
   - Wrap the `auth.generatePasswordResetLink` call in a `try...catch` block.
   - If `error.code === 'auth/user-not-found'`, return a generic 200 success response. This prevents attackers from enumerating which emails are registered on the platform.
   - In the global `catch` block for the route, remove the `error?.message` from the returned JSON so we don't leak internal error details (e.g., SMTP or Firebase admin stack traces).
2. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Run the necessary format, lint, and test commands.
3. **Submit the change**
   - Create a PR with a title indicating the security fixes (e.g. "🛡️ Sentinel: [HIGH] Fix user enumeration and info leakage in reset-password").
