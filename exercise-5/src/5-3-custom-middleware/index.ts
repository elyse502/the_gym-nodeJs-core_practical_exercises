import express from "express";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";

const app = express();

app.use(loggerMiddleware);

app.post("/data", (req, res) => {
  res.json({ ok: true });
});

app.listen(3000, () => {
  console.log("Server running on 3000");
});
