import { IncomingMessage, ServerResponse } from "node:http";

import { getBody } from "../utils/get-body.js";
import { sendError } from "../utils/send-error.js";
import { sendJson } from "../utils/send-json.js";

import { UserService } from "../services/user.service.js";

const userService = new UserService();

/**
 * Handles user registration.
 */
export async function registerUser(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const body = await getBody(request);

    const { name, email, password } = body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      sendError(response, 400, "name, email and password are required");

      return;
    }

    const user = await userService.register(name, email, password);

    sendJson(response, 201, user);
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      sendError(response, 409, "Email already exists");

      return;
    }

    if (error instanceof Error) {
      sendError(response, 400, error.message);

      return;
    }

    sendError(response, 500, "Internal Server Error");
  }
}
