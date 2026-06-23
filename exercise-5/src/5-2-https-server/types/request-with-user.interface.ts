import { Request } from "express";

export interface RequestWithUser extends Request {
  user?: {
    name: string;
  };

  startTime?: number;
}
