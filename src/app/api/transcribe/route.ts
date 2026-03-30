import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const model = formData.get('model');
    const apiKey = formData.get('apiKey');

    if (!file || !model || !apiKey) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const groqFormData = new FormData();
    groqFormData.append('file', file);
    groqFormData.append('model', model);
    
    const prompt = formData.get('prompt');
    if (prompt) {
      groqFormData.append('prompt', prompt);
    }
    
    const language = formData.get('language');
    if (language) {
      groqFormData.append('language', language);
    }

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: groqFormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Groq Transcription Error: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Transcription proxy error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
