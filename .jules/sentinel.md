## 2025-02-18 - Missing Authentication Check
**Vulnerability:** The search API endpoint imported `verifySession` but failed to call it, allowing unauthenticated access to potentially sensitive functionality and consuming backend resources without authorization.
**Learning:** Even if an authentication utility is imported into a route file, it does not provide security unless explicitly called and its result checked to enforce access control.
**Prevention:** Implement automated linting rules or code review checks to ensure all serverless API routes that import authentication functions actually invoke them and handle unauthorized states before processing any request body.
