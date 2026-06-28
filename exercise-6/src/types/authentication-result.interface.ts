import { Session } from "./session.interface.js";
import { User } from "./user.interface.js";

/**
 * Represents a successfully authenticated request.
 */
export interface AuthenticationResult {
  user: User;
  session: Session;
}
