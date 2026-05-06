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
    const { model, messages, stream, apiTier, ...rest } = body;

    if (!model || !messages) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const keys = getApiKeys('cloudflare');

    return await withFallback(keys, async (keyObj: any) => {
      const url = `https://api.cloudflare.com/client/v4/accounts/${keyObj.accountId}/ai/v1/chat/completions`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyObj.token}`
        },
        body: JSON.stringify({
          model,
          messages,
          stream: !!stream,
          ...rest
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare API Error ${response.status}: ${errorText}`);
      }

      if (stream) {
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
    }, undefined, apiTier);
  } catch (error: any) {
    console.error('Cloudflare Proxy error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
