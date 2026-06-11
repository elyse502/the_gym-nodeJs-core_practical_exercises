import http from "node:http";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { Worker } from "node:worker_threads";

/**
 * =====================================================
 * END OF DAY EXPLANATION
 * =====================================================
 *
 * Initially both servers shared one Node.js process and
 * one JavaScript execution thread.
 *
 * Although Server A and Server B used different ports,
 * requests were handled by the same event loop.
 *
 * While Server A executed the heavy loop, the event loop
 * could not process requests arriving at Server B.
 *
 * This proves that multiple HTTP servers in the same
 * process do not receive separate event loops.
 *
 * After introducing worker_threads, the heavy counting
 * operation runs in a worker thread instead of the main
 * thread.
 *
 * The main thread remains free to process incoming
 * requests while the worker performs CPU-intensive work.
 *
 * Because the event loop is no longer blocked, Server B
 * responds immediately.
 *
 * If a third server were added on port 5000, it would
 * also remain responsive because the expensive work no
 * longer executes on the main thread.
 */

function runHeavyTask(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const workerPath =
      process.env.NODE_ENV === "production"
        ? path.resolve(__dirname, "worker.js")
        : path.resolve("src/worker.ts");

    const worker = new Worker(workerPath);

    const start = performance.now();

    worker.on("message", (result) => {
      const end = performance.now();

      console.log(`Worker completed in ${(end - start).toFixed(2)} ms`);

      resolve(result);
    });

    worker.on("error", reject);
  });
}

setInterval(() => {
  console.log(`Heartbeat: ${performance.now().toFixed(2)} ms`);
}, 1000);

const serverA = http.createServer(async (req, res) => {
  if (req.url === "/heavy") {
    console.log("\n=== HEAVY TASK STARTED ===");

    const requestStart = performance.now();

    const result = await runHeavyTask();

    const requestEnd = performance.now();

    console.log(
      `Total request duration: ${(requestEnd - requestStart).toFixed(2)} ms`,
    );

    console.log("=== HEAVY TASK FINISHED ===\n");

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(JSON.stringify(result));

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
