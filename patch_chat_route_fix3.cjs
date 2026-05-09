const fs = require('fs');

let code = fs.readFileSync('src/app/api/chat/route.ts', 'utf8');

code = code.replace(/\(\) => Promise\.resolve\(openAIProviderStream\('https:\/\/api\.groq\.com\/openai\/v1\/chat\/completions', groqKey, 'llama3-8b-8192', messages, req\.signal\),/g,
  "() => Promise.resolve(openAIProviderStream('https://api.groq.com/openai/v1/chat/completions', groqKey, 'llama3-8b-8192', messages, req.signal)),");

code = code.replace(/\(\) => Promise\.resolve\(googleProviderStream\(geminiKey, 'gemini-2.5-flash', messages, req\.signal\),/g,
  "() => Promise.resolve(googleProviderStream(geminiKey, 'gemini-2.5-flash', messages, req.signal)),");

code = code.replace(/\(\) => Promise\.resolve\(openAIProviderStream\('https:\/\/api\.cerebras\.ai\/v1\/chat\/completions', cerebrasKey, 'llama3\.1-8b', messages, req\.signal\),/g,
  "() => Promise.resolve(openAIProviderStream('https://api.cerebras.ai/v1/chat/completions', cerebrasKey, 'llama3.1-8b', messages, req.signal)),");

code = code.replace(/\(\) => Promise\.resolve\(openAIProviderStream\(\`https:\/\/api\.cloudflare\.com\/client\/v4\/accounts\/\$\{cfCreds\.accountId\}\/ai\/v1\/chat\/completions\`, cfCreds\.apiKey as string, '@cf\/meta\/llama-3-8b-instruct', messages, req\.signal\),/g,
  "() => Promise.resolve(openAIProviderStream(`https://api.cloudflare.com/client/v4/accounts/${cfCreds.accountId}/ai/v1/chat/completions`, cfCreds.apiKey as string, '@cf/meta/llama-3-8b-instruct', messages, req.signal)),");

fs.writeFileSync('src/app/api/chat/route.ts', code);
