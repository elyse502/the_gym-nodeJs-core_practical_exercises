import path from "node:path";

import { User } from "../types/user.js";
import { readJsonFile, writeJsonFile } from "../utils/file.util.js";

const USERS_FILE_PATH = path.resolve("data", "users.json");

/**
 * Handles persistence operations for users.
 *
 * This layer knows where users are stored and how
 * they are read/written.
 */
export class UserRepository {
  /**
   * Returns all users.
   */
  async findAll(): Promise<User[]> {
    return readJsonFile<User[]>(USERS_FILE_PATH);
  }

  /**
   * Finds a user by id.
   */
  async findById(id: string): Promise<User | undefined> {
    const users = await this.findAll();

    return users.find((user) => user.id === id);
  }

  /**
   * Finds a user by email.
   */
  async findByEmail(email: string): Promise<User | undefined> {
    const users = await this.findAll();

    return users.find((user) => user.email === email);
  }

  /**
   * Persists all users.
   */
  async saveAll(users: User[]): Promise<void> {
    await writeJsonFile(USERS_FILE_PATH, users);
  }

  /**
   * Creates a new user.
   */
  async create(user: User): Promise<User> {
    const users = await this.findAll();

    users.push(user);

    await this.saveAll(users);

    return user;
  }

  /**
   * Deletes a user by id.
   */
  async delete(id: string): Promise<boolean> {
    const users = await this.findAll();

    const filteredUsers = users.filter((user) => user.id !== id);

    if (filteredUsers.length === users.length) {
      return false;
    }

    await this.saveAll(filteredUsers);

    return true;
  }
}
