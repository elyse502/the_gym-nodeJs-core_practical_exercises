import fs from "node:fs";
import path from "node:path";

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
