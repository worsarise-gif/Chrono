const fs = require('fs');
const file = 'src/components/ChatArea.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';",
  "import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';"
);

fs.writeFileSync(file, code);
