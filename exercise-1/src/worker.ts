import { performance } from "node:perf_hooks";
import { parentPort } from "node:worker_threads";

console.log("[Worker] Starting heavy computation...");

const start = performance.now();

let count = 0;

while (count < 5_000_000_000) {
  count++;
}

const end = performance.now();

const durationMs = end - start;

console.log(`[Worker] Computation completed in ${durationMs.toFixed(2)} ms`);

parentPort?.postMessage({
  completed: true,
  iterations: count,
  durationMs: Number(durationMs.toFixed(2)),
});
