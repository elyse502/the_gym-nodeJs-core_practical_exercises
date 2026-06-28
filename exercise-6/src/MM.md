<details>
    <summary><b>First phase</b></summary>

Excellent exercise.

This is the first one where you're essentially rebuilding a small subset of Express + Session Authentication + File-based Persistence from scratch.

The exercise is intentionally designed to force you to understand:

- How HTTP bodies arrive over TCP
- Why request bodies arrive in chunks
- How routing actually works
- How authentication works internally
- How sessions work
- Why databases exist
- What race conditions look like
- Why write locks matter
- What Express and ORMs abstract away

Because this exercise is large, we'll split it into phases exactly like we did for previous exercises.

---

# Exercise 6 Roadmap

```text
Exercise 6
│
├── Step 1
│   Project setup
│
├── Step 2
│   File structure
│
├── Step 3
│   Utility layer
│   ├── getBody()
│   ├── JSON helpers
│   ├── response helpers
│   └── file helpers
│
├── Step 4
│   Manual router
│
├── Step 5
│   User repository
│
├── Step 6
│   Session repository
│
├── Step 7
│   Authentication helper
│
├── Step 8
│   Register
│
├── Step 9
│   Login
│
├── Step 10
│   Logout
│
├── Step 11
│   GET /users
│
├── Step 12
│   GET /users/:id
│
├── Step 13
│   PUT /users/:id
│
├── Step 14
│   DELETE /users/:id
│
├── Step 15
│   GET /me
│
├── Step 16
│   Stress testing
│
├── Step 17
│   Race condition analysis
│
└── Step 18
    Write lock implementation
```

---

# Step 1 — Project Setup

## Folder Structure

Create:

```text
exercise-6/
│
├── data/
│   ├── users.json
│   └── sessions.json
│
├── src/
│
│   ├── server.ts
│
│   ├── controllers/
│
│   ├── repositories/
│
│   ├── routes/
│
│   ├── services/
│
│   ├── utils/
│
│   ├── types/
│
│   └── constants/
│
├── package.json
├── tsconfig.json
└── README.md
```

Initialize files:

### users.json

```json
[]
```

### sessions.json

```json
[]
```

---

# Why This Structure?

Unlike Exercise 3, this application has:

- Authentication
- Sessions
- Routing
- Multiple repositories
- Business rules

Keeping everything in one file becomes difficult quickly.

We're following separation of concerns.

---

# Step 2 — Define Types

Create:

## types/user.interface.ts

```ts
/**
 * Stored user record.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}
```

---

## types/session.interface.ts

```ts
/**
 * Stored user session.
 */
export interface Session {
  token: string;
  userId: string;
  createdAt: string;
}
```

---

## types/request-body.type.ts

```ts
export type RequestBody = Record<string, unknown>;
```

---

# Commit

```bash
git add .

git commit -m "chore(exercise-6): initialize project structure

- create data storage files
- establish layered architecture
- define core domain types
- prepare repositories and services structure
"
```

---

# Step 3 — Response Helpers

Before we build `getBody()` we should create reusable response helpers.

Create:

## utils/send-json.ts

```ts
import { ServerResponse } from "node:http";

/**
 * Sends a JSON response.
 */
export function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  });

  response.end(JSON.stringify(payload));
}
```

---

## utils/send-error.ts

```ts
import { ServerResponse } from "node:http";

import { sendJson } from "./send-json.js";

/**
 * Sends a standardized error response.
 */
export function sendError(
  response: ServerResponse,
  statusCode: number,
  message: string,
): void {
  sendJson(response, statusCode, {
    error: message,
  });
}
```

---

# Why Build These First?

Without helpers every handler becomes:

```ts
response.writeHead(...)
response.end(...)
```

repeated dozens of times.

We'll use:

```ts
sendJson(res, 200, data);

sendError(res, 404, "User not found");
```

throughout the project.

---

# Next Step

We'll implement the most important part of the entire exercise:

## `getBody(req)`

This is where you'll learn:

- Why HTTP bodies arrive in chunks
- How streams work
- How Express's `express.json()` works internally
- How to enforce a 2 KB limit
- How to handle malformed JSON
- How to manually build `req.body`

This is one of the best learning sections in the entire Node.js core series, so we'll do it carefully in the next step.

</details>

<br/><hr/><br/>

<details>
    <summary><b>Second phase</b></summary>

Excellent. This is arguably the most important implementation in the entire exercise.

If you deeply understand `getBody(req)`, you'll understand what every Node.js framework does before your route handler executes.

Express, Fastify, Koa, NestJS, Hapi... they all solve this same problem.

---

# Step 4 — Build `getBody(req)`

## First, understand why we need it

When you send this request:

```http
POST /register
Content-Type: application/json

{
  "name": "Elysee",
  "email": "elysee@example.com",
  "password": "123456"
}
```

Many beginners imagine Node receives:

```ts
req.body;
```

like Express does.

It doesn't.

Instead, Node receives a readable stream.

Conceptually:

```text
TCP Socket
     │
     ▼
IncomingMessage (Readable Stream)
     │
     ▼
Chunk 1
Chunk 2
Chunk 3
Chunk 4
```

The request body might arrive in one chunk or hundreds of chunks depending on:

- Network speed
- MTU
- TCP segmentation
- Operating system buffers
- Request size

Node does not know when the complete body has arrived until the stream ends.

---

# The Three Events We Care About

`IncomingMessage` emits several events, but we only need three:

```ts
req.on("data", ...)
```

A new chunk has arrived.

```ts
req.on("end", ...)
```

All chunks have been received.

```ts
req.on("error", ...)
```

The stream failed.

---

# Data Flow

Suppose the client sends:

```json
{
  "name": "John",
  "email": "john@test.com"
}
```

Node might receive:

Chunk 1

```text
{
  "na
```

Chunk 2

```text
me":"John",
```

Chunk 3

```text
"email":
```

Chunk 4

```text
"john@test.com"}
```

Our job is:

```text
Receive chunks
        ↓
Store them
        ↓
Wait for "end"
        ↓
Merge them
        ↓
Parse JSON
        ↓
Return object
```

---

# Project Structure

Create:

```text
src/
└── utils/
      get-body.ts
```

---

# Implementation

```ts
import { IncomingMessage } from "node:http";

const MAX_BODY_SIZE = 2 * 1024;

/**
 * Reads and parses a JSON request body from an incoming HTTP request.
 *
 * IncomingMessage is a readable stream. The body arrives in chunks,
 * so this helper collects all chunks, enforces a maximum payload size,
 * and parses the final JSON once the stream ends.
 *
 * @param request - The incoming HTTP request.
 * @returns A Promise that resolves with the parsed JSON body.
 */
export function getBody<T = Record<string, unknown>>(
  request: IncomingMessage,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    let totalSize = 0;

    request.on("data", (chunk: Buffer) => {
      totalSize += chunk.length;

      console.log(
        `Chunk received: ${chunk.length} bytes (total: ${totalSize} bytes)`,
      );

      if (totalSize > MAX_BODY_SIZE) {
        request.destroy();

        reject(new Error("Payload Too Large"));

        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      try {
        const body = Buffer.concat(chunks).toString("utf8");

        console.log(`Raw body:\n${body}`);

        const parsed = JSON.parse(body);

        resolve(parsed);
      } catch {
        reject(new Error("Malformed JSON"));
      }
    });

    request.on("error", reject);
  });
}
```

---

# Walk Through The Code

## 1. Store incoming chunks

```ts
const chunks: Buffer[] = [];
```

Each network packet becomes one `Buffer`.

Example:

```text
[
 Buffer(...),
 Buffer(...),
 Buffer(...)
]
```

---

## 2. Count total size

```ts
totalSize += chunk.length;
```

Every chunk contributes to the payload size.

Example

Chunk 1

```text
512 bytes
```

Chunk 2

```text
700 bytes
```

Chunk 3

```text
900 bytes
```

Running total

```text
2112 bytes
```

---

## 3. Reject oversized requests

```ts
if (totalSize > MAX_BODY_SIZE)
```

Requirement:

```
2 KB maximum
```

If exceeded:

```ts
request.destroy();
```

Immediately stops reading.

This protects your server from clients attempting to send extremely large payloads.

---

## 4. Wait for the stream to finish

```ts
request.on("end");
```

This event fires exactly once.

Only here do we know the body is complete.

---

## 5. Merge chunks

```ts
Buffer.concat(chunks);
```

Example

Before

```text
[
 Buffer("Hel"),
 Buffer("lo "),
 Buffer("World")
]
```

After

```text
Buffer("Hello World")
```

---

## 6. Convert to UTF-8

```ts
.toString("utf8")
```

Transforms bytes into text.

---

## 7. Parse JSON

```ts
JSON.parse(body);
```

Transforms

```json
{
  "name": "John"
}
```

into

```ts
{
  name: "John";
}
```

---

# Why Return a Promise?

Reading the body is asynchronous.

The function cannot immediately return the parsed object because the stream may still be receiving data.

Instead:

```text
Call getBody()
        │
        ▼
Receive chunks
        │
        ▼
Receive end event
        │
        ▼
Resolve Promise
```

Usage becomes:

```ts
const body = await getBody(request);
```

---

# Example Route

Later, your controller will look like this:

```ts
const body = await getBody(request);

console.log(body.name);
console.log(body.email);
```

This feels similar to Express:

```ts
req.body;
```

The difference is that you've implemented the parsing yourself.

---

# Mental Model

```text
Client
   │
   ▼
TCP Socket
   │
   ▼
IncomingMessage
   │
   ├── data
   ├── data
   ├── data
   └── end
         │
         ▼
Buffer.concat()
         │
         ▼
JSON.parse()
         │
         ▼
JavaScript Object
```

---

# How This Relates to `express.json()`

Internally, `express.json()` performs essentially the same sequence of steps:

1. Listen for `"data"` events.
2. Accumulate chunks.
3. Enforce configured size limits.
4. Wait for `"end"`.
5. Convert bytes to a string.
6. Parse JSON.
7. Attach the result to `req.body`.
8. Call `next()`.

The main differences are that Express includes many additional features, such as configurable limits, content-type validation, detailed error handling, support for compressed request bodies, and integration with the middleware pipeline.

---

In the next step, we'll build the manual router that dispatches requests based on `req.method` and `req.url`, including extracting dynamic route parameters like `/users/:id` without using any routing library.

</details>

<br/><hr/><br/>

<details>
    <summary><b>Third phase</b></summary>

Excellent. Now we build one of the core pieces of every web framework: the router.

After this step, you'll understand what Express Router, Fastify Router, and NestJS Router are doing behind the scenes.

---

# Step 5 — Build a Manual Router

## Goal

Given:

```http
GET /users
```

dispatch to:

```ts
getAllUsers();
```

Given:

```http
GET /users/123
```

dispatch to:

```ts
getUserById("123");
```

Given:

```http
POST /login
```

dispatch to:

```ts
loginUser();
```

No Express.

No router library.

Only:

- `req.method`
- `req.url`
- `url.parse()`

---

# How Express Works

When you write:

```ts
app.get("/users/:id", controller);
```

Express internally stores something conceptually similar to:

```ts
[
  {
    method: "GET",
    pattern: "/users/:id",
    handler: controller,
  },
];
```

Then, for every request:

```text
Incoming Request
        ↓
Read Method
        ↓
Read URL
        ↓
Compare Routes
        ↓
Execute Matching Handler
```

We'll implement a simplified version of that.

---

# Project Structure

Create:

```text
src/
│
├── router/
│      router.ts
│
├── controllers/
│      placeholder.controller.ts
```

We'll use placeholder controllers for now and replace them as we implement each feature.

---

# Step 1 — Create Placeholder Controllers

## controllers/placeholder.controller.ts

```ts
import { IncomingMessage, ServerResponse } from "node:http";

import { sendJson } from "../utils/send-json.js";

/**
 * Temporary placeholder used while building
 * the routing system.
 */
export function notImplemented(
  _request: IncomingMessage,
  response: ServerResponse,
): void {
  sendJson(response, 501, {
    message: "Handler not implemented yet.",
  });
}
```

Why?

We want the router to be complete before we build the business logic.

This mirrors how large applications are often scaffolded.

---

# Step 2 — Create Route Matching Helpers

## router/router.ts

```ts
import { IncomingMessage, ServerResponse } from "node:http";
import { parse } from "node:url";

import { sendError } from "../utils/send-error.js";
import { notImplemented } from "../controllers/placeholder.controller.js";

/**
 * Represents a matched route.
 */
export interface RouteMatch {
  pathname: string;
  id?: string;
}
```

---

# Step 3 — Extract Route Parameters

The exercise requires handling:

```text
/users/:id
```

We need a helper.

```ts
/**
 * Attempts to match routes that contain an ID.
 *
 * Example:
 *
 * /users/123
 *
 * returns:
 *
 * {
 *   pathname: "/users/:id",
 *   id: "123"
 * }
 */
function matchRoute(pathname: string): RouteMatch {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 2 && segments[0] === "users") {
    return {
      pathname: "/users/:id",
      id: segments[1],
    };
  }

  return {
    pathname,
  };
}
```

---

# Example

Incoming URL

```text
/users/9fdc8f72
```

Split

```ts
["users", "9fdc8f72"];
```

Result

```ts
{
  pathname: "/users/:id",
  id: "9fdc8f72",
}
```

---

# Step 4 — Build the Router

```ts
/**
 * Dispatches incoming requests
 * to the appropriate controller.
 */
export function router(
  request: IncomingMessage,
  response: ServerResponse,
): void {
  const method = request.method ?? "GET";

  const { pathname = "/" } = parse(request.url ?? "/", true);

  const route = matchRoute(pathname);

  switch (`${method}:${route.pathname}`) {
    case "POST:/register":
      return notImplemented(request, response);

    case "POST:/login":
      return notImplemented(request, response);

    case "POST:/logout":
      return notImplemented(request, response);

    case "GET:/users":
      return notImplemented(request, response);

    case "GET:/users/:id":
      return notImplemented(request, response);

    case "PUT:/users/:id":
      return notImplemented(request, response);

    case "DELETE:/users/:id":
      return notImplemented(request, response);

    case "GET:/me":
      return notImplemented(request, response);

    default:
      sendError(response, 404, "Route not found");
  }
}
```

---

# Why Use `${method}:${pathname}`?

Instead of nesting switches:

```ts
switch (method) {
  case "GET":
    switch (pathname) {
      ...
    }
}
```

We flatten the routing key:

```text
GET:/users

POST:/login

DELETE:/users/123
```

This keeps the router concise and easy to extend.

---

# Step 5 — Create the HTTP Server

## server.ts

```ts
import http from "node:http";

import { router } from "./router/router.js";

/**
 * Entry point of the application.
 *
 * Creates the HTTP server and delegates
 * all requests to the router.
 */
const server = http.createServer((request, response) => {
  router(request, response);
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

---

# Request Flow

```text
HTTP Request
      │
      ▼
http.createServer()
      │
      ▼
router()
      │
      ▼
Read method
      │
      ▼
Read pathname
      │
      ▼
Extract :id
      │
      ▼
Match route
      │
      ▼
Controller
      │
      ▼
Response
```

---

# Testing

At this stage, every defined route returns the same placeholder response.

Example:

```http
GET /users
```

Response:

```json
{
  "message": "Handler not implemented yet."
}
```

Unknown route:

```http
GET /unknown
```

Response:

```json
{
  "error": "Route not found"
}
```

Status:

```http
404 Not Found
```

---

# Mental Model

Think of the router as a receptionist.

It doesn't perform the work itself.

It simply answers:

> "Which controller should handle this request?"

The controller then performs the business logic.

---

# Commit

```bash
git add .

git commit -m "feat(exercise-6): implement manual HTTP router

- create centralized request router
- parse request URLs manually
- support dynamic user ID routes
- dispatch requests by method and path
- add placeholder controllers for incremental development
- return 404 for unknown routes
"
```

---

## Next Step

We'll build the **User Repository**, which abstracts all interactions with `users.json`. This repository will expose methods like `findByEmail`, `findById`, `create`, `update`, `delete`, and `getAll`, keeping file I/O separate from business logic. This separation will also make the upcoming race condition analysis and write-lock implementation much easier to understand.

</details>
