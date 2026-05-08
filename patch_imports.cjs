const fs = require('fs');
const file = 'src/components/ChatArea.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('useSyncExternalStore')) {
  code = code.replace(
    "import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';",
    "import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';"
  );
}
if (!code.includes("import { streamStore }")) {
  code = code.replace(
    "import { Helix } from 'ldrs/react';",
    "import { streamStore } from '../lib/streamStore';\nimport { Helix } from 'ldrs/react';"
  );
}

fs.writeFileSync(file, code);
