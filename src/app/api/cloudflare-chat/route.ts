import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys, withFallback } from '../../../lib/apiFallback';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model, messages, stream, ...rest } = body;

    if (!model || !messages) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const keys = getApiKeys('cloudflare');
    if (keys.length === 0) {
      keys.push({ accountId: '2215383dfc48baa1df7666821342db26', token: 'cfut_0IxFXq61q0R2HHpsQ2DBoCC8M19ilcDvae9nnEZn53ed73dd' });
    }

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
    console.error('Cloudflare Proxy error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
