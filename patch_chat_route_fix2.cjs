const fs = require('fs');

let code = fs.readFileSync('src/app/api/chat/route.ts', 'utf8');

code = code.replace(/import { adminDb } from '@\/lib\/firebaseAdmin';/, "import { db } from '@/lib/firebaseAdmin';");
code = code.replace(/await adminDb.doc/g, 'await db.doc');

// Fix the promise type error in withProviderFallback array
// withProviderFallback takes an array of functions that return a Promise.
// Our generator functions return AsyncGenerator, not Promise.
// So the fallback functions should just return the provider name and model, and then we stream it afterwards,
// OR withProviderFallback should just return the AsyncGenerator directly!
// Wait, an async generator function returns an AsyncGenerator when called, but it doesn't return a Promise!
// So we can wrap them in an async function that returns the AsyncGenerator!
// `() => Promise.resolve(openAIProviderStream(...))`

code = code.replace(/const aiStream = await withRetry\(\(\) => \n\s*withProviderFallback\(\[ \n\s*\(\) => openAIProviderStream/g,
`const aiStream = await withRetry(() =>
                withProviderFallback([
                  () => Promise.resolve(openAIProviderStream`);

code = code.replace(/\(\) => openAIProviderStream/g, "() => Promise.resolve(openAIProviderStream");
code = code.replace(/\(\) => googleProviderStream/g, "() => Promise.resolve(googleProviderStream");

// Update 'chunk of aiStream' type error
code = code.replace(/for await \(const chunk of aiStream\) \{/g, `for await (const chunk of aiStream as AsyncGenerator<string, void, unknown>) {`);

fs.writeFileSync('src/app/api/chat/route.ts', code);
console.log('src/app/api/chat/route.ts types fixed');
