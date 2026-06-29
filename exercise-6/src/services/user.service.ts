import crypto from "node:crypto";

import { UserRepository } from "../repositories/user.repository.js";
import { User } from "../types/user.interface.js";

import { SessionRepository } from "../repositories/session.repository.js";
import { Session } from "../types/session.interface.js";
import { toSafeUser } from "../utils/user-mapper.js";

const userRepository = new UserRepository();

const sessionRepository = new SessionRepository();

/**
 * Handles business logic related to users.
 */
export class UserService {
  /**
   * Registers a new user.
   *
   * @throws Error if the email already exists.
   */
  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<Omit<User, "password">> {
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const user: User = {
      id: crypto.randomUUID(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    await userRepository.create(user);

    const { password: _, ...safeUser } = user;

    return safeUser;
  }

  /**
   * Authenticates a user and creates
   * a new session.
   *
   * @throws Error when credentials
   * are invalid.
   */
  async login(email: string, password: string): Promise<{ token: string }> {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    if (hashedPassword !== user.password) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const session: Session = {
      token: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date().toISOString(),
    };

    await sessionRepository.create(session);

    return {
      token: session.token,
    };
  }

  /**
   * Returns every registered user without
   * exposing password hashes.
   *
   * If a name filter is provided,
   * performs a case-insensitive match.
   */
  async getAll(name?: string): Promise<Omit<User, "password">[]> {
    const users = await userRepository.findAll();

    const filteredUsers =
      name === undefined
        ? users
        : users.filter((user) =>
            user.name.toLowerCase().includes(name.toLowerCase()),
          );

    return filteredUsers.map((user) => toSafeUser(user));
  }
}
