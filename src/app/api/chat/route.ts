import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { getApiKeys, withFallback } from '@/lib/apiFallback';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, mode, classification } = await req.json();
    let stream;

    const runGroqModel = async (model: string) => {
      const keys = getApiKeys('groq');
      return withFallback(keys, async (apiKey) => {
        const groq = createOpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey });
        const result = await streamText({ model: groq(model), messages });
        return result.toDataStreamResponse();
      });
    };

    const runCerebrasModel = async (model: string) => {
      const keys = getApiKeys('cerebras');
      return withFallback(keys, async (apiKey) => {
        const cerebras = createOpenAI({ baseURL: 'https://api.cerebras.ai/v1', apiKey });
        const result = await streamText({ model: cerebras(model), messages });
        return result.toDataStreamResponse();
      });
    };

    const runGeminiModel = async (model: string) => {
      const keys = getApiKeys('gemini');
      return withFallback(keys, async (apiKey) => {
        const google = createGoogleGenerativeAI({ apiKey });
        const result = await streamText({ model: google(model), messages });
        return result.toDataStreamResponse();
      });
    };

    const geminiModelStr = 'gemini-1.5-flash';

    if (classification === 'image' || messages.some((m: any) => m.content && Array.isArray(m.content) && m.content.some((c:any) => c.type === 'image' || c.type === 'image_url'))) {
      try { stream = await runGroqModel('llama-3.2-11b-vision-preview'); }
      catch { stream = await runGeminiModel(geminiModelStr); }
    } else if (classification === 'pro' || mode === 'pro') {
      try { stream = await runGroqModel('llama-3.3-70b-versatile'); }
      catch {
        try { stream = await runGroqModel('llama-3.1-70b-versatile'); }
        catch { stream = await runCerebrasModel('llama3.1-70b'); }
      }
    } else if (classification === 'search' || mode === 'search') {
      stream = await runGeminiModel(geminiModelStr);
    } else {
      if (Math.random() < 0.25) {
        try { stream = await runGroqModel('llama-3.1-8b-instant'); }
        catch { stream = await runGeminiModel(geminiModelStr); }
      } else {
        try { stream = await runGeminiModel(geminiModelStr); }
        catch { stream = await runGroqModel('llama-3.1-8b-instant'); }
      }
    }
    if (!stream) throw new Error("All fallback mechanisms failed.");
    return stream;
  } catch (error: any) {
    console.error("Chat API Error:", error.message || "Unknown error");
    return new NextResponse(JSON.stringify({ error: "Failed to generate response." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}