import { promises as fs } from "node:fs";

/**
 * Reads JSON data from disk.
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf-8");

  return JSON.parse(content);
}

/**
 * Writes JSON data to disk.
 */
export async function writeJsonFile(
  filePath: string,
  data: unknown,
): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}
