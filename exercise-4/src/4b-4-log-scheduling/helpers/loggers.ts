import { appendFile } from "node:fs/promises";
import path from "node:path";

const LOG_FILE = path.resolve("src/4b-4-log-scheduling/analytics.log");

/**
 * Appends an analytics entry to disk.
 */
export async function writeLog(message: string): Promise<void> {
  await appendFile(LOG_FILE, `${message}\n`);
}
