import http from "node:http";

import { router } from "./router/router";

/**
 * Entry point of the application.
 *
 * Creates the HTTP server and delegates
 * all requests to the router.
 */
const server = http.createServer((request, response) => {
  router(request, response);
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
