import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys, withFallback } from '@/lib/apiFallback.server';
import { verifySession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { provider, model, messages, stream, ...rest } = body;

    if (!provider || !model || !messages) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let targetUrl = '';
    if (provider === 'groq') {
      targetUrl = 'https://api.groq.com/openai/v1/chat/completions';
    } else if (provider === 'cerebras') {
      targetUrl = 'https://api.cerebras.ai/v1/chat/completions';
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const keys = getApiKeys(provider as any);

    return await withFallback(keys, async (apiKey: string) => {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          stream: !!stream,
          ...rest
        }),
        signal: req.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      if (stream) {
        // Return the stream directly
        return new NextResponse(response.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } else {
        const data = await response.json();
        return NextResponse.json(data);
      }
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
