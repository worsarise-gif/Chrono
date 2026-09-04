## 2026-09-04 - Missing Authentication on Search API
**Vulnerability:** The `/api/search` endpoint lacked session verification, allowing unauthenticated users to perform vector/web searches.
**Learning:** Ensure imported auth utilities like `verifySession` are actually invoked and their results checked in API routes.
**Prevention:** Implement mandatory auth middleware for all `/api/*` routes or enforce strict linting rules for unused imports.
