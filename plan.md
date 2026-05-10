1. **Goal:** Optimize the speed and performance of user message handling and response rendering in `ChatArea.tsx`.
2. **Issues identified:**
   - In `handleSubmit`, there are sequential `await` calls to Firestore (`addDoc`, then `updateDoc`, then `updateDoc`) for writing the user's message, updating the chat's `updatedAt`, and updating the user's `totalMessages`. This blocks the API call to generate the AI response.
   - For AI streaming response generation, there's another sequential blocking operation: `aiMessageRef = await setDoc(...)` or `await addDoc(...)` which happens before or after chunks, which can slow down real-time perception. Wait, actually `aiMessageRef` is initialized synchronously:
     ```javascript
     const ref = doc(collection(db, 'users', user.uid, 'chats', chatId!, 'messages'));
     aiMessageRef = ref;
     setCurrentStreamingMessageId(ref.id, chatId || undefined);
     ```
     This part is fine. The sync updates chunking in `handleChunk`:
     ```javascript
     if (user && aiMessageRef && now - lastUpdateTime > 1500) {
       lastUpdateTime = now;
       updateDoc(aiMessageRef, { content: fullResponse }).catch(e => console.error("Failed to sync chunk", e));
     }
     ```
     But the initial user message blocks everything.
   - Also, `await updateDoc` for chat and totalMessages happens multiple times synchronously.

3. **Solution:**
   - Run the initial `userMessageRef = await addDoc(...)` and related `updateDoc` calls *asynchronously* in the background, or do them as non-blocking promises.
   - Wait, we need `userMessageRef` in case of `currentImage` so we can upload the image and attach the URL to it. But we can still dispatch it as a promise, or since we only need the generated ID, we can do `const msgRef = doc(collection(db, 'users', user.uid, 'chats', chatId!, 'messages'))` to generate the ID locally instantly, then perform `setDoc(msgRef, messageData)` in the background without `await`ing it before starting the AI response.
   - For real-time user message transmission: we should do an optimistic update immediately: `setMessages(prev => [...prev, { id: userMessageRef.id, ...messageData }])` before starting the network calls, so it appears *instantly*. However, Firestore's `onSnapshot` might already handle optimistic local updates if we do `setDoc`. But since we currently use `addDoc`, it might be better to create a `doc` reference and call `setDoc` synchronously (without await), letting Firestore's offline persistence handle the UI update via `onSnapshot` instantly.
   - In `handleSubmit`:
     ```javascript
     let userMessageRef: any = null;
     // ...
     if (user) {
         userMessageRef = doc(collection(db, 'users', user.uid, 'chats', chatId!, 'messages'));
         // Fire off the DB updates in the background without blocking
         Promise.all([
             setDoc(userMessageRef, messageData),
             updateDoc(doc(db, 'users', user.uid, 'chats', chatId!), { updatedAt: serverTimestamp() }),
             updateDoc(doc(db, 'users', user.uid), { totalMessages: increment(1) })
         ]).catch(error => {
             console.error("Failed to send message async", error);
             // handle error...
         });
     }
     ```
   - This eliminates the wait time for DB writes.
   - What about `generateSmartTitle`? It's already non-blocking.
   - What about the AI response save at the end? `await setDoc(aiMessageRef, ...)` and `await updateDoc(...)`. These are at the end, but they delay the finalization state. We can run them concurrently using `Promise.all()`.
   - What about `isNewChat`?
     ```javascript
        try {
          const chatRef = await addDoc(collection(db, 'users', user.uid, 'chats'), { ... });
     ```
     We need the `chatId` before proceeding, so `chatId = doc(collection(db, 'users', user.uid, 'chats')).id; setDoc(...)` can make it instant!

4. **Execution Plan Steps:**
   1. **Refactor User Message Creation:** In `handleSubmit`, replace `await addDoc(...)` for `chatRef` (if new chat) and `userMessageRef` with synchronous ID generation using `doc(...)` and background `setDoc(...)` calls. This ensures the user's message is sent and rendered immediately without waiting for Firestore server roundtrips.
   2. **Refactor Concurrent DB Updates:** Bundle sequential `updateDoc` calls (e.g., updating `updatedAt`, `totalMessages`) into non-blocking `Promise.all` operations that run concurrently.
   3. **Refactor AI Message Creation:** At the end of `handleSubmit`, use `Promise.all` for the final AI message save and stats update, making the finalization step faster.
   4. **Test & Pre-commit Check:** Run the chat logic in a test environment to verify changes, perform `pre_commit_instructions`, and submit.
