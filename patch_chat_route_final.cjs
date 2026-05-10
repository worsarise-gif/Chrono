const fs = require('fs');

const path = 'src/app/api/chat/route.ts';
let content = fs.readFileSync(path, 'utf8');

// The replacement logic:
// Right before `if (queueDepth(userId) >= 3) {`, we insert a check for `stream === false`.
// If it's false, we bypass the queue, await the completion directly, and return JSON.

const target = `    if (queueDepth(userId) >= 3) { // MAX_QUEUED is 3`;

const replacement = `    if (stream === false) {
      try {
        const groqKey = getFirstKey('groq').apiKey;
        const geminiKey = getFirstKey('gemini').apiKey;
        const cerebrasKey = getFirstKey('cerebras').apiKey;
        const cfCreds = getFirstKey('cloudflare');

        const aiStream = await withRetry(() =>
          withProviderFallback([
            () => openAIProviderStream('https://api.groq.com/openai/v1/chat/completions', groqKey, 'llama3-8b-8192', messages, req.signal),
            () => googleProviderStream(geminiKey, 'gemini-2.5-flash', messages, req.signal),
            () => openAIProviderStream('https://api.cerebras.ai/v1/chat/completions', cerebrasKey, 'llama3.1-8b', messages, req.signal),
            () => openAIProviderStream(\`https://api.cloudflare.com/client/v4/accounts/\${cfCreds.accountId}/ai/v1/chat/completions\`, cfCreds.apiKey as string, '@cf/meta/llama-3-8b-instruct', messages, req.signal),
          ])
        );

        let accumulatedContent = '';
        for await (const chunk of aiStream) {
          accumulatedContent += chunk;
        }

        return NextResponse.json({
          choices: [{
            message: {
              content: accumulatedContent
            }
          }]
        });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Error processing non-stream chat' }, { status: 500 });
      }
    }

    if (queueDepth(userId) >= 3) { // MAX_QUEUED is 3`;

content = content.replace(target, replacement);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched successfully");
