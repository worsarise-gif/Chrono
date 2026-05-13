```mermaid
flowchart TD
    %% Define styles for nodes
    classDef userAction fill:#f9d0c4,stroke:#333,stroke-width:2px;
    classDef clientState fill:#c4e1f9,stroke:#333,stroke-width:2px;
    classDef database fill:#d0f9c4,stroke:#333,stroke-width:2px;
    classDef apiRoute fill:#f9c4e1,stroke:#333,stroke-width:2px;
    classDef externalAPI fill:#f9f5c4,stroke:#333,stroke-width:2px;

    %% Client Entry & Auth
    Start([User visits App]) --> RootLayout[RootLayout (Providers)]
    RootLayout --> AuthProvider{Auth Context: Is User Logged In?}

    %% Unauthenticated Flow
    AuthProvider -- No --> AuthPage[AuthPage UI]
    AuthPage --> LoginSubmit[User submits Credentials / Google Auth]:::userAction
    LoginSubmit --> FirebaseAuth[(Firebase Auth)]:::database
    FirebaseAuth -- Success --> AuthProvider

    %% Authenticated Flow
    AuthProvider -- Yes --> CheckVerification{Is Email Verified?}
    CheckVerification -- No --> VerificationScreen[Show Verification Screen]
    CheckVerification -- Yes --> CheckBan{Is User Banned?}
    CheckBan -- Yes --> BannedScreen[Show Banned Screen]

    %% Main Application Flow
    CheckBan -- No --> ChatLayout[ChatLayout Container]
    ChatLayout --> Sidebar[Sidebar Navigation]

    %% Routing logic based on URL
    ChatLayout --> Router{Next.js Router Path}

    %% Imagine Route
    Router -- /imagine --> ImagineGallery[ImagineGallery Component]
    ImagineGallery --> FetchImages[Fetch GeneratedImages]
    FetchImages --> Firestore[(Firestore: /users/{uid}/generated_images)]:::database
    ImagineGallery --> GenerateImageInput[User Enters Image Prompt]:::userAction
    GenerateImageInput --> GenerateImageAPI[POST /api/imagine]:::apiRoute
    GenerateImageAPI --> FalAI[Fal.ai / External Image Provider]:::externalAPI
    FalAI --> GenerateImageAPI
    GenerateImageAPI --> SaveImage[Save to Firestore]
    SaveImage --> Firestore

    %% Chat Route
    Router -- /chat/{id} or / --> ChatArea[ChatArea Component]
    ChatArea --> ChatContext[ChatContext: Sync currentChatId]
    ChatContext --> FetchMessages[Subscribe to Messages]
    FetchMessages --> FirestoreChats[(Firestore: /users/{uid}/chats/{chatId}/messages)]:::database

    %% Sending Message Flow
    ChatArea --> SendMessage[User sends Message]:::userAction
    SendMessage --> SaveUserMessage[Save User Message to Firestore]
    SaveUserMessage --> FirestoreChats
    SendMessage --> APICall[POST /api/chat]:::apiRoute

    %% Backend API Routing
    APICall --> ProviderFallback[Provider Fallback Router]
    ProviderFallback --> RateLimit[Check Max Queue/Rate Limits]
    RateLimit --> LLMCall[Call LLM API Stream]

    %% Provider Fallbacks
    LLMCall --> GroqAPI[Groq API (Primary)]:::externalAPI
    LLMCall --> GeminiAPI[Gemini API (Fallback 1)]:::externalAPI
    LLMCall --> CerebrasAPI[Cerebras API (Fallback 2)]:::externalAPI
    LLMCall --> CloudflareAPI[Cloudflare API (Fallback 3)]:::externalAPI

    %% Stream back to client
    GroqAPI --> StreamResponse[Stream chunks via SSE]
    GeminiAPI --> StreamResponse
    CerebrasAPI --> StreamResponse
    CloudflareAPI --> StreamResponse

    StreamResponse --> ChatArea
    StreamResponse --> SaveModelMessage[Save Final Model Message to Firestore]
    SaveModelMessage --> FirestoreChats

    %% Real-time update
    FirestoreChats -.->|onSnapshot| ChatArea
```
