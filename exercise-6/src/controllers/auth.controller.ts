import { IncomingMessage, ServerResponse } from "node:http";

import { getBody } from "../utils/get-body.js";
import { sendError } from "../utils/send-error.js";
import { sendJson } from "../utils/send-json.js";

import { UserService } from "../services/user.service.js";

const userService = new UserService();

/**
 * Handles user login.
 */
export async function loginUser(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const body = await getBody(request);

    const { email, password } = body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      sendError(response, 400, "email and password are required");

      return;
    }

    const token = await userService.login(email, password);

    sendJson(response, 200, token);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      sendError(response, 401, "Invalid email or password");

      return;
    }

    if (error instanceof Error) {
      sendError(response, 400, error.message);

      return;
    }

    sendError(response, 500, "Internal Server Error");
  }
}
