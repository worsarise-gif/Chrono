## 2024-03-24 - [Missing Authentication on API Endpoint]
**Vulnerability:** The `/api/search` endpoint was missing authentication, allowing unauthenticated users to perform search queries.
**Learning:** This happened because the `verifySession` function was imported but not used within the endpoint logic, highlighting a gap in verifying authentication requirements for all API routes.
**Prevention:** Always ensure that all sensitive or resource-intensive API routes explicitly verify the user's session before processing the request, even if authentication utility functions are already imported.
