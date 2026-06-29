import { User } from "../types/user.interface.js";

/**
 * Removes sensitive fields before a user
 * is returned to API clients.
 */
export function toSafeUser(user: User): Omit<User, "password"> {
  const { password: _, ...safeUser } = user;

  return safeUser;
}
