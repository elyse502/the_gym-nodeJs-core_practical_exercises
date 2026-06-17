import http from "node:http";

/**
 * Simple analytics test server.
 */
const server = http.createServer((_req, res) => {
  res.end("ok");
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
