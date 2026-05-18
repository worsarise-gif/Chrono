import { colors } from '../theme/tokens';
import { ThemeMode } from '../theme/ThemeContext';

export type MockChat = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  preview: string;
};

export type MockMessage = {
  id: string;
  chatId: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
  hasImage?: boolean;
  imageUrl?: string;
  isGeneratedImage?: boolean;
  isStreaming?: boolean;
  messageType?: 'text' | 'code' | 'math' | 'chart' | 'image';
};

export type MockImage = {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
};

export type { ThemeMode };
export type ThemeColors = typeof colors.light;
