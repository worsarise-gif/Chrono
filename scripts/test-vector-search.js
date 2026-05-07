// A plain JS mock simulation of vectorSearch since TS requires module resolution fixes
process.env.CLOUDFLARE_ACCOUNT_ID = "2215383dfc48baa1df7666821342db26";
process.env.CLOUDFLARE_API_TOKEN = "cfut_0IxFXq61q0R2HHpsQ2DBoCC8M19ilcDvae9nnEZn53ed73dd";
process.env.CLOUDFLARE_VECTORIZE_INDEX_NAME = "chrono-knowledge";

async function simulate() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  try {
      console.log("Simulating embedding via Cloudflare AI...");
      const embedUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/baai/bge-base-en-v1.5`;
      const embedRes = await fetch(embedUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: "test query" })
      });
      if (!embedRes.ok) {
         console.error("Embedding failed:", await embedRes.text());
         return;
      }
      console.log("Embedding succeeded.");

      console.log("Simulating reranking...");
      const rerankUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/baai/bge-reranker-base`;
      const rerankRes = await fetch(rerankUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: "Which one is better?",
                contexts: [{ text: "a cyberpunk lizzard"}, { text: "a cyberpunk cat" }]
              })
      });
      if (!rerankRes.ok) {
         console.error("Reranking failed:", await rerankRes.text());
         return;
      }
      console.log("Reranking succeeded:", await rerankRes.json());

  } catch (e) {
      console.error(e);
  }
}

simulate();
