import { Request, Response, NextFunction } from "express";

/**
 * Rejects requests larger than 1 KB.
 *
 * Uses the Content-Length header supplied
 * by the client before the body is processed.
 */
export function bodySizeGuardMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const contentLength = Number(req.headers["content-length"] ?? 0);

  const MAX_BODY_SIZE = 1024;

  if (contentLength > MAX_BODY_SIZE) {
    res.status(413).json({
      error: "Payload Too Large",
      maxSizeBytes: MAX_BODY_SIZE,
    });

    return;
  }

  next();
}
