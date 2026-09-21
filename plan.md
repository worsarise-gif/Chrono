1. **Identify the optimization opportunity**: In `src/components/ChatArea.tsx`, the `messages` array is filtered using `.filter(msg => msg.id !== currentStreamingMessageId)` directly inside the render cycle in multiple places (line 2971 and line 3110). This operation is O(N) where N is the number of messages, and doing it inline creates a new array reference on every render, which can degrade performance especially in long conversations or during frequent re-renders (like when typing or when the streaming cursor updates).
2. **Implement the fix**:
   - Extract this logic into a memoized variable: `const displayedMessages = useMemo(() => messages.filter(msg => msg.id !== currentStreamingMessageId), [messages, currentStreamingMessageId]);`
   - Replace the inline filters with `displayedMessages`.
   - Replace `index === messages.filter(m => m.id !== currentStreamingMessageId).length - 1` with `index === displayedMessages.length - 1`.
3. **Run Pre-Commit Checks**: Run `pnpm lint` and ensure tests pass.
4. **Submit PR**: Commit the changes with an appropriate Bolt PR format.
