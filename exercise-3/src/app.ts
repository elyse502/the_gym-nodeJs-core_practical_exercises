import express from "express";

import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(express.json());

app.use(userRoutes);

const PORT = 3000;

/**
 * Starts the application server.
 */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} 🔗`);
});
