type QueuedTask = () => Promise<void>;

interface UserQueue {
  running: boolean;
  queue: QueuedTask[];
}

const MAX_QUEUED = 3;
const queues = new Map<string, UserQueue>();

function getQueue(userId: string): UserQueue {
  if (!queues.has(userId)) queues.set(userId, { running: false, queue: [] });
  return queues.get(userId)!;
}

function drain(userId: string): void {
  const uq = getQueue(userId);
  if (uq.running || uq.queue.length === 0) return;
  const next = uq.queue.shift()!;
  uq.running = true;
  next().finally(() => {
    uq.running = false;
    if (uq.queue.length === 0) queues.delete(userId);
    else drain(userId);
  });
}

export function enqueueChat(userId: string, task: QueuedTask): Promise<void> {
  const uq = getQueue(userId);
  if (uq.queue.length >= MAX_QUEUED) {
    return Promise.reject(Object.assign(new Error('Queue full'), { code: 'QUEUE_FULL' }));
  }
  return new Promise<void>((resolve, reject) => {
    uq.queue.push(() => task().then(resolve, reject));
    drain(userId);
  });
}

export function enqueueFront(userId: string, task: QueuedTask): void {
  const uq = getQueue(userId);
  uq.queue.unshift(task);
}

export function queueDepth(userId: string): number {
  const uq = queues.get(userId);
  return uq ? uq.queue.length + (uq.running ? 1 : 0) : 0;
}
