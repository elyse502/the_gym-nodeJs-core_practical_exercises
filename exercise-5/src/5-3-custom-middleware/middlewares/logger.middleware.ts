import fs from "node:fs/promises";
import path from "node:path";
import { Request, Response, NextFunction } from "express";

/**
 * Logs each incoming request to disk.
 *
 * Format:
 * [timestamp] METHOD /path
 */
export async function loggerMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const timestamp = new Date().toISOString();

  const line = `[${timestamp}] ${req.method} ${req.url}\n`;

  const logPath = path.resolve("src/5-3-custom-middleware/logs/requests.log");

  await fs.appendFile(logPath, line);

  next();
}
