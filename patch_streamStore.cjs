const fs = require('fs');
const file = 'src/lib/streamStore.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
  '  abortController: AbortController | null;',
  '  abortController: AbortController | null;\n  isGeneratingImage?: boolean;\n  loadingStatus?: string;'
);
fs.writeFileSync(file, code);
