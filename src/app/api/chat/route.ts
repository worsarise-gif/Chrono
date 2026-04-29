import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, apiKey, model, messages, stream, ...rest } = body;

    if (!url || !apiKey || !model || !messages) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const response = await fetch(url, {
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
      return NextResponse.json({ error: `API Error ${response.status}: ${errorText}` }, { status: response.status });
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
    console.error('Proxy error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
