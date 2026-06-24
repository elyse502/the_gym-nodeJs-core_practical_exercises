import { Request } from "express";

/**
 * Extends Express Request with custom properties
 * used throughout the middleware pipeline.
 */
export interface RequestWithUser extends Request {
  user?: {
    name: string;
  };

  startTime?: number;
}
