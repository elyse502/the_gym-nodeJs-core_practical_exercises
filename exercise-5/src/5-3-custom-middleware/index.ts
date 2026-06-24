import express from "express";

import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { requestTimerMiddleware } from "./middlewares/request-timer.middleware.js";

const app = express();

app.use(loggerMiddleware);
app.use(requestTimerMiddleware);

app.post("/data", (_req, res) => {
  setTimeout(() => {
    res.json({
      success: true,
    });
  }, 1000);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
