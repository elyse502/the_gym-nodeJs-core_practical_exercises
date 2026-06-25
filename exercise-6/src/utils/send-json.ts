import { ServerResponse } from "node:http";

/**
 * Sends a JSON response.
 */
export function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  });

  response.end(JSON.stringify(payload));
}
