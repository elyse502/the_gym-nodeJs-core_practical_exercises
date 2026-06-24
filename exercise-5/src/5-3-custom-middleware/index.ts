import express from "express";

import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { requestTimerMiddleware } from "./middlewares/request-timer.middleware.js";
import { bodySizeGuardMiddleware } from "./middlewares/body-size-guard.middleware.js";
import { fakeAuthMiddleware } from "./middlewares/fake-auth.middleware.js";

import { handleDataRoute } from "./routes/data.route.js";

const app = express();

app.use(loggerMiddleware);

app.use(requestTimerMiddleware);

app.use(bodySizeGuardMiddleware);

app.use(express.json());

app.use(fakeAuthMiddleware);

app.post("/data", handleDataRoute);

app.listen(3000, () => {
  console.log("Express server running on http://localhost:3000");
});
