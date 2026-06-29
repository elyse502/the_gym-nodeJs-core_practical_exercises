import { IncomingMessage, ServerResponse } from "node:http";
import { AuthenticationResult } from "../types/authentication-result.interface";
import { authenticate } from "../services/authentication.service";
import { sendError } from "./send-error";

export async function requireAuth(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<AuthenticationResult | null> {
  const auth = await authenticate(request);

  if (!auth) {
    sendError(response, 401, "Unauthorized");
    return null;
  }

  return auth;
}
