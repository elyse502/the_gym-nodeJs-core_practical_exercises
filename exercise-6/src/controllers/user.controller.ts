import { IncomingMessage, ServerResponse } from "node:http";
import { parse } from "node:url";

import { getBody } from "../utils/get-body.js";
import { sendError } from "../utils/send-error.js";
import { sendJson } from "../utils/send-json.js";

import { UserService } from "../services/user.service.js";

import { requireAuth } from "../utils/requireAuth.js";

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

/**
 * Returns every registered user.
 *
 * Supports filtering by name using:
 *
 * GET /users?name=john
 */
export async function getAllUsers(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const auth = await requireAuth(request, response);

  if (!auth) {
    return;
  }

  const { query } = parse(request.url ?? "", true);

  const filter = typeof query.name === "string" ? query.name : undefined;

  const users = await userService.getAll(filter);

  sendJson(response, 200, users);
}

/**
 * Returns a single user.
 */
export async function getUserById(
  request: IncomingMessage,
  response: ServerResponse,
  id: string,
): Promise<void> {
  const auth = await requireAuth(request, response);

  if (!auth) {
    return;
  }

  try {
    const user = await userService.getById(id);

    sendJson(response, 200, user);
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      sendError(response, 404, "User not found");

      return;
    }

    sendError(response, 500, "Internal Server Error");
  }
}

/**
 * Updates the authenticated user's name.
 */
export async function updateUser(
  request: IncomingMessage,
  response: ServerResponse,
  id: string,
): Promise<void> {
  const auth = await requireAuth(request, response);

  if (!auth) {
    return;
  }

  if (auth.user.id !== id) {
    sendError(response, 403, "Forbidden");

    return;
  }

  try {
    const body = await getBody(request);

    const { name } = body;

    if (typeof name !== "string" || name.trim() === "") {
      sendError(response, 400, "name is required");

      return;
    }

    const user = await userService.updateName(id, name.trim());

    sendJson(response, 200, user);
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      sendError(response, 404, "User not found");

      return;
    }

    if (error instanceof Error) {
      sendError(response, 400, error.message);

      return;
    }

    sendError(response, 500, "Internal Server Error");
  }
}

/**
 * Deletes the authenticated user's account.
 */
export async function deleteUser(
  request: IncomingMessage,
  response: ServerResponse,
  id: string,
): Promise<void> {
  const auth = await requireAuth(request, response);

  if (!auth) {
    return;
  }

  if (auth.user.id !== id) {
    sendError(response, 403, "Forbidden");

    return;
  }

  try {
    await userService.deleteUser(id);

    sendJson(response, 200, {
      message: "User deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      sendError(response, 404, "User not found");

      return;
    }

    sendError(response, 500, "Internal Server Error");
  }
}

/**
 * Returns the currently
 * authenticated user.
 */
export async function getMe(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const auth = await requireAuth(request, response);

  if (!auth) {
    return;
  }

  sendJson(response, 200, auth.user);
}
