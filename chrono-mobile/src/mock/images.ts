import { MockImage } from '../types';

export const MOCK_IMAGES: MockImage[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `img-${i}`,
  prompt: `A beautiful scenic view number ${i}`,
  imageUrl: `https://picsum.photos/seed/${i}/512/512`,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * i).toISOString(),
}));
