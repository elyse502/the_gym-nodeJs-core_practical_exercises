import crypto from "node:crypto";

import { UserRepository } from "../repositories/user.repository.js";
import { User } from "../types/user.interface.js";

import { SessionRepository } from "../repositories/session.repository.js";
import { Session } from "../types/session.interface.js";
import { toSafeUser } from "../utils/user-mapper.js";

import { acquireLock, releaseLock } from "../utils/write-lock.js";

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
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    await acquireLock();

    try {
      const existingUser = await userRepository.findByEmail(email);

      if (existingUser) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }

      const user: User = {
        id: crypto.randomUUID(),
        name,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      };

      await userRepository.create(user);

      return toSafeUser(user);
    } finally {
      releaseLock();
    }
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

  /**
   * Returns a single user by ID.
   *
   * @throws Error if the user does not exist.
   */
  async getById(id: string): Promise<Omit<User, "password">> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return toSafeUser(user);
  }

  /**
   * Updates the user's name.
   *
   * @throws Error if user does not exist.
   */
  async updateName(id: string, name: string): Promise<Omit<User, "password">> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const updatedUser: User = {
      ...user,
      name,
    };

    await userRepository.update(updatedUser);

    return toSafeUser(updatedUser);
  }

  /**
   * Deletes a user and all of
   * their active sessions.
   *
   * @throws Error if the user
   * does not exist.
   */
  async deleteUser(id: string): Promise<void> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    await userRepository.delete(id);

    await sessionRepository.deleteByUserId(id);
  }
}
