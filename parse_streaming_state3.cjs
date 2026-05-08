const fs = require('fs');
const file = 'src/components/ChatArea.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/const \[isLoading, setIsLoading\] = useState\(false\);/, '');
code = code.replace(/const \[abortController, setAbortController\] = useState<AbortController \| null>\(null\);/, '');
code = code.replace(/const \[streamingMessage, setStreamingMessage\] = useState<string>\(''\);/, '');
code = code.replace(/const \[isGeneratingImage, setIsGeneratingImage\] = useState\(false\);/, '');
code = code.replace(/const \[loadingStatus, setLoadingStatus\] = useState\('Thinking\.\.\.'\);/, '');
code = code.replace(/const \[currentStreamingMessageId, setCurrentStreamingMessageId\] = useState<string \| null>\(null\);/, `
  const streamState = useSyncExternalStore(
    streamStore.subscribe,
    () => streamStore.getStream(currentChatId || 'default'),
    () => undefined
  );

  const isLoading = streamState?.isLoading || false;
  const streamingMessage = streamState?.content || '';
  const currentStreamingMessageId = streamState?.messageId || null;
  const abortController = streamState?.abortController || null;
  const isGeneratingImage = streamState?.isGeneratingImage || false;
  const loadingStatus = streamState?.loadingStatus || 'Thinking...';

  const setIsLoading = (loading: boolean) => streamStore.setStream(currentChatId || 'default', { isLoading: loading });
  const setStreamingMessage = (content: string | ((prev: string) => string)) => {
    if (typeof content === 'function') {
      const prev = streamStore.getStream(currentChatId || 'default')?.content || '';
      streamStore.setStream(currentChatId || 'default', { content: content(prev) });
    } else {
      streamStore.setStream(currentChatId || 'default', { content });
    }
  };
  const setCurrentStreamingMessageId = (messageId: string | null) => streamStore.setStream(currentChatId || 'default', { messageId });
  const setAbortController = (ac: AbortController | null) => streamStore.setStream(currentChatId || 'default', { abortController: ac });
  const setIsGeneratingImage = (isGen: boolean) => streamStore.setStream(currentChatId || 'default', { isGeneratingImage: isGen });
  const setLoadingStatus = (status: string) => streamStore.setStream(currentChatId || 'default', { loadingStatus: status });
`);

// Also update the UI throttler inside `handleChunk` to correctly set message with the new interface
const targetStr1 = `        if (now - lastUIUpdateTime > 33) {
          setStreamingMessage(fullResponse);
          lastUIUpdateTime = now;
        }`;

const replacementStr1 = `        if (now - lastUIUpdateTime > 33) {
          streamStore.setStream(chatId || 'default', { content: fullResponse });
          lastUIUpdateTime = now;
        }`;
code = code.replace(targetStr1, replacementStr1);

fs.writeFileSync(file, code);
