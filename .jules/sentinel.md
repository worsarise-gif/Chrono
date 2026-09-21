
## 2024-05-20 - Missing Authentication on API endpoint
**Vulnerability:** The search API endpoint (`src/app/api/search/route.ts`) imported the authentication function `verifySession` but failed to invoke it, leaving the endpoint completely unprotected.
**Learning:** Even if the authentication tool is imported, we must verify that it is actually called and its result handled properly to secure the endpoint.
**Prevention:** Always test endpoints as an unauthenticated user to ensure appropriate 401 responses are returned, and use automated static analysis to flag unused security imports.
