import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys, withFallback } from '@/lib/apiFallback.server';
import { GoogleGenAI } from '@google/genai';
import { verifySession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { model, contents, config, stream } = body;

    if (!model || !contents) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const keys = getApiKeys('gemini');

    return await withFallback(keys, async (apiKey: string) => {
      const ai = new GoogleGenAI({ apiKey });

      if (stream) {
        const responseStream = await ai.models.generateContentStream({ model, contents, config });

        const readableStream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of responseStream) {
                if (chunk.text) {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
                }
                if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ functionCalls: chunk.functionCalls })}\n\n`));
                }
              }
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          }
        });

        return new NextResponse(readableStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } else {
        const response = await ai.models.generateContent({ model, contents, config });
        return NextResponse.json({ text: response.text });
      }
    });
  } catch (error: any) {
    console.error('Gemini Proxy error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
