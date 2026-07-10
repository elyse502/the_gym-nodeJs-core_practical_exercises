/**
 * A simple in-memory write lock that
 * serializes write operations.
 *
 * This implementation is suitable for
 * learning purposes and a single
 * Node.js process.
 */

let isWriting = false;

const queue: Array<() => void> = [];

/**
 * Acquires the write lock.
 */
export async function acquireLock(): Promise<void> {
  if (!isWriting) {
    isWriting = true;

    return;
  }

  await new Promise<void>((resolve) => {
    queue.push(resolve);
  });
}

/**
 * Releases the write lock.
 */
export function releaseLock(): void {
  const next = queue.shift();

  if (next) {
    next();

    return;
  }

  isWriting = false;
}
