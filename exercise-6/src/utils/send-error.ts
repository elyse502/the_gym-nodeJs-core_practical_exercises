import { ServerResponse } from "node:http";

import { sendJson } from "./send-json.js";

/**
 * Sends a standardized error response.
 */
export function sendError(
  response: ServerResponse,
  statusCode: number,
  message: string,
): void {
  sendJson(response, statusCode, {
    error: message,
  });
}
