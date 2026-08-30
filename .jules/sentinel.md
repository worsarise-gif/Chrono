## 2024-11-20 - Missing Authentication Check in API Routes
**Vulnerability:** The `/api/search` route imported `verifySession` but failed to actually call it and validate the user session, exposing the endpoint to unauthenticated access and potential abuse of search functionality.
**Learning:** Security functions that are imported must be explicitly invoked, and their results must be evaluated. In serverless or Next.js route handlers, just importing an auth check doesn't protect the route.
**Prevention:** Always verify that route handlers which are meant to be private actually invoke the authentication logic (`await verifySession(req)`) and correctly return a 401 response if the check fails, before processing any request data.
