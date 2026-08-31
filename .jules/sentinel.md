## 2025-02-27 - Missing Authentication on Search API
**Vulnerability:** The `/api/search` POST endpoint was missing authentication, allowing unauthenticated users to trigger potentially expensive vector searches and legacy web searches without a valid session.
**Learning:** Endpoints mapped to external services like Tavily/web search were missing the standard `verifySession` check that is present in chat and image generation endpoints, potentially due to oversight when creating utility endpoints.
**Prevention:** Always implement `const session = await verifySession(req);` as the first step in any serverless API route that performs computationally expensive operations or proxy requests to external APIs.
