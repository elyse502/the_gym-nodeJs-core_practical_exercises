import { Response, NextFunction } from "express";

import { RequestWithUser } from "../types/request-with-user.interface.js";

/**
 * Simple authentication middleware.
 *
 * Validates x-token header and attaches
 * a fake authenticated user to the request.
 */
export function fakeAuthMiddleware(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
): void {
  const token = req.header("x-token");

  if (token !== "secret123") {
    res.status(401).json({
      error: "Unauthorized",
    });

    return;
  }

  req.user = {
    name: "admin",
  };

  next();
}
