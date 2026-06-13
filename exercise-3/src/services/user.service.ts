import crypto from "node:crypto";

import { UserRepository } from "../repositories/user.repository.js";
import { CreateUserDto, User } from "../types/user.js";

/**
 * Handles user business rules.
 */
export class UserService {
  constructor(private readonly userRepository = new UserRepository()) {}

  /**
   * Registers a new user.
   */
  async createUser(payload: CreateUserDto): Promise<Omit<User, "password">> {
    const existingUser = await this.userRepository.findByEmail(payload.email);

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const user: User = {
      id: crypto.randomUUID(),
      name: payload.name,
      email: payload.email,
      password: payload.password,
      createdAt: new Date().toISOString(),
    };

    await this.userRepository.create(user);

    const { password, ...safeUser } = user;

    return safeUser;
  }

  /**
   * Returns all users without passwords.
   */
  async getUsers() {
    const users = await this.userRepository.findAll();

    return users.map(({ password, ...user }) => user);
  }

  /**
   * Returns one user without password.
   */
  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      return null;
    }

    const { password, ...safeUser } = user;

    return safeUser;
  }

  /**
   * Deletes a user.
   */
  async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id);
  }
}
