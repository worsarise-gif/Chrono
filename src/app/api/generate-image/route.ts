import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys, withFallback } from '@/lib/apiFallback.server';
import { verifySession } from '@/lib/auth';

async function generateWithModel(model: string, prompt: string, width?: number, height?: number) {
  const keys = getApiKeys('cloudflare');

  return await withFallback(keys, async (keyObj: any) => {
    const url = `https://api.cloudflare.com/client/v4/accounts/${keyObj.accountId}/ai/run/${model}`;
    const payload: any = { prompt };
    if (width) payload.width = width;
    if (height) payload.height = height;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyObj.token}`,
        'Content-Type': 'application/json',
        'Accept': 'image/png'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Cloudflare API error (${response.status}): ${err}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (data.result && data.result.image) {
        const buffer = Buffer.from(data.result.image, 'base64');
        return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      }
      throw new Error('Invalid JSON response format from Cloudflare');
    }

    return await response.arrayBuffer();
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, width, height } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });

    let imageBuffer;
    try {
      imageBuffer = await generateWithModel('@cf/stabilityai/stable-diffusion-xl-base-1.0', prompt, width, height);
    } catch (primaryError) {
      console.warn('Primary model failed, trying fallback...', primaryError);
      try {
        imageBuffer = await generateWithModel('@cf/bytedance/stable-diffusion-xl-lightning', prompt, width, height);
      } catch (fallbackError: any) {
        console.error('Fallback model also failed:', fallbackError);
        if (fallbackError.message && (fallbackError.message.includes('429') || fallbackError.message.includes('quota'))) {
           return NextResponse.json({ error: 'QUOTA_EXCEEDED' }, { status: 429 });
        }
        return NextResponse.json({ error: 'GENERATION_FAILED' }, { status: 500 });
      }
    }

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error('Image generation route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
