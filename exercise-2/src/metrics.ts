import os from "node:os";

/**
 * Converts bytes into megabytes.
 */
export function bytesToMb(bytes: number): number {
  return Number((bytes / 1024 / 1024).toFixed(2));
}

/**
 * Collects operating system and process metrics.
 */
export function getHealthData() {
  const cpus = os.cpus();
  const memory = process.memoryUsage();

  return {
    system: {
      totalMemoryMb: bytesToMb(os.totalmem()),
      freeMemoryMb: bytesToMb(os.freemem()),
      platform: process.platform,
      osType: os.type(),
    },

    cpu: {
      cores: cpus.length,
      model: cpus[0]?.model,
    },

    process: {
      pid: process.pid,
      uptimeSeconds: Number(process.uptime().toFixed(2)),

      memoryUsage: {
        rssMb: bytesToMb(memory.rss),
        heapUsedMb: bytesToMb(memory.heapUsed),
        heapTotalMb: bytesToMb(memory.heapTotal),
      },
    },
  };
}
