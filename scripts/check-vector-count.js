const accountId = "2215383dfc48baa1df7666821342db26";
const token = "cfut_0IxFXq61q0R2HHpsQ2DBoCC8M19ilcDvae9nnEZn53ed73dd";
// Assume the index name based on context or let user specify. We'll use a placeholder or read from argv
const indexName = process.argv[2] || "your_index_name";

async function checkVectorize() {
  console.log(`Checking Vectorize index: ${indexName}`);
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${indexName}/info`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    console.error('Failed to fetch info:', res.status, await res.text());
    return;
  }

  const data = await res.json();
  console.log('Index Info:', JSON.stringify(data.result, null, 2));
  console.log(`\nVector count in index '${indexName}':`, data.result.vectorsCount || 0);
}

checkVectorize();
