/**
 * =====================================================
 * EVENT LOOP VISUALIZER
 * =====================================================
 *
 * Purpose:
 * Explore how Node.js schedules work across:
 *
 * - Call Stack
 * - nextTick Queue
 * - Promise Microtask Queue
 * - Timers Queue
 * - Poll Phase
 * - Check Phase
 *
 * Before running:
 * Predict the output order.
 *
 * After running:
 * Compare actual output with prediction.
 */

import fs from "node:fs";

setTimeout(() => {
  console.log("setTimeout 1");
}, 0);

setImmediate(() => {
  console.log("setImmediate 1");
});

process.nextTick(() => {
  console.log("nextTick 1");
});

Promise.resolve().then(() => {
  console.log("Promise 1");
});

fs.readFile("./src/4a-event-loop-visualizer/users.json", () => {
  console.log("fs.readFile done");
});

process.nextTick(() => {
  console.log("nextTick 2");
});

Promise.resolve().then(() => {
  console.log("Promise 2");
});

setTimeout(() => {
  console.log("setTimeout 2");
}, 0);

setImmediate(() => {
  console.log("setImmediate 2");
});

console.log("synchronous — main thread");

// Additional work to visualize the event loop phases more clearly
setImmediate(() => {
  console.log("inside setImmediate");

  Promise.resolve().then(() => {
    console.log("Promise inside setImmediate");
  });

  process.nextTick(() => {
    console.log("nextTick inside setImmediate");
  });
});
