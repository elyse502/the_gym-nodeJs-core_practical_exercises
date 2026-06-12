import fs from "node:fs";
import path from "node:path";
import os from "node:os";

function bytesToMb(bytes: number): number {
  return Number((bytes / 1024 / 1024).toFixed(2));
}

const logsDir = path.resolve("logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, "server.log");

process.on("exit", () => {
  const line = `server shut down at ${new Date().toISOString()}\n`;

  fs.appendFileSync(logFile, line);
});

function getHealthData() {
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
