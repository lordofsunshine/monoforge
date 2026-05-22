export const maxArchiveFileCount = 1000;
export const maxArchiveBytes = 200 * 1024 * 1024;
const maxActiveArchives = 2;
const activeArchiveKeys = new Map<string, number>();
let activeArchiveCount = 0;

export function shouldAllowArchiveDownload(input: { fileCount: number; totalSize: number | bigint }) {
  const totalSize = typeof input.totalSize === "bigint" ? input.totalSize : BigInt(input.totalSize);
  return input.fileCount <= maxArchiveFileCount && totalSize <= BigInt(maxArchiveBytes);
}

export function acquireArchiveDownloadSlot(key: string) {
  const activeForKey = activeArchiveKeys.get(key) || 0;

  if (activeArchiveCount >= maxActiveArchives || activeForKey > 0) {
    throw new Error("Archive generation is already running. Try again soon.");
  }

  activeArchiveCount += 1;
  activeArchiveKeys.set(key, activeForKey + 1);

  let released = false;

  return () => {
    if (released) {
      return;
    }

    released = true;
    activeArchiveCount -= 1;
    const nextActiveForKey = (activeArchiveKeys.get(key) || 1) - 1;

    if (nextActiveForKey <= 0) {
      activeArchiveKeys.delete(key);
    } else {
      activeArchiveKeys.set(key, nextActiveForKey);
    }
  };
}

export async function withArchiveDownloadSlot<T>(key: string, action: () => Promise<T>) {
  const release = acquireArchiveDownloadSlot(key);

  try {
    return await action();
  } finally {
    release();
  }
}
