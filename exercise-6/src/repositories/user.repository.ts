import { User } from "../types/user.interface.js";

import { readJsonFile, writeJsonFile } from "../utils/json-file.js";

import { USERS_FILE } from "../constants/file-paths.js";

/**
 * Handles all persistence operations
 * for users.json.
 */
export class UserRepository {
  /**
   * Returns every stored user.
   */
  async findAll(): Promise<User[]> {
    return readJsonFile<User[]>(USERS_FILE);
  }

  /**
   * Finds a user by ID.
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
   * Persists the complete collection.
   */
  async saveAll(users: User[]): Promise<void> {
    await writeJsonFile(USERS_FILE, users);
  }

  /**
   * Creates a new user.
   */
  async create(user: User): Promise<void> {
    const users = await this.findAll();

    users.push(user);

    await this.saveAll(users);
  }

  /**
   * Updates an existing user.
   */
  async update(updatedUser: User): Promise<void> {
    const users = await this.findAll();

    const updatedUsers = users.map((user) =>
      user.id === updatedUser.id ? updatedUser : user,
    );

    await this.saveAll(updatedUsers);
  }

  /**
   * Deletes a user.
   */
  async delete(id: string): Promise<void> {
    const users = await this.findAll();

    const remainingUsers = users.filter((user) => user.id !== id);

    await this.saveAll(remainingUsers);
  }
}
