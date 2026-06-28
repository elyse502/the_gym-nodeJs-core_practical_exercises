import crypto from "node:crypto";

import { UserRepository } from "../repositories/user.repository.js";

import { User } from "../types/user.interface.js";

const userRepository = new UserRepository();

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
}
