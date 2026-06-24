import { Response } from "express";

import { RequestWithUser } from "../types/request-with-user.interface.js";

/**
 * Handles POST /data.
 *
 * Returns the authenticated user and
 * submitted request body.
 */
export function handleDataRoute(req: RequestWithUser, res: Response): void {
  res.status(200).json({
    user: req.user,
    body: req.body,
  });
}
