const fs = require('fs');
const file = 'src/components/ChatArea.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `              if (aiMessageRef) {
                await updateDoc(aiMessageRef, { content: fullResponse, isGeneratedImage: true });
              }`;

const replacementStr = `              if (aiMessageRef) {
                await setDoc(aiMessageRef, {
                  role: 'model',
                  uid: user.uid,
                  content: fullResponse,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  isGeneratedImage: true
                });
                await updateDoc(doc(db, 'users', user.uid), {
                  totalMessages: increment(1)
                });
              }`;

code = code.replace(targetStr, replacementStr);

fs.writeFileSync(file, code);
