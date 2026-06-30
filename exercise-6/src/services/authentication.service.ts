import { IncomingMessage } from "node:http";

import { SessionRepository } from "../repositories/session.repository.js";
import { UserRepository } from "../repositories/user.repository.js";

import { AuthenticationResult } from "../types/authentication-result.interface.js";

import { toSafeUser } from "../utils/user-mapper.js";

const sessionRepository = new SessionRepository();
const userRepository = new UserRepository();

/**
 * Authenticates an incoming request using the
 * x-session-token header.
 *
 * Returns the authenticated user together with the
 * matching session, or null if authentication fails.
 */
export async function authenticate(
  request: IncomingMessage,
): Promise<AuthenticationResult | null> {
  const token = request.headers["x-session-token"];

  if (!token || Array.isArray(token)) {
    return null;
  }

  const session = await sessionRepository.findByToken(token);

  if (!session) {
    return null;
  }

  const user = await userRepository.findById(session.userId);

  if (!user) {
    return null;
  }

  return {
    user: toSafeUser(user) as never,
    session,
  };
}
