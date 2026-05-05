import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys, withFallback } from '@/lib/apiFallback.server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const provider = req.headers.get('x-provider') || 'groq';

    const keys = getApiKeys(provider as any);

    return await withFallback(keys, async (apiKey: string) => {
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transcription API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    });
  } catch (error: any) {
    console.error('Transcription Proxy error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
