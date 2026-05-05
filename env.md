# Environment Variables

The following environment variables are required to configure the application. Some of these are used on the client side (prefixed with `NEXT_PUBLIC_`), while others are strictly for the server.

## General
- `APP_URL`: The base URL where this application is hosted (e.g., `https://chronoaiassistant.vercel.app`).

## Email Delivery (Nodemailer)
Used for sending OTPs and custom authentication emails.
- `EMAIL_USER`: The email address (e.g., a Gmail address) used to send emails.
- `EMAIL_PASSWORD`: The app password or standard password for the email account.

## Firebase Client Configuration
These variables configure the Firebase JS SDK for client-side authentication and services.
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API Key.
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain.
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase Project ID.
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase Storage Bucket.
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase Messaging Sender ID.
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase App ID.
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: Firebase Measurement ID.
- `NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID`: Firebase Firestore Database ID (defaults to `(default)` if not specified).

## Firebase Admin SDK
These variables are used by the Next.js server to initialize `firebase-admin` for secure operations. The `FIREBASE_PRIVATE_KEY` must be a valid ASN.1 PEM string with escaped newlines properly formatted.
- `FIREBASE_PROJECT_ID`: Firebase Project ID (can be the same as the client one).
- `FIREBASE_CLIENT_EMAIL`: The service account client email.
- `FIREBASE_PRIVATE_KEY`: The service account private key.

## AI Providers & Fallbacks
The system uses a fallback architecture for API keys. If the primary key hits a rate limit or error, it will automatically fallback to secondary and tertiary keys.

### Gemini AI
Used for summarization, formatting, and other language tasks.
- `GEMINI_API_KEY`: Primary Gemini API Key.
- `GEMINI_API_KEY_SECONDARY`: Secondary Gemini API Key.
- `GEMINI_API_KEY_TERTIARY`: Tertiary Gemini API Key.

### Groq AI
Used for primary chat interactions and vision models.
- `GROQ_API_KEY`: Primary Groq API Key.
- `GROQ_API_KEY_SECONDARY`: Secondary Groq API Key.
- `GROQ_API_KEY_TERTIARY`: Tertiary Groq API Key.

### Cerebras AI
Used for generating smart chat titles and as a general chat fallback.
- `CEREBRAS_API_KEY`: Primary Cerebras API Key.
- `CEREBRAS_API_KEY_SECONDARY`: Secondary Cerebras API Key.
- `CEREBRAS_API_KEY_TERTIARY`: Tertiary Cerebras API Key.

### Cloudflare Workers AI
Used for image generation (Stable Diffusion). Both Account ID and API Token are required for each tier.
- `CLOUDFLARE_ACCOUNT_ID`: Primary Cloudflare Account ID.
- `CLOUDFLARE_API_TOKEN`: Primary Cloudflare API Token.
- `CLOUDFLARE_ACCOUNT_ID_SECONDARY`: Secondary Cloudflare Account ID.
- `CLOUDFLARE_API_TOKEN_SECONDARY`: Secondary Cloudflare API Token.
- `CLOUDFLARE_ACCOUNT_ID_TERTIARY`: Tertiary Cloudflare Account ID.
- `CLOUDFLARE_API_TOKEN_TERTIARY`: Tertiary Cloudflare API Token.

## Web Search Providers & Fallbacks

### Tavily
Used for general web search functionality.
- `TAVILY_API_KEY`: Primary Tavily API Key.
- `TAVILY_API_KEY_SECONDARY`: Secondary Tavily API Key.
- `TAVILY_API_KEY_TERTIARY`: Tertiary Tavily API Key.

### Google Search
Used as an alternative or supplementary web search provider. Both API Key and Custom Search Engine ID (CX) are required for each tier.
- `GOOGLE_API_KEY`: Primary Google API Key.
- `GOOGLE_CX`: Primary Google Custom Search Engine ID.
- `GOOGLE_API_KEY_SECONDARY`: Secondary Google API Key.
- `GOOGLE_CX_SECONDARY`: Secondary Google Custom Search Engine ID.
- `GOOGLE_API_KEY_TERTIARY`: Tertiary Google API Key.
- `GOOGLE_CX_TERTIARY`: Tertiary Google Custom Search Engine ID.
