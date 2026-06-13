import { Router } from "express";

import { UserController } from "../controllers/user.controller.js";

const router = Router();

// health check endpoint
router.get("/", (_req, res) => {
  res.status(200).json({
    message: "Welcome to the User API 🍽️",
  });
});

router.post("/users", UserController.createUser);

router.get("/users", UserController.getUsers);

router.get("/users/:id", UserController.getUserById);

router.delete("/users/:id", UserController.deleteUser);

export default router;
