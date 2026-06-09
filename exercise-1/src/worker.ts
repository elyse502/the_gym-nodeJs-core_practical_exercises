import { parentPort } from "node:worker_threads";

const start = Date.now();

let count = 0;

while (count < 5_000_000_000) {
  count++;
}

const duration = Date.now() - start;

parentPort?.postMessage({
  completed: true,
  duration,
});
