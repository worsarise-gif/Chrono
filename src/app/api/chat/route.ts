import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys, withFallback } from '@/lib/apiFallback.server';
import { verifySession } from '@/lib/auth';
import { enqueueChat, enqueueFront, queueDepth } from '@/lib/chatQueue';
import { withRetry, isRateLimitError } from '@/lib/withRetry';
import { withProviderFallback } from '@/lib/providerFallback';
import { db } from '@/lib/firebaseAdmin';

// Eagerly evaluated fetch inside the promise to catch network/auth errors immediately
async function openAIProviderStream(url: string, apiKey: string, model: string, messages: any[], signal?: AbortSignal, isStream: boolean = true) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, stream: isStream }),
    signal
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw Object.assign(new Error(`API Error ${res.status}: ${errorText}`), { status: res.status });
  }

  if (!isStream) {
    const data = await res.json();
    return (async function* () {
      yield data.choices?.[0]?.message?.content || data.response || '';
    })();
  }
  return (async function* () {
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No reader available');
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
          try {
            const data = JSON.parse(trimmedLine.slice(6));
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              yield data.choices[0].delta.content;
            } else if (data.response) {
               yield data.response;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    }
  })();
}

async function googleProviderStream(apiKey: string, model: string, messages: any[], signal?: AbortSignal, isStream: boolean = true) {
  // Using the OpenAI compatibility endpoint for Gemini
  return openAIProviderStream(
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    apiKey,
    model,
    messages,
    signal,
    isStream
  );
}

const getFirstKey = (provider: 'groq' | 'gemini' | 'cerebras' | 'cloudflare') => {
  const keys = getApiKeys(provider as any);
  if (!keys || keys.length === 0) throw new Error(`No keys for ${provider}`);
  const keyObj = keys[0];
  if (provider === 'cloudflare') return { accountId: keyObj.accountId, apiKey: keyObj.token };
  return { apiKey: typeof keyObj === 'string' ? keyObj : keyObj.key };
};

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.uid;

    const body = await req.json();
    const { provider, model, messages, stream, apiTier, streamingMessageDocRef, ...rest } = body;

    if (!messages) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (stream === false) {
      try {
        const groqKey = getFirstKey('groq').apiKey;
        const geminiKey = getFirstKey('gemini').apiKey;
        const cerebrasKey = getFirstKey('cerebras').apiKey;
        const cfCreds = getFirstKey('cloudflare');

        const aiStream = await withRetry(() =>
          withProviderFallback([
            () => openAIProviderStream('https://api.groq.com/openai/v1/chat/completions', groqKey, 'llama3-8b-8192', messages, req.signal, stream),
            () => googleProviderStream(geminiKey, 'gemini-2.5-flash', messages, req.signal, stream),
            () => openAIProviderStream('https://api.cerebras.ai/v1/chat/completions', cerebrasKey, 'llama3.1-8b', messages, req.signal, stream),
            () => openAIProviderStream(`https://api.cloudflare.com/client/v4/accounts/${cfCreds.accountId}/ai/v1/chat/completions`, cfCreds.apiKey as string, '@cf/meta/llama-3-8b-instruct', messages, req.signal, stream),
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

    if (queueDepth(userId) >= 3) { // MAX_QUEUED is 3
      const encoder = new TextEncoder();
      const silent = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });
      return new Response(silent, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
      });
    }

    let controllerInstance: ReadableStreamDefaultController | null = null;
    let resolveTaskFn: () => void = () => {};
    let accumulatedContent = '';

    const streamRes = new ReadableStream({
      start(controller) {
        controllerInstance = controller;
      },
      cancel() {
        resolveTaskFn();
      }
    });

    const encoder = new TextEncoder();

    let retryAttempts = 0;
    const MAX_RETRIES = 2; // Frontend retries at the queue level if transient error escapes withRetry

    const runStreamTask = async (): Promise<void> => {
      try {
        const groqKey = getFirstKey('groq').apiKey;
        const geminiKey = getFirstKey('gemini').apiKey;
        const cerebrasKey = getFirstKey('cerebras').apiKey;
        const cfCreds = getFirstKey('cloudflare');

        const aiStream = await withRetry(() =>
          withProviderFallback([
            () => openAIProviderStream('https://api.groq.com/openai/v1/chat/completions', groqKey, 'llama3-8b-8192', messages, req.signal, stream),
            () => googleProviderStream(geminiKey, 'gemini-2.5-flash', messages, req.signal, stream),
            () => openAIProviderStream('https://api.cerebras.ai/v1/chat/completions', cerebrasKey, 'llama3.1-8b', messages, req.signal, stream),
            () => openAIProviderStream(`https://api.cloudflare.com/client/v4/accounts/${cfCreds.accountId}/ai/v1/chat/completions`, cfCreds.apiKey as string, '@cf/meta/llama-3-8b-instruct', messages, req.signal, stream),
          ])
        );

        for await (const chunk of aiStream) {
          accumulatedContent += chunk;
          if (controllerInstance) {
            controllerInstance.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`));
          }
        }

        if (streamingMessageDocRef) {
          try {
             await db.doc(streamingMessageDocRef).update({ isStreaming: false, content: accumulatedContent });
          } catch(e) {}
        }

        if (controllerInstance) {
          controllerInstance.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controllerInstance.close();
        }
        resolveTaskFn();
      } catch (err) {
        // If transient failure, enqueue front
        if (retryAttempts < MAX_RETRIES) {
          retryAttempts++;
          enqueueFront(userId, async () => {
             await runStreamTask();
          });
          resolveTaskFn(); // Complete the current failed slot
          return;
        }

        if (streamingMessageDocRef) {
          await db.doc(streamingMessageDocRef)
            .update({ isStreaming: false, content: accumulatedContent || '' })
            .catch(() => {});
        }
        if (controllerInstance) {
          controllerInstance.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controllerInstance.close();
        }
        resolveTaskFn();
      }
    };

    const enqueuePromise = enqueueChat(userId, () => new Promise<void>((resolve, reject) => {
       resolveTaskFn = resolve;
       runStreamTask();
    }));

    // If enqueue immediately failed (e.g., race condition), return empty done stream
    enqueuePromise.catch(e => {
       if (controllerInstance) {
          controllerInstance.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controllerInstance.close();
       }
    });

    return new Response(streamRes, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
