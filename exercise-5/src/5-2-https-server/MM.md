Perfect. Exercise 5 introduces HTTPS, TLS, middleware internals, and how Express builds a middleware pipeline on top of Node's HTTP primitives.

Like previous exercises, we'll emphasize:

- Separation of concerns
- TypeScript
- Docstrings
- Incremental commits
- Understanding how things work under the hood
- Small steps instead of building everything at once

---

# Project Structure

```text
exercise-5/
│
├── certs/
│   ├── key.pem
│   └── cert.pem
│
├── src/
│
│   ├── 5-2-https-server/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │     └── secure.route.ts
│   │   └── types/
│   │         └── https-options.type.ts
│   │
│   ├── 5-3-custom-middleware/
│   │   ├── index.ts
│   │   ├── middlewares/
│   │   │      ├── logger.middleware.ts
│   │   │      ├── request-timer.middleware.ts
│   │   │      ├── body-size-guard.middleware.ts
│   │   │      └── fake-auth.middleware.ts
│   │   │
│   │   ├── routes/
│   │   │      └── data.route.ts
│   │   │
│   │   ├── types/
│   │   │      └── request-with-user.interface.ts
│   │   │
│   │   └── logs/
│   │          └── requests.log
│   │
│   └── 5-4-bridge-question/
│          └── explanation.md
│
├── .gitignore
├── package.json
└── tsconfig.json
```

---

# Part 5.1 — TLS Setup

## Step 1: Verify OpenSSL

```bash
openssl version
```

Expected:

```text
OpenSSL 3.x.x ...
```

---

## Step 2: Create Certificates Folder

```bash
mkdir certs
```

---

## Step 3: Generate Key and Certificate

```bash
openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes
```

Press Enter through everything.

You should obtain:

```text
certs/
├── cert.pem
└── key.pem
```

---

## Step 4: Protect Secrets

Add to `.gitignore`

```gitignore
certs/
```

because:

- key.pem must never be committed
- private keys should remain local

---

### Commit

```bash
git add .

git commit -m "chore(exercise-5): configure local TLS certificates

- generate self-signed certificate
- add certs directory to gitignore
- prepare HTTPS environment
"
```

---

# Part 5.2 — HTTPS Server

Goal:

```
GET /secure
```

returns:

```json
{
  "message": "you are on a secure connection"
}
```

---

## Step 1 — Types

### src/5-2-https-server/types/https-options.type.ts

```ts
import { ServerOptions } from "node:https";

/**
 * Represents HTTPS server configuration.
 */
export type HttpsOptions = ServerOptions;
```

---

## Step 2 — Route

### routes/secure.route.ts

```ts
import { ServerResponse } from "node:http";

/**
 * Handles GET /secure.
 */
export function handleSecureRoute(response: ServerResponse): void {
  response.writeHead(200, {
    "Content-Type": "application/json",
  });

  response.end(
    JSON.stringify({
      message: "you are on a secure connection",
    }),
  );
}
```

---

## Step 3 — HTTPS Server

### index.ts

```ts
import fs from "node:fs";
import https from "node:https";

import { handleSecureRoute } from "./routes/secure.route.js";

/**
 * Loads TLS certificate files.
 */
const options = {
  key: fs.readFileSync("certs/key.pem"),
  cert: fs.readFileSync("certs/cert.pem"),
};

const server = https.createServer(options, (req, res) => {
  if (req.method === "GET" && req.url === "/secure") {
    handleSecureRoute(res);

    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(4000, () => {
  console.log("HTTPS server running at https://localhost:4000/secure");
});
```

---

Test:

```
GET https://localhost:4000/secure
```

Turn SSL verification OFF in Postman.

---

### Commit

```bash
git add .

git commit -m "feat(exercise-5): implement HTTPS server using native module

- configure self-signed certificates
- create secure endpoint
- separate route handler from server setup
"
```

---

# Part 5.3 — Express Middleware Pipeline

Before writing code, understand what we're building.

Request flow:

```text
POST /data
        ↓
Logger
        ↓
Request Timer
        ↓
Body Size Guard
        ↓
Fake Auth
        ↓
Route Handler
```

Each middleware decides:

```ts
next();
```

or

```ts
return response;
```

---

## Step 1 — Install Express

```bash
npm install express
npm install -D @types/express
```

---

### Commit

```bash
git add .

git commit -m "build(exercise-5): install express and type definitions

- add express dependency
- configure typings
- prepare middleware pipeline
"
```

---

# Step 2 — Custom Request Type

### types/request-with-user.interface.ts

```ts
import { Request } from "express";

export interface RequestWithUser extends Request {
  user?: {
    name: string;
  };

  startTime?: number;
}
```

---

### Commit

```bash
git add .

git commit -m "feat(exercise-5): define request extension types

- add authenticated user field
- add request timing field
"
```

---

Next steps (which we'll build one by one like previous exercises):

## Logger Middleware

Responsibilities:

- timestamp
- method
- route
- append to requests.log using fs.promises

---

## Request Timer Middleware

Responsibilities:

- store startTime
- listen for:

```ts
res.on("finish");
```

- calculate duration

---

## Body Size Guard

Reject:

```
Content-Length > 1024
```

Return:

```json
413 Payload Too Large
```

---

## Fake Auth Middleware

Check:

```http
x-token: secret123
```

Attach:

```ts
req.user = {
  name: "admin",
};
```

Otherwise:

```json
401 Unauthorized
```

---

## Route

```
POST /data
```

returns:

```json
{
  "body": req.body,
  "user": req.user
}
```

---

## Part 5.4

We'll finish by writing the bridge explanation:

> How Express middleware works internally, how next() creates a chain, and what we would have to manually build in pure HTTPS to recreate Express.

That part is where the architecture becomes interesting because we'll essentially discover that Express is just a sophisticated middleware pipeline built on top of Node's native HTTP server.

I recommend continuing exercise 5 exactly as we did exercise 4, one middleware and one commit at a time.
