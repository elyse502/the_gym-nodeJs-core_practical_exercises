import { Request, Response } from "express";

import { UserService } from "../services/user.service.js";

const userService = new UserService();

/**
 * Handles user-related HTTP requests.
 */
export class UserController {
  /**
   * Creates a user.
   */
  static async createUser(req: Request, res: Response) {
    try {
      const user = await userService.createUser(req.body);

      return res.status(201).json(user);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Returns all users.
   */
  static async getUsers(_req: Request, res: Response) {
    const users = await userService.getUsers();

    return res.status(200).json(users);
  }

  /**
   * Returns one user.
   */
  static async getUserById(req: Request, res: Response) {
    const user = await userService.getUserById(String(req.params.id));

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  }

  /**
   * Deletes a user.
   */
  static async deleteUser(req: Request, res: Response) {
    const deleted = await userService.deleteUser(String(req.params.id));

    if (!deleted) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(204).send();
  }
}
