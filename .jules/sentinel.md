## 2025-04-14 - Removed hardcoded API keys
**Vulnerability:** Hardcoded Groq and Cerebras API keys found as fallbacks in `src/components/ChatArea.tsx`.
**Learning:** These keys were exposed to the client-side as well since they were in a React component, representing a critical security risk.
**Prevention:** Remove fallback logic that pushes hardcoded strings into the API keys array. Rely solely on environment variables.
