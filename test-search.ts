import { webSearch } from './src/lib/tools/webSearch';
async function run() {
  const res = await webSearch("groq compound search API");
  console.log(res);
}
run();
