const assert = require('assert');

// Simulate the frontend parsing logic
function testClientParser(chunkStr) {
  try {
    const data = JSON.parse(chunkStr);
    if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
      return data.choices[0].delta.content;
    }
  } catch (e) {
    return null;
  }
}

// Ensure the new format works
const outputStr = JSON.stringify({ choices: [{ delta: { content: 'hello' } }] });
assert.strictEqual(testClientParser(outputStr), 'hello');
console.log("Parse check passed.");
