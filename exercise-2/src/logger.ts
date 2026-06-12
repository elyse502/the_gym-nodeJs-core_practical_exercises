import fs from "node:fs";
import path from "node:path";

const logsDirectory = path.resolve("logs");

if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory, {
    recursive: true,
  });
}

export const logFilePath = path.join(logsDirectory, "server.log");

/**
 * Writes a message to the log file.
 */
export function appendLog(message: string): void {
  fs.appendFileSync(logFilePath, `${message}\n`);
}
