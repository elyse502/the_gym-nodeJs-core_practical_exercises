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

function runHeavyTask(): number {
  const start = Date.now();

  let count = 0;

  while (count < 5_000_000_000) {
    count++;
  }

  return Date.now() - start;
}

const serverA = http.createServer((req, res) => {
  if (req.url === "/heavy") {
    const duration = runHeavyTask();

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        completed: true,
        duration,
      }),
    );

    return;
  }

  res.writeHead(404);
  res.end();
});

const serverB = http.createServer((req, res) => {
  if (req.url === "/ping") {
    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        status: "alive",
        time: Date.now(),
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
