export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  "gemini-1.5-flash": 900000,
  "llama3-70b-8192": 7000,
  "cerebras-default": 7000,
  "cloudflare-default": 6000,
  "default": 6000
};

export function estimateTokens(content: string): number {
  if (!content) return 10;
  return Math.ceil(content.length / 4) + 10;
}

export function buildContextWindow(messages: any[], modelId: string): any[] {
  const limit = MODEL_CONTEXT_LIMITS[modelId] || MODEL_CONTEXT_LIMITS["default"];
  const systemPromptTokens = 1500;
  const reservedOutputTokens = 500;
  const availableBudget = limit - systemPromptTokens - reservedOutputTokens;

  let totalTokens = 0;
  const result = [];
  let truncated = false;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.content);
    if (totalTokens + msgTokens > availableBudget) {
      truncated = true;
      break;
    }
    totalTokens += msgTokens;
    result.unshift(msg);
  }

  if (truncated) {
    result.unshift({
      role: 'user',
      content: '[Note: Earlier conversation context has been summarized to fit model limits.]'
    });
  }

  return result;
}
