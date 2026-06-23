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
