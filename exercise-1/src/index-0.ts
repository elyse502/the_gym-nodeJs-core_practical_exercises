/**
 * =====================================================
 * END OF DAY EXPLANATION
 * =====================================================
 *
 * This version intentionally demonstrates event loop
 * blocking.
 *
 * Server A and Server B run in the same Node.js process.
 *
 * Even though they listen on different ports, both share
 * the same event loop and JavaScript thread.
 *
 * When Server A executes a CPU-intensive loop, the event
 * loop becomes busy and cannot process incoming requests
 * for Server B.
 *
 * Therefore requests to Server B must wait until the loop
 * finishes.
 *
 * If a third server existed in this same process, it would
 * also be blocked for the same reason.
 *
 * Node.js can manage many servers concurrently, but CPU
 * intensive synchronous work blocks all of them when they
 * share the same process.
 */

import http from "node:http";
import { performance } from "node:perf_hooks";

function runHeavyTask(): number {
  const start = performance.now();

  let count = 0;

  while (count < 5_000_000_000) {
    count++;
  }

  const end = performance.now();

  return end - start;
}

const serverA = http.createServer((req, res) => {
  if (req.url === "/heavy") {
    console.log("\n=== HEAVY TASK STARTED ===");

    const duration = runHeavyTask();

    console.log(`Heavy task completed in ${duration.toFixed(2)} ms`);

    console.log("=== HEAVY TASK FINISHED ===\n");

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        completed: true,
        durationMs: Number(duration.toFixed(2)),
      }),
    );

    return;
  }

  res.writeHead(404);
  res.end();
});

const serverB = http.createServer((req, res) => {
  if (req.url === "/ping") {
    const timestamp = performance.now();

    console.log(`PING received at ${timestamp.toFixed(2)} ms`);

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        status: "alive",
        timestampMs: Number(timestamp.toFixed(2)),
      }),
    );

    return;
  }

  res.writeHead(404);
  res.end();
});

serverA.listen(3000, () => {
  console.log("Server A running on 3000 - http://localhost:3000/heavy");
});

serverB.listen(4000, () => {
  console.log("Server B running on 4000 - http://localhost:4000/ping");
});

console.log("=== END OF DAY EXPLANATION ===");
