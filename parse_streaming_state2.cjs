const fs = require('fs');
const file = 'src/components/ChatArea.tsx';
let code = fs.readFileSync(file, 'utf8');

// Also update the UI throttler inside `handleChunk` to correctly set message with the new interface
const targetStr1 = `        if (now - lastUIUpdateTime > 33) {
          setStreamingMessage(fullResponse);
          lastUIUpdateTime = now;
        }`;

const replacementStr1 = `        if (now - lastUIUpdateTime > 33) {
          streamStore.setStream(chatId || 'default', { content: fullResponse });
          lastUIUpdateTime = now;
        }`;

// Let's not use string replacement just for this if not needed, as the function signature of setStreamingMessage supports a string too.
