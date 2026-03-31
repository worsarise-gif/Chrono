import { NextRequest, NextResponse } from 'next/server';

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '2215383dfc48baa1df7666821342db26';
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || 'cfut_0IxFXq61q0R2HHpsQ2DBoCC8M19ilcDvae9nnEZn53ed73dd';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model, messages, stream, ...rest } = body;

    if (!model || !messages) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/v1/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CF_API_TOKEN}`
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
      return NextResponse.json({ error: `Cloudflare API Error ${response.status}: ${errorText}` }, { status: response.status });
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
  } catch (error: any) {
    console.error('Cloudflare Proxy error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
