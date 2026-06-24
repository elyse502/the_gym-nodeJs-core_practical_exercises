<details>
    <summary><b>First Part</b></summary>

## Exercise 5.3 — Logger Middleware (Step 1)

You now build the first real middleware.

Goal:

- Log every request
- Store logs in file
- Keep middleware non-blocking
- Keep responsibilities isolated

---

# Folder update

```text id="m8v2ql"
src/5-3-custom-middleware/
│
├── middlewares/
│   └── logger.middleware.ts
│
├── logs/
│   └── requests.log
│
└── index.ts
```

---

# Step 1 — Logger Middleware

## middlewares/logger.middleware.ts

```ts id="w9kq2x"
import fs from "node:fs/promises";
import path from "node:path";
import { Request, Response, NextFunction } from "express";

/**
 * Logs each incoming request to disk.
 *
 * Format:
 * [timestamp] METHOD /path
 */
export async function loggerMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const timestamp = new Date().toISOString();

  const line = `[${timestamp}] ${req.method} ${req.url}\n`;

  const logPath = path.resolve("src/5-3-custom-middleware/logs/requests.log");

  await fs.appendFile(logPath, line);

  next();
}
```

---

# Step 2 — Create log file

```text id="8h3nqv"
src/5-3-custom-middleware/logs/requests.log
```

Leave empty or add:

```txt id="p2v7kx"
--- LOG START ---
```

---

# Step 3 — Hook middleware into Express

## index.ts (partial update)

```ts id="x3nq8m"
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
```

---

# What happens now

Each request:

```txt id="k1v9ds"
POST /data
```

produces:

```txt id="l4p0qz"
[2026-06-23T10:00:00Z] POST /data
```

inside:

```txt id="r7m2xp"
requests.log
```

---

# Key behavior

This middleware:

- runs before route handler
- does async file write
- does not block request flow
- always calls next()

---

# Important concept

This is not Express magic.

This is just:

```txt id="v0n3cw"
function(req, res, next)
```

executed in sequence.

---

# Commit

```bash id="c8w2qf"
git add .

git commit -m "feat(exercise-5): implement request logger middleware

- log HTTP method and path with timestamp
- persist logs using fs.promises
- integrate middleware into express pipeline
"
```

---

## Next step (5.3 continued)

Next middleware:

- request timer middleware

This one will introduce:

- `res.on('finish')`
- lifecycle hooks
- measuring full request duration

This is where you start seeing real production-style monitoring behavior.

</details>

<br/><hr/><br/>

<details>
  <summary><b>Second Part</b></summary>

Excellent. This middleware teaches an important concept:

> Middleware executes before the response is sent, but `res.on("finish")` lets us run code after the response has completely left the server.

This is how production systems collect metrics, analytics, and traces.

---

# Exercise 5.3 — Request Timer Middleware

## Goal

Measure how long the entire request took.

We want:

```txt
Request arrives
        ↓
Store start time
        ↓
Middlewares execute
        ↓
Route executes
        ↓
Response sent
        ↓
res.finish event fires
        ↓
Log total duration
```

---

# Folder Structure

```text
src/5-3-custom-middleware/
│
├── middlewares/
│   ├── logger.middleware.ts
│   └── request-timer.middleware.ts
│
├── types/
│   └── request-with-user.interface.ts
│
└── index.ts
```

---

# Step 1 — Extend Request Type

Update:

## types/request-with-user.interface.ts

```ts
import { Request } from "express";

/**
 * Extends Express Request with custom properties
 * used throughout the middleware pipeline.
 */
export interface RequestWithUser extends Request {
  user?: {
    name: string;
  };

  startTime?: number;
}
```

---

# Step 2 — Create Timer Middleware

## middlewares/request-timer.middleware.ts

```ts
import { Response, NextFunction } from "express";

import { RequestWithUser } from "../types/request-with-user.interface.js";

/**
 * Measures total request duration.
 *
 * Stores the start time when the request arrives and
 * logs the elapsed time after the response finishes.
 */
export function requestTimerMiddleware(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
): void {
  req.startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - (req.startTime ?? Date.now());

    console.log(`${req.method} ${req.originalUrl} completed in ${duration} ms`);
  });

  next();
}
```

---

# Why use res.on("finish")?

If we do:

```ts
req.startTime = Date.now();

next();

console.log(Date.now() - req.startTime);
```

we measure:

```txt
Middleware execution only
```

Not:

```txt
Entire request lifecycle
```

because:

```txt
next()
```

returns immediately.

The route handler still hasn't completed.

---

`finish` means:

```txt
Response headers sent
Response body sent
Socket flushed
Request completed
```

Now we have true request duration.

---

# Step 3 — Register Middleware

Update:

## index.ts

```ts
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
```

---

# Test

Send:

```http
POST /data
```

Console:

```txt
POST /data completed in 1008 ms
```

because:

```ts
setTimeout(...,1000)
```

delays the response.

---

# Event Timeline

```txt
Request arrives
↓
loggerMiddleware
↓
requestTimerMiddleware
(start timer)
↓
route handler
↓
setTimeout(1000)
↓
res.json()
↓
response leaves server
↓
finish event
↓
duration logged
```

---

# Real World Usage

Exactly this pattern is used in:

- Express
- NestJS
- Datadog
- New Relic
- OpenTelemetry
- Prometheus instrumentation
- APM tools

---

# Why "finish" and not "close"?

### finish

Means:

```txt
Response completed successfully.
```

---

### close

Means:

```txt
Connection terminated.
```

The client might disconnect early.

Example:

Browser refreshes.

Network fails.

Socket closes.

No complete response.

---

Therefore:

```ts
res.on("finish");
```

is preferred for measuring successful requests.

---

# Next Step

Next we'll build:

## Body Size Guard Middleware

This introduces:

- `Content-Length`
- request validation
- early termination
- HTTP 413 Payload Too Large

and you'll see that middleware can stop the chain by simply not calling:

```ts
next();
```

which is one of the most fundamental ideas behind Express.

</details>
