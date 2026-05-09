const fs = require('fs');

const code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('setIsStreaming(false)') || lines[i].includes('setIsStreaming(')) {
        console.log(`Line ${i+1}: ${lines[i]}`);
    }
}
