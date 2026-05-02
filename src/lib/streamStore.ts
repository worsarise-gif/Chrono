export interface StreamState {
  chatId: string;
  messageId: string | null;
  content: string;
  isLoading: boolean;
  abortController: AbortController | null;
}

type Listener = () => void;
let streams: Record<string, StreamState> = {};
let listeners: Set<Listener> = new Set();

export const streamStore = {
  getStream: (chatId: string) => streams[chatId],
  getAllStreams: () => streams,
  setStream: (chatId: string, state: Partial<StreamState>) => {
    streams = { ...streams, [chatId]: { ...streams[chatId], ...state, chatId } };
    listeners.forEach(l => l());
  },
  removeStream: (chatId: string) => {
    const next = { ...streams };
    delete next[chatId];
    streams = next;
    listeners.forEach(l => l());
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};
