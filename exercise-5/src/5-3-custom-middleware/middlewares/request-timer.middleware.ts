import { Response, NextFunction } from "express";

import { RequestWithUser } from "../types/request-with-user.interface.js";

/**
 * Measures total request duration.
 *
 * Stores the start time when the request arrives and
 * logs the elapsed time after the response finishes.
 */
export function requestTimerMiddleware(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
): void {
  req.startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - (req.startTime ?? Date.now());

    console.log(`${req.method} ${req.originalUrl} completed in ${duration} ms`);
  });

  next();
}
