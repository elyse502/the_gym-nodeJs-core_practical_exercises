import { IncomingMessage, ServerResponse } from "node:http";

import { sendJson } from "../utils/send-json.js";

/**
 * Temporary placeholder used while building
 * the routing system.
 */
export function notImplemented(
  _request: IncomingMessage,
  response: ServerResponse,
): void {
  sendJson(response, 501, {
    message: "Handler not implemented yet.",
  });
}
