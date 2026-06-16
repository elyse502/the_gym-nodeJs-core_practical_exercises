import http from "node:http";

/**
 * Demonstrates event-loop starvation
 * caused by recursive process.nextTick().
 */
function recursive(): void {
  //   console.log("running nextTick");

  process.nextTick(recursive);
}

recursive();

http
  .createServer((_req, res) => {
    res.end("hello");
  })
  .listen(3000, () => {
    console.log("Server listening on port 3000");
  });
