import { NextResponse } from 'next/server';
import { getApiKeys, withFallback } from '../../../lib/apiFallback';

async function generateWithModel(model: string, prompt: string) {
  const keys = getApiKeys('cloudflare');
  if (keys.length === 0) {
    keys.push({ accountId: '2215383dfc48baa1df7666821342db26', token: 'cfut_0IxFXq61q0R2HHpsQ2DBoCC8M19ilcDvae9nnEZn53ed73dd' });
  }

  return await withFallback(keys, async (keyObj: any) => {
    const url = `https://api.cloudflare.com/client/v4/accounts/${keyObj.accountId}/ai/run/${model}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyObj.token}`,
        'Content-Type': 'application/json',
        'Accept': 'image/png'
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Cloudflare API error (${response.status}): ${err}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (data.result && data.result.image) {
        // Convert base64 string to Uint8Array
        const buffer = Buffer.from(data.result.image, 'base64');
        return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      }
      throw new Error('Invalid JSON response format from Cloudflare');
    }

    return await response.arrayBuffer();
  });
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });

    let imageBuffer;
    try {
      // Primary Model
      imageBuffer = await generateWithModel('@cf/stabilityai/stable-diffusion-xl-base-1.0', prompt);
    } catch (primaryError) {
      console.warn('Primary model failed, trying fallback...', primaryError);
      try {
        // Fallback Model
        imageBuffer = await generateWithModel('@cf/bytedance/stable-diffusion-xl-lightning', prompt);
      } catch (fallbackError: any) {
        console.error('Fallback model also failed:', fallbackError);
        // Check for quota/rate limit
        if (fallbackError.message.includes('429') || fallbackError.message.includes('quota')) {
           return NextResponse.json({ error: 'QUOTA_EXCEEDED' }, { status: 429 });
        }
        return NextResponse.json({ error: 'GENERATION_FAILED' }, { status: 500 });
      }
    }

    // Return the image as a PNG buffer
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
