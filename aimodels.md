# AI Model Usage Report

This document exhaustively details the usage of all AI models throughout the system, tracing execution paths, abstraction layers, and fallback chains.

## 1. Overview and Providers
The system uses models from the following providers:
- **Groq** (Primary provider for LLMs and vision)
- **Cerebras** (Secondary/Fallback for LLMs, used for latency-sensitive background tasks)
- **Google / Gemini** (Used for summarization, formatting, and routing logic fallbacks)
- **Cloudflare** (Used for Image Generation)

API key management and environment variable resolution are handled via `src/lib/apiFallback.ts`, which cycles through multiple keys (e.g. `NEXT_PUBLIC_GROQ_API_KEY`, `NEXT_PUBLIC_GROQ_API_KEY_SECONDARY`, `NEXT_PUBLIC_GROQ_API_KEY_TERTIARY`) using a `withFallback` circuit breaker logic. The backend API routes (`/api/chat`, `/api/cloudflare-chat`, `/api/generate-image`) act as proxies to hide these keys and handle cross-origin constraints.

---

## 2. Feature-by-Feature Model Tracing

### 2.1 Chat Routing (`mode === 'auto'`)
* **File:** `src/components/ChatArea.tsx`
* **Entry Point:** `handleSubmit`
* **Execution Path:**
  1. If `mode === 'auto'` and the message is text-only, a routing prompt is created.
  2. The prompt is sent via `callGroqChatNonStream`.
* **Primary Model:** `llama-3.1-8b-instant`
* **Provider:** Groq
* **Fallback:** If routing fails, it defaults to the `fast` classification.

### 2.2 Main Chat Execution: Fast Mode (`classification === 'fast'`)
* **File:** `src/components/ChatArea.tsx`
* **Entry Point:** `executeWithTimeoutAndFallback` inside `handleSubmit`
* **Dynamic Load Balancing:** Fast mode splits traffic randomly:
  - **Path A (25% probability):**
    - **Primary Model:** `llama-3.1-8b-instant` (Groq via `callOpenAIStream` to `/api/chat` using `https://api.groq.com/openai/v1/chat/completions`)
    - **Fallback Model:** `gemini-3-flash-preview` (Gemini via SDK `aiFallback.models.generateContentStream`)
  - **Path B (75% probability):**
    - **Primary Model:** `gemini-3-flash-preview` (Gemini via SDK `aiFallback.models.generateContentStream`)
    - **Fallback Model:** `llama-3.1-8b-instant` (Groq via `callOpenAIStream` to `/api/chat` using `https://api.groq.com/openai/v1/chat/completions`)

### 2.3 Main Chat Execution: Pro Mode (`classification === 'pro'`)
* **File:** `src/components/ChatArea.tsx`
* **Entry Point:** `executeWithTimeoutAndFallback` inside `handleSubmit`
* **Primary Model:** `llama-3.3-70b-versatile` (Groq via `callOpenAIStream`)
* **Fallback Chain:**
  1. **Fallback 1:** `llama-3.1-70b-versatile` (Groq via `callOpenAIStream`)
  2. **Fallback 2:** `llama3.1-70b` (Cerebras via `callOpenAIStream` to `https://api.cerebras.ai/v1/chat/completions`)

### 2.4 Main Chat Execution: Image Recognition / Vision (`classification === 'image'`)
* **File:** `src/components/ChatArea.tsx`
* **Entry Point:** `executeWithTimeoutAndFallback` inside `handleSubmit`
* **Primary Model:** `llama-3.2-11b-vision-preview` (Groq via `callOpenAIStream`)
* **Fallback Model:** `gemini-3-flash-preview` (Gemini via SDK `aiFallback.models.generateContentStream`)

### 2.5 Image Generation
* **Files:** `src/components/ChatArea.tsx`, `src/app/api/generate-image/route.ts`
* **Execution Path:**
  1. The user asks to generate an image.
  2. **Aspect Ratio Extraction:** In `ChatArea.tsx`, `llama-3.1-8b-instant` (Groq via `callGroqChatNonStream`) is called to extract the aspect ratio from the prompt.
  3. A POST request is sent to `/api/generate-image`.
  4. In `route.ts`, `generateWithModel` calls the Cloudflare AI REST API.
* **Primary Image Generation Model:** `@cf/stabilityai/stable-diffusion-xl-base-1.0` (Cloudflare)
* **Fallback Image Generation Model:** `@cf/bytedance/stable-diffusion-xl-lightning` (Cloudflare)

### 2.6 Background Tasks: Smart Title Generation
* **File:** `src/components/ChatArea.tsx`
* **Function:** `generateSmartTitle`
* **Purpose:** Generates a 5-8 word title for new chats.
* **Primary Model:** `gemini-3-flash-preview` (Gemini via SDK `generateContent`)
* **Fallback Model:** `llama3.1-8b` (Cerebras via `callCerebrasNonStream` to `/api/chat`)

### 2.7 Background Tasks: Chat History Summarization
* **File:** `src/components/ChatArea.tsx`
* **Entry Point:** `handleSubmit` (triggered when chat history > 6 messages)
* **Purpose:** Summarizes older messages to reduce token usage.
* **Primary Model:** `llama3.1-8b` (Cerebras via `callCerebrasNonStream`)
* **Fallback Chain:**
  1. **Fallback 1:** `llama-3.3-70b-versatile` (Groq via `callGroqChatNonStream`)
  2. **Fallback 2:** `gemini-1.5-pro` (Gemini via SDK `generateContent`)

### 2.8 Background Tasks: Next-Prompt Recommendations
* **File:** `src/components/ChatArea.tsx`
* **Function:** `generateRecommendations`
* **Purpose:** Suggests 2 follow-up questions for the user based on their last prompt.
* **Model:** `llama3.1-8b` (Cerebras via `callCerebrasNonStream`)
* **Fallback:** None. Fails silently if it errors out.

### 2.9 Search Mode / Search Formatting
* **File:** `src/components/ChatArea.tsx`
* **Entry Point:** `classification === 'search'` inside `handleSubmit`
* **Purpose:** The system searches the web (using Tavily API via `/api/search`), and an LLM formats the results.
* **Primary Model:** `gemini-3-flash-preview` (Gemini via SDK `generateContent`)
* **Fallback Model:** `llama3.1-8b` (Cerebras via `callCerebrasNonStream`)

### 2.10 Unused or Deprecated Integrations
* **Audio Transcription:** The function `callGroqTranscription` is defined in `src/components/ChatArea.tsx` (using an unspecified model passed as an argument to `/api/transcribe`), but tracing shows it is **NOT** invoked anywhere in the codebase, and the `/api/transcribe` route does not exist. Marked as UNUSED.
* **Cloudflare Text Stream:** The function `callCloudflareStream` exists in `src/components/ChatArea.tsx` and routes to `/api/cloudflare-chat`, but it is **NOT** invoked anywhere in the codebase. Marked as UNUSED.

---

## 3. Configuration & Fallback Summary
All API keys are resolved in `src/lib/apiFallback.ts`.

### Provider API Routing Table
| Provider | Wrapper / Path | Base URL / SDK |
|----------|----------------|----------------|
| Groq | `callOpenAIStream`, `callGroqChatNonStream` | `/api/chat` -> `https://api.groq.com/openai/v1/chat/completions` |
| Cerebras | `callOpenAIStream`, `callCerebrasNonStream` | `/api/chat` -> `https://api.cerebras.ai/v1/chat/completions` |
| Gemini | Direct SDK Usage | `@google/genai` (Client-side) |
| Cloudflare | `generateWithModel` | `https://api.cloudflare.com/client/v4/accounts/.../ai/run/...` |

### General Fallback Triggers
The `executeWithTimeoutAndFallback` wrapper dictates fallback behavior during the main chat execution. Fallbacks are triggered on:
- Hard Errors: HTTP 500s, 502s, network failures.
- Rate Limits/Quota: HTTP 429s, or error strings containing "quota".
- TTFT (Time To First Token) Timeout: Stalls > 20000ms (Pro) or > 10000ms (Fast) before the first chunk is received.
- Stream Stall Timeout: Stalls > 15000ms (Pro) or > 10000ms (Fast) between chunks.
- Max Duration Timeout: If the total request takes > 90000ms (Pro/Image) or > 45000ms (Fast).

Note: Client errors (400, 413) **abort** the fallback sequence immediately.
