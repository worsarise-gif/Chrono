import { MockMessage } from '../types';

export const MOCK_MESSAGES: Record<string, MockMessage[]> = {
  'chat-1': [
    {
      id: 'msg-1',
      chatId: 'chat-1',
      role: 'user',
      content: 'Can you explain how React Server Components work?',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      messageType: 'text',
    },
    {
      id: 'msg-2',
      chatId: 'chat-1',
      role: 'model',
      content: `React Server Components (RSC) represent a fundamental shift in how React applications are built.

**What are they?**
Server Components are React components that execute exclusively on the server. They never ship to the client.

Here are the key benefits:
1. **Zero Bundle Size:** Because they run on the server, their dependencies don't add to the client bundle.
2. **Direct Backend Access:** They can securely access databases and the filesystem.
3. **Automatic Code Splitting:** Client components are dynamically loaded as needed.

> "RSCs allow you to write UI that can be rendered and optionally cached on the server."

This is a major architectural change.`,
      createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
      messageType: 'text',
    },
    {
      id: 'msg-3',
      chatId: 'chat-1',
      role: 'user',
      content: 'Show me a code example in TypeScript',
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      messageType: 'text',
    },
    {
      id: 'msg-4',
      chatId: 'chat-1',
      role: 'model',
      content: "```typescript\nimport db from './database';\n\n// This is a Server Component\nexport default async function UserProfile({ userId }: { userId: string }) {\n  const user = await db.users.find(userId);\n  \n  return (\n    <div>\n      <h1>{user.name}</h1>\n      <p>Email: {user.email}</p>\n    </div>\n  );\n}\n```",
      createdAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
      messageType: 'code',
    },
    {
      id: 'msg-5',
      chatId: 'chat-1',
      role: 'user',
      content: "What's the math behind attention mechanisms?",
      createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      messageType: 'text',
    },
    {
      id: 'msg-6',
      chatId: 'chat-1',
      role: 'model',
      content: "The core idea relies on queries ($Q$), keys ($K$), and values ($V$). The scaled dot-product attention is calculated using this formula:\n\n$$\\text{Attention}(Q,K,V)=\\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$",
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      messageType: 'math',
    },
    {
      id: 'msg-7',
      chatId: 'chat-1',
      role: 'user',
      content: "What's in this image?",
      createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      hasImage: true,
      imageUrl: 'https://picsum.photos/seed/chrono1/800/600',
      messageType: 'text',
    },
    {
      id: 'msg-8',
      chatId: 'chat-1',
      role: 'model',
      content: "Based on the image provided, it appears to be a scenic landscape with mountains in the background and a lake in the foreground.",
      createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      messageType: 'text',
    },
    {
      id: 'msg-9',
      chatId: 'chat-1',
      role: 'user',
      content: 'Generate a chart of monthly active users',
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      messageType: 'text',
    },
    {
      id: 'msg-10',
      chatId: 'chat-1',
      role: 'model',
      content: JSON.stringify({ type: 'bar', labels: ['Jan', 'Feb', 'Mar', 'Apr'], values: [120, 150, 180, 220] }),
      createdAt: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
      messageType: 'chart',
    },
    {
      id: 'msg-11',
      chatId: 'chat-1',
      role: 'model',
      content: "I'm currently generating a response...",
      createdAt: new Date().toISOString(),
      isStreaming: true,
      messageType: 'text',
    },
  ],
};
