import express from "express";

import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { requestTimerMiddleware } from "./middlewares/request-timer.middleware.js";
import { bodySizeGuardMiddleware } from "./middlewares/body-size-guard.middleware.js";

const app = express();

app.use(loggerMiddleware);

app.use(requestTimerMiddleware);

app.use(bodySizeGuardMiddleware);

app.use(express.json());

app.post("/data", (_req, res) => {
  res.json({
    success: true,
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
