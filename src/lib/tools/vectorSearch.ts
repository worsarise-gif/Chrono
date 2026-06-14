import { getApiKeys, withFallback } from '../apiFallback.server';

export interface VectorSearchResult {
  id: string;
  score: number;
  content: string; // The text content retrieved from Vectorize metadata or KV
}

export async function vectorSearch(query: string): Promise<string> {
  try {
    // STAGE 1: SEMANTIC RETRIEVAL (Vector DB)
    const embeddingModel = '@cf/baai/bge-base-en-v1.5';
    const cloudflareKeys = getApiKeys('cloudflare_vectorize');

    // Convert query to vector and fetch Top 50
    const top50Results = await withFallback(cloudflareKeys, async (keyObj: any) => {
      // 1a. Generate Embedding
      const embedUrl = `https://api.cloudflare.com/client/v4/accounts/${keyObj.accountId}/ai/run/${embeddingModel}`;
      const embedRes = await fetch(embedUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keyObj.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: query })
      });

      if (!embedRes.ok) {
        const errorText = await embedRes.text();
        console.error(`[VectorSearch] Embedding failed. Status: ${embedRes.status}. Payload: ${errorText}`);
        throw new Error(`Embedding failed: ${errorText}`);
      }

      const embedData = await embedRes.json();
      const vector = embedData.result.data[0];

      // 1b. Query Vectorize
      const vectorizeUrl = `https://api.cloudflare.com/client/v4/accounts/${keyObj.accountId}/vectorize/v2/indexes/${keyObj.indexName}/query`;
      const queryRes = await fetch(vectorizeUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keyObj.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector: vector,
          topK: 50,
          returnValues: true,
          returnMetadata: true
        })
      });

      if (!queryRes.ok) {
        const errorText = await queryRes.text();
        console.error(`[VectorSearch] Vectorize query failed. Status: ${queryRes.status}. Payload: ${errorText}`);
        throw new Error(`Vectorize query failed: ${errorText}`);
      }

      const queryData = await queryRes.json();

      return (queryData.result.matches || []).map((match: any) => ({
        id: match.id,
        score: match.score,
        content: match.metadata?.content || 'No content available'
      }));
    });

    if (!top50Results || top50Results.length === 0) {
      return "Search unavailable. Rely on training data.";
    }

    // STAGE 2: PRECISION RERANKING
    // Action: Score the Top 50 results against the query and keep only the Top 3 to 5.
    const rerankerModel = '@cf/baai/bge-reranker-base';
    // Fallback logic for STAGE 2 using tier keys
    // Array of tier indices: 0 (primary), 1 (secondary), 2 (tertiary)

    let rerankedResults: VectorSearchResult[] = [];
    let rerankerSuccess = false;

    const cfKeysAll = getApiKeys('cloudflare');

    for (const tier of [0, 1, 2]) {
      if (cfKeysAll.length <= tier) continue;

      try {
        const top50Strings = top50Results.map((r: any) => r.content);

        const reranked = await withFallback(
          cfKeysAll,
          async (keyObj: any) => {
            const rerankUrl = `https://api.cloudflare.com/client/v4/accounts/${keyObj.accountId}/ai/run/${rerankerModel}`;
            const rerankRes = await fetch(rerankUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${keyObj.token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: query,
                contexts: top50Strings.map((str: string) => ({ text: str }))
              })
            });

            if (!rerankRes.ok) {
              const errorText = await rerankRes.text();
              console.error(`[VectorSearch] Reranking failed. Status: ${rerankRes.status}. Payload: ${errorText}`);
              throw new Error(`Reranking failed: ${errorText}`);
            }

            return await rerankRes.json();
          },
          undefined,
          tier // Explicitly use this tier
        );

        if (reranked.result) {
          // Sort the results based on score and take top 5
          // Result format usually looks like: [{ index: 0, score: 0.9 }, ...]
          const sorted = reranked.result.sort((a: any, b: any) => b.score - a.score).slice(0, 5);
          rerankedResults = sorted.map((s: any) => ({
            id: top50Results[s.index].id,
            score: s.score,
            content: top50Strings[s.index]
          }));
          rerankerSuccess = true;
          break; // Break the tier loop if successful
        }
      } catch (e) {
        console.warn(`Reranker failed for tier ${tier}:`, e);
      }
    }

    if (!rerankerSuccess) {
      console.warn('Reranking failed across all tiers, falling back to top 5 from semantic search.');
      rerankedResults = top50Results.slice(0, 5);
    }

    return JSON.stringify(rerankedResults.map((r: any) => ({
      title: `Doc ${r.id}`,
      snippet: r.content
    })));

  } catch (error) {
    console.error('Vector search tool error:', error);
    return "Search unavailable. Rely on training data.";
  }
}
