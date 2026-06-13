import { promises as fs } from "node:fs";

/**
 * Reads JSON data from disk safely.
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");

    if (!content.trim()) {
      return [] as T;
    }

    return JSON.parse(content);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      // file doesn't exist yet → create empty structure
      await fs.writeFile(filePath, "[]");
      return [] as T;
    }

    throw err;
  }
}

/**
 * Writes JSON data to disk.
 */
export async function writeJsonFile(
  filePath: string,
  data: unknown,
): Promise<void> {
  const json = JSON.stringify(data, null, 2);

  await fs.writeFile(filePath, json, "utf-8");
}
