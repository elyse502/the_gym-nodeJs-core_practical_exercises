import { Request } from "express";

/**
 * Extends Express Request with custom properties
 * used by application middleware.
 */
export interface RequestWithUser extends Request {
  user?: {
    name: string;
  };

  startTime?: number;
}
