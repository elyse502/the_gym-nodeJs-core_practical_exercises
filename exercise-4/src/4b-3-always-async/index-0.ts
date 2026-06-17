import { readFile } from "node:fs";

const cache: Record<string, string> = {};

/**
 * Retrieves data from cache or disk.
 *
 * BUG:
 * Cache hits are synchronous.
 * File reads are asynchronous.
 */
function getData(
  key: string,
  callback: (error: Error | null, data?: string) => void,
): void {
  if (cache[key]) {
    callback(null, cache[key]);

    return;
  }

  readFile(key, "utf8", (error, data) => {
    if (error) {
      callback(error);

      return;
    }

    cache[key] = data;

    callback(null, data);
  });
}

console.log("REQUEST");

let completed = false;

getData("./src/4b-3-always-async/data.txt", () => {
  console.log("CALLBACK");

  completed = true;
});

console.log("COMPLETED:", completed);
