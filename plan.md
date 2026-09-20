1. **Optimize `messages.filter` in `ChatArea.tsx`**
   - The `messages.filter` operation is being run directly inside the render loop in `ChatArea.tsx` on line 2971 (`{messages.filter(msg => msg.id !== currentStreamingMessageId).map(...)}`) and again on line 3110 for checking the last message index (`index === messages.filter(...).length - 1`).
   - This causes an O(N) filtering operation on every render, which becomes a bottleneck as the chat history grows, especially inside a map loop where it could potentially compound re-renders or delay them.
   - I will extract this filtered array into a memoized variable using `useMemo`:
     ```typescript
     const visibleMessages = useMemo(() => {
       return messages.filter(msg => msg.id !== currentStreamingMessageId);
     }, [messages, currentStreamingMessageId]);
     ```
   - Replace occurrences of `messages.filter(msg => msg.id !== currentStreamingMessageId)` with `visibleMessages`.

2. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Run type checks, format, and linting tools if available, to make sure the code quality is maintained.

3. **Submit the PR**
   - Create a pull request using the exact title format `"⚡ Bolt: [performance improvement]"` and include sections: `'💡 What'`, `'🎯 Why'`, `'📊 Impact'`, and `'🔬 Measurement'`.
