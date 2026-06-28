import { promises as fs } from "node:fs";

/**
 * Reads and parses a JSON file.
 *
 * @param filePath Absolute or relative path to the JSON file.
 * @returns Parsed JSON data.
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf8");

  return JSON.parse(content) as T;
}

/**
 * Writes JSON data to a file.
 *
 * @param filePath Destination file path.
 * @param data Data to serialize.
 */
export async function writeJsonFile(
  filePath: string,
  data: unknown,
): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}
