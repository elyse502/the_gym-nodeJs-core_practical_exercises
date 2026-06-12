import http from "node:http";
import { parse } from "node:url";

import { getMaskedEnvironmentVariables } from "./env.js";
import { getHealthData } from "./metrics.js";
import { registerShutdownHooks, shutdown } from "./shutdown.js";

registerShutdownHooks();

/**
 * Sends JSON responses consistently.
 */
function sendJson(
  res: http.ServerResponse,
  statusCode: number,
  data: unknown,
): void {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });

  res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
  const { pathname } = parse(req.url || "/", true);

  switch (pathname) {
    case "/health":
      sendJson(res, 200, getHealthData());
      return;

    case "/env":
      sendJson(res, 200, getMaskedEnvironmentVariables());
      return;

    case "/kill":
      sendJson(res, 200, {
        message: "Server shutting down in 3 seconds",
      });

      shutdown();
      return;

    default:
      sendJson(res, 404, {
        error: "Route not found",
      });
  }
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Process Monitor running on http://localhost:${PORT}`);

  console.log(`Health endpoint: http://localhost:${PORT}/health`);

  console.log(`Environment endpoint: http://localhost:${PORT}/env`);

  console.log(`Shutdown endpoint: http://localhost:${PORT}/kill`);
});
