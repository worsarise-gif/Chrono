# Title Generation Feature Report

## Overview
The Smart Title Generation feature automatically creates a concise and memorable title for a chat session based on the initial user message and the AI's response. It runs in the background for new chats without blocking the main chat interface.

## Models & Providers Used

### Primary and Fallback Models
The feature employs a robust fallback strategy prioritizing Cloudflare and falling back to Cerebras, cycling through different API tiers.

The ordered configuration for title generation is:
1. **Provider**: Cloudflare
   - **Model**: `@cf/facebook/bart-large-cnn`
   - **API Tier**: 0
2. **Provider**: Cerebras
   - **Model**: `llama3.1-8b`
   - **API Tier**: 0
3. **Provider**: Cloudflare
   - **Model**: `@cf/facebook/bart-large-cnn`
   - **API Tier**: 1
4. **Provider**: Cerebras
   - **Model**: `llama3.1-8b`
   - **API Tier**: 1
5. **Provider**: Cloudflare
   - **Model**: `@cf/facebook/bart-large-cnn`
   - **API Tier**: 2
6. **Provider**: Cerebras
   - **Model**: `llama3.1-8b`
   - **API Tier**: 2

### Prompt
The system uses the following prompt to ensure high-quality titles:
\`\`\`text
You are an intelligent assistant tasked with generating a **single, concise, and memorable chat title (5–8 words)** for this project.

Rules:
1. Generate the title **only once per session**.
2. Focus on the **main topic, key ideas, or recurring themes** in the conversation.
3. Avoid generic words like "chat", "discussion", or "conversation".
4. If no clear topic is present, fallback to: "Chat on [Date]".
5. Make the title **unique, context-aware, and easy to remember**.

Conversation:
User: "{userMessage}"
AI: "{aiResponse}"

Session Title Status: "false"
\`\`\`

## Implementation Details
- The feature is implemented in `src/components/ChatArea.tsx` under the `generateSmartTitle` function.
- The request is made sequentially over the models and apiTiers. The loop breaks unconditionally on the first successful generated title that is not empty.
- It updates the Firestore database directly using the `updateDoc` method on the specific chat document.
