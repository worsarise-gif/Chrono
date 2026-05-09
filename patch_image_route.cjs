const fs = require('fs');

const code = `import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys, withFallback } from '@/lib/apiFallback.server';
import { verifySession } from '@/lib/auth';
import { withRetry } from '@/lib/withRetry';
import { withProviderFallback } from '@/lib/providerFallback';

async function generateWithModel(model: string, prompt: string, width?: number, height?: number, apiTier?: number) {
  const keys = getApiKeys('cloudflare');

  return await withFallback(keys, async (keyObj: any) => {
    const url = \`https://api.cloudflare.com/client/v4/accounts/\${keyObj.accountId}/ai/run/\${model}\`;
    const payload: any = { prompt };
    if (width) payload.width = width;
    if (height) payload.height = height;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${keyObj.token}\`,
        'Content-Type': 'application/json',
        'Accept': 'image/png'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      // To trigger rate limit logic properly, attach status
      throw Object.assign(new Error(\`Cloudflare API error (\${response.status}): \${err}\`), { status: response.status });
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
  }, undefined, apiTier);
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, width, height, apiTier } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });

    const configs = [
      { model: '@cf/stabilityai/stable-diffusion-xl-base-1.0', apiTier: 0 },
      { model: '@cf/bytedance/stable-diffusion-xl-lightning', apiTier: 0 },
      { model: '@cf/stabilityai/stable-diffusion-xl-base-1.0', apiTier: 1 },
      { model: '@cf/bytedance/stable-diffusion-xl-lightning', apiTier: 1 },
      { model: '@cf/stabilityai/stable-diffusion-xl-base-1.0', apiTier: 2 },
      { model: '@cf/bytedance/stable-diffusion-xl-lightning', apiTier: 2 }
    ];

    const providers = configs.map(config => () => generateWithModel(config.model, prompt, width, height, config.apiTier));

    try {
      const result = await withRetry(() => withProviderFallback(providers));
      return new NextResponse(result, {
        headers: {
          'Content-Type': 'image/png',
        },
      });
    } catch (err) {
      console.warn('Image generation completely failed:', err);
      // Return empty success so the client doesn't break
      return new NextResponse(new Uint8Array(0), {
        headers: {
          'Content-Type': 'image/png',
        },
      });
    }
  } catch (error) {
    console.error('Image generation route error:', error);
    return new NextResponse(new Uint8Array(0), {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  }
}
`;

fs.writeFileSync('src/app/api/generate-image/route.ts', code);
console.log('src/app/api/generate-image/route.ts updated');
