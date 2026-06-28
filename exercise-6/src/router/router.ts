import { IncomingMessage, ServerResponse } from "node:http";
import { parse } from "node:url";

import { sendError } from "../utils/send-error.js";
import { notImplemented } from "../controllers/placeholder.controller.js";

import { registerUser } from "../controllers/user.controller.js";

import { loginUser, logoutUser } from "../controllers/auth.controller.js";

/**
 * Represents a matched route.
 */
export interface RouteMatch {
  pathname: string;
  id?: string;
}

/**
 * Attempts to match routes that contain an ID.
 *
 * Example:
 *
 * /users/123
 *
 * returns:
 *
 * {
 *   pathname: "/users/:id",
 *   id: "123"
 * }
 */
function matchRoute(pathname: string): RouteMatch {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 2 && segments[0] === "users") {
    const id = segments[1];
    return {
      pathname: "/users/:id",
      ...(id ? { id } : {}),
    };
  }

  return {
    pathname,
  };
}

/**
 * Dispatches incoming requests
 * to the appropriate controller.
 */
export async function router(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const method = request.method ?? "GET";

  const parsed = parse(request.url ?? "/", true);
  const pathname = parsed.pathname ?? "/";

  const route = matchRoute(pathname);

  switch (`${method}:${route.pathname}`) {
    case "POST:/register":
      return await registerUser(request, response);

    case "POST:/login":
      return await loginUser(request, response);

    case "POST:/logout":
      return await logoutUser(request, response);

    case "GET:/users":
      return notImplemented(request, response);

    case "GET:/users/:id":
      return notImplemented(request, response);

    case "PUT:/users/:id":
      return notImplemented(request, response);

    case "DELETE:/users/:id":
      return notImplemented(request, response);

    case "GET:/me":
      return notImplemented(request, response);

    default:
      sendError(response, 404, "Route not found");
  }
}
