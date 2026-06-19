import { ServerResponse } from "node:http";

/**
 * Handles GET /secure.
 */
export function handleSecureRoute(response: ServerResponse): void {
  response.writeHead(200, {
    "Content-Type": "application/json",
  });

  response.end(
    JSON.stringify({
      message: "you are on a secure connection",
    }),
  );
}
