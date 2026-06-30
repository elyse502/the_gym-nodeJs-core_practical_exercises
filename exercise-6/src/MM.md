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

<br/><hr/><br/>

<details>
    <summary><b>Fourth phase</b></summary>

Excellent. This is where the project begins to resemble a real backend application.

From this point forward, every controller will communicate with a repository instead of reading and writing JSON files directly.

This is the same architectural pattern used in applications backed by databases.

```text
Controller
      │
      ▼
Repository
      │
      ▼
JSON File

(Later in real applications)

Controller
      │
      ▼
Repository
      │
      ▼
PostgreSQL / MongoDB / MySQL
```

Notice that the controller doesn't care where the data comes from.

---

# Step 6 — Build the User Repository

## Why a Repository?

Suppose we didn't use one.

Every controller would contain this:

```ts
const users = JSON.parse(
  await fs.readFile(...)
);

// business logic

await fs.writeFile(...)
```

Now imagine six controllers doing the same thing.

You'd duplicate:

- Reading files
- Parsing JSON
- Writing JSON
- Error handling

Instead we centralize all persistence logic.

---

# Project Structure

Create:

```text
src/
│
├── repositories/
│      user.repository.ts
│
├── utils/
│      json-file.ts
```

We'll first build reusable JSON file helpers.

---

# Step 1 — JSON File Helpers

## utils/json-file.ts

```ts
import { promises as fs } from "node:fs";

/**
 * Reads and parses a JSON file.
 *
 * @param filePath Absolute or relative path to the JSON file.
 * @returns Parsed JSON data.
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf8");

  return JSON.parse(content) as T;
}

/**
 * Writes JSON data to a file.
 *
 * @param filePath Destination file path.
 * @param data Data to serialize.
 */
export async function writeJsonFile(
  filePath: string,
  data: unknown,
): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}
```

---

## Why Generic Types?

Notice:

```ts
readJsonFile<T>();
```

This allows the caller to decide what type is expected.

Example:

```ts
const users =
  await readJsonFile<User[]>(...);
```

or

```ts
const sessions =
  await readJsonFile<Session[]>(...);
```

One helper works everywhere.

---

# Step 2 — Repository Constants

Create:

## constants/file-paths.ts

```ts
import path from "node:path";

/**
 * Absolute paths to application data files.
 */
export const USERS_FILE = path.resolve("data", "users.json");

export const SESSIONS_FILE = path.resolve("data", "sessions.json");
```

Why?

Avoid scattering string paths throughout the codebase.

---

# Step 3 — Create Repository

## repositories/user.repository.ts

```ts
import { User } from "../types/user.interface.js";

import { readJsonFile, writeJsonFile } from "../utils/json-file.js";

import { USERS_FILE } from "../constants/file-paths.js";

/**
 * Handles all persistence operations
 * for users.json.
 */
export class UserRepository {
  /**
   * Returns every stored user.
   */
  async findAll(): Promise<User[]> {
    return readJsonFile<User[]>(USERS_FILE);
  }

  /**
   * Finds a user by ID.
   */
  async findById(id: string): Promise<User | undefined> {
    const users = await this.findAll();

    return users.find((user) => user.id === id);
  }

  /**
   * Finds a user by email.
   */
  async findByEmail(email: string): Promise<User | undefined> {
    const users = await this.findAll();

    return users.find((user) => user.email === email);
  }

  /**
   * Persists the complete collection.
   */
  async saveAll(users: User[]): Promise<void> {
    await writeJsonFile(USERS_FILE, users);
  }

  /**
   * Creates a new user.
   */
  async create(user: User): Promise<void> {
    const users = await this.findAll();

    users.push(user);

    await this.saveAll(users);
  }

  /**
   * Updates an existing user.
   */
  async update(updatedUser: User): Promise<void> {
    const users = await this.findAll();

    const updatedUsers = users.map((user) =>
      user.id === updatedUser.id ? updatedUser : user,
    );

    await this.saveAll(updatedUsers);
  }

  /**
   * Deletes a user.
   */
  async delete(id: string): Promise<void> {
    const users = await this.findAll();

    const remainingUsers = users.filter((user) => user.id !== id);

    await this.saveAll(remainingUsers);
  }
}
```

---

# Why Not Export Plain Functions?

We could have written:

```ts
findAll();

findByEmail();

findById();
```

Using a class groups all persistence operations together.

Later, if you switch from JSON files to PostgreSQL, only this repository changes.

Your controllers remain unchanged.

This follows the Repository Pattern.

---

# Repository Responsibilities

The repository should only answer questions about storage.

Examples:

✔ Read all users.

✔ Find a user by email.

✔ Save users.

✔ Delete users.

It should never decide:

- Who is allowed to update?
- Whether a password matches?
- Whether a request is authenticated?

Those are business rules handled by services or controllers.

---

# Mental Model

```text
HTTP Request
      │
      ▼
Controller
      │
      ▼
UserRepository
      │
      ▼
users.json
```

The controller doesn't know whether data comes from:

- JSON
- SQLite
- PostgreSQL
- MongoDB
- Redis

It only calls repository methods.

---

# Quick Test

Although no controller uses it yet, you can verify the repository in a temporary script:

```ts
const repository = new UserRepository();

const users = await repository.findAll();

console.log(users);
```

You should see:

```json
[]
```

assuming `users.json` still contains an empty array.

---

## Next Step

We'll build the **Session Repository**, which mirrors the `UserRepository` but manages `sessions.json`. With both repositories in place, we'll implement registration and login using password hashing, UUID generation, and persistent session storage. This also prepares the foundation for `authenticate(req)` and all protected routes.

</details>

<br/><hr/><br/>

<details>
  <summary><b>Fifth phase</b></summary>

Excellent. We're now building the second half of the persistence layer.

After this step, the project has everything needed to support authentication.

Just like `UserRepository` encapsulates all user storage, `SessionRepository` will encapsulate all session storage.

This symmetry is intentional. Good architectures strive for consistency.

---

# Step 7 — Build the Session Repository

## What is a Session?

When a user logs in successfully, we don't want them to send their email and password with every request.

Instead:

```text
Login
   │
   ▼
Verify credentials
   │
   ▼
Generate session token
   │
   ▼
Store session
   │
   ▼
Return token
```

Subsequent requests look like:

```http
GET /me
x-session-token: 7d6d2d5c-...
```

The server checks whether that token exists and maps it back to a user.

---

# Session Flow

```text
Client
   │
   │ Login
   ▼
Server
   │
   ▼
sessions.json

[
  {
    token,
    userId,
    createdAt
  }
]

      ▲
      │
Future Requests
      │
x-session-token
```

---

# Project Structure

We already have:

```text
src/
├── repositories/
│      user.repository.ts
```

Now add:

```text
src/
├── repositories/
│      session.repository.ts
```

---

# Session Repository

## repositories/session.repository.ts

```ts
import { Session } from "../types/session.interface.js";

import { readJsonFile, writeJsonFile } from "../utils/json-file.js";

import { SESSIONS_FILE } from "../constants/file-paths.js";

/**
 * Handles all persistence operations
 * for sessions.json.
 */
export class SessionRepository {
  /**
   * Returns every stored session.
   */
  async findAll(): Promise<Session[]> {
    return readJsonFile<Session[]>(SESSIONS_FILE);
  }

  /**
   * Finds a session by token.
   */
  async findByToken(token: string): Promise<Session | undefined> {
    const sessions = await this.findAll();

    return sessions.find((session) => session.token === token);
  }

  /**
   * Persists the complete session collection.
   */
  async saveAll(sessions: Session[]): Promise<void> {
    await writeJsonFile(SESSIONS_FILE, sessions);
  }

  /**
   * Creates a new session.
   */
  async create(session: Session): Promise<void> {
    const sessions = await this.findAll();

    sessions.push(session);

    await this.saveAll(sessions);
  }

  /**
   * Removes a session by token.
   */
  async deleteByToken(token: string): Promise<void> {
    const sessions = await this.findAll();

    const remainingSessions = sessions.filter(
      (session) => session.token !== token,
    );

    await this.saveAll(remainingSessions);
  }

  /**
   * Removes every session
   * belonging to a user.
   */
  async deleteByUserId(userId: string): Promise<void> {
    const sessions = await this.findAll();

    const remainingSessions = sessions.filter(
      (session) => session.userId !== userId,
    );

    await this.saveAll(remainingSessions);
  }
}
```

---

# Repository Responsibilities

Notice how similar this is to `UserRepository`.

That's intentional.

A repository should expose operations that naturally belong to the stored entity.

For sessions:

```ts
findByToken();

create();

deleteByToken();

deleteByUserId();
```

For users:

```ts
findByEmail()

findById()

create()

update()

delete()
```

---

# Mental Model

```text
Controller
      │
      ▼
SessionRepository
      │
      ▼
sessions.json
```

The controller never touches the JSON file directly.

---

# Example `sessions.json`

Initially:

```json
[]
```

After one login:

```json
[
  {
    "token": "7a2f7b47-5d4b-4c89-9a4d-d5e4d52a8e15",
    "userId": "db3d3e2a-ff66-4f86-bb63-4f95e55c43e1",
    "createdAt": "2026-06-28T10:15:30.452Z"
  }
]
```

After another login from the same user:

```json
[
  {
    "token": "first-token",
    "userId": "123",
    "createdAt": "..."
  },
  {
    "token": "second-token",
    "userId": "123",
    "createdAt": "..."
  }
]
```

This means the same user is logged in from two different sessions.

That's acceptable for this exercise.

---

# Why Delete All Sessions on User Deletion?

Imagine:

```text
User deleted
```

but:

```json
sessions.json

[
  {
    "token": "...",
    "userId": "deleted-user"
  }
]
```

Now you have orphaned sessions.

Deleting all sessions belonging to the user keeps the data consistent.

---

# Looking Ahead

The next step is `authenticate(req)`.

Its logic will be surprisingly small because the repositories already provide everything it needs:

```text
Read header
      │
      ▼
Find session
      │
      ▼
Find user
      │
      ▼
Return user
```

That's one of the benefits of clean architecture: each layer stays focused on a single responsibility.

---

## Next Step

We'll implement the `authenticate(request)` helper. This will be the first reusable authentication component in the application and will be used by every protected route (`/logout`, `/users`, `/users/:id`, and `/me`). It will also give you a clear understanding of how session-based authentication works under the hood before frameworks like Express or Passport abstract it away.

</details>

<br/><hr/><br/>

<details>
  <summary><b>Sixth phase</b></summary>

Excellent. This is one of the most valuable pieces of the whole exercise.

After this step, you'll understand how session-based authentication works before frameworks like Express, Passport, or NextAuth abstract it away.

One thing I want to improve over the exercise instructions is the architecture.

Instead of making `authenticate()` simply return a `User | null`, we'll return an `AuthenticationResult`.

Why?

Because later controllers need both the authenticated user and the session token.

For example:

- `/logout` removes the session by token.
- `/delete` removes all sessions for a user.
- `/me` only needs the user.

Returning both avoids parsing the header twice.

---

# Step 8 — Authentication Service

## Authentication Flow

Every protected endpoint follows the same sequence:

```text
Incoming Request
        │
        ▼
Read x-session-token header
        │
        ▼
Find session
        │
        ▼
Session exists?
        │
   No ─────► 401
        │
       Yes
        │
        ▼
Find user
        │
        ▼
User exists?
        │
   No ─────► Invalid session
        │
       Yes
        │
        ▼
Authenticated User
```

---

# Project Structure

Create:

```text
src/
├── services/
│      authentication.service.ts
```

---

# Step 1 — Authentication Result Type

Create:

## types/authentication-result.interface.ts

```ts
import { Session } from "./session.interface.js";
import { User } from "./user.interface.js";

/**
 * Represents a successfully authenticated request.
 */
export interface AuthenticationResult {
  user: User;
  session: Session;
}
```

---

# Why Return Both?

Instead of:

```ts
const user = await authenticate(request);
```

we'll do:

```ts
const auth = await authenticate(request);

auth.user;

auth.session;
```

This becomes useful immediately for logout.

---

# Step 2 — Authentication Service

## services/authentication.service.ts

```ts
import { IncomingMessage } from "node:http";

import { SessionRepository } from "../repositories/session.repository.js";
import { UserRepository } from "../repositories/user.repository.js";

import { AuthenticationResult } from "../types/authentication-result.interface.js";

const sessionRepository = new SessionRepository();
const userRepository = new UserRepository();

/**
 * Authenticates an incoming request using the
 * x-session-token header.
 *
 * Returns the authenticated user together with the
 * matching session, or null if authentication fails.
 */
export async function authenticate(
  request: IncomingMessage,
): Promise<AuthenticationResult | null> {
  const token = request.headers["x-session-token"];

  if (!token || Array.isArray(token)) {
    return null;
  }

  const session = await sessionRepository.findByToken(token);

  if (!session) {
    return null;
  }

  const user = await userRepository.findById(session.userId);

  if (!user) {
    return null;
  }

  return {
    user,
    session,
  };
}
```

---

# Walk Through the Code

## Step 1

Read the header.

```ts
const token = request.headers["x-session-token"];
```

Example request:

```http
GET /me

x-session-token:
550e8400-e29b-41d4-a716-446655440000
```

Node stores headers as:

```ts
request.headers;
```

---

## Step 2

Validate.

```ts
if (!token || Array.isArray(token))
```

Why check `Array.isArray()`?

Node allows duplicate headers:

```http
x-session-token: abc
x-session-token: xyz
```

which becomes:

```ts
["abc", "xyz"];
```

Our API only accepts a single token.

---

## Step 3

Find the session.

```ts
const session = await sessionRepository.findByToken(token);
```

If not found:

```text
401 Unauthorized
```

---

## Step 4

Find the user.

```ts
const user = await userRepository.findById(session.userId);
```

Even though the session exists, the user may have been deleted.

Never trust persisted relationships blindly.

---

## Step 5

Return both.

```ts
return {
  user,
  session,
};
```

---

# Example

Suppose:

users.json

```json
[
  {
    "id": "u1",
    "name": "Alice",
    "email": "alice@example.com",
    "password": "...",
    "createdAt": "..."
  }
]
```

sessions.json

```json
[
  {
    "token": "abc123",
    "userId": "u1",
    "createdAt": "..."
  }
]
```

Request:

```http
GET /me

x-session-token: abc123
```

authenticate() returns:

```ts
{
  user: {
    id: "u1",
    name: "Alice",
    email: "alice@example.com",
    password: "...",
    createdAt: "...",
  },

  session: {
    token: "abc123",
    userId: "u1",
    createdAt: "...",
  },
}
```

---

# Mental Model

```text
HTTP Request
      │
      ▼
Read Header
      │
      ▼
Session Repository
      │
      ▼
Session
      │
      ▼
User Repository
      │
      ▼
User
      │
      ▼
Authentication Result
```

---

# Why Is This a Service?

Notice:

Repositories answer questions about storage.

Examples:

```ts
findById();

findByToken();

findAll();
```

Authentication is business logic.

It combines two repositories and applies application rules.

That's why it belongs in a service.

---

# Looking Ahead

Every protected controller now becomes simple.

Example:

```ts
const auth = await authenticate(request);

if (!auth) {
  sendError(response, 401, "Unauthorized");
  return;
}

// Protected logic here.
```

Instead of rewriting authentication logic in every route, we centralize it in one place.

---

## Next Step

We'll implement the first real controller, `POST /register`.

This step will tie together everything you've built so far:

- Manual body parsing with `getBody()`
- Manual routing
- `UserRepository`
- SHA-256 password hashing
- UUID generation
- ISO timestamp creation
- Writing to `users.json`
- Returning a sanitized user object without the password

It will be the first end-to-end feature in the application.

</details>

<br/><hr/><br/>

<details>
  <summary><b>Seventh phase</b></summary>

Excellent. This is the first complete feature of the application.

Up to this point, you've built the infrastructure:

- HTTP server
- Router
- Body parser
- JSON utilities
- Repositories
- Authentication service

Now we're finally implementing a real business use case.

This is also a good opportunity to introduce another architectural improvement.

Instead of putting all business logic inside controllers, we'll separate responsibilities further.

```text
HTTP Request
      │
      ▼
Controller
      │
      ▼
User Service
      │
      ▼
Repository
      │
      ▼
users.json
```

Why?

The controller should only:

- read the request
- call the service
- send the response

The service should:

- validate business rules
- hash passwords
- generate IDs
- create users

This is how most production applications are structured.

---

# Step 9 — Implement User Registration

## Project Structure

Create:

```text
src/
├── controllers/
│      user.controller.ts
│
├── services/
│      user.service.ts
```

---

# Step 1 — User Service

## services/user.service.ts

```ts
import crypto from "node:crypto";

import { UserRepository } from "../repositories/user.repository.js";

import { User } from "../types/user.interface.js";

const userRepository = new UserRepository();

/**
 * Handles business logic related to users.
 */
export class UserService {
  /**
   * Registers a new user.
   *
   * @throws Error if the email already exists.
   */
  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<Omit<User, "password">> {
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const user: User = {
      id: crypto.randomUUID(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    await userRepository.create(user);

    const { password: _, ...safeUser } = user;

    return safeUser;
  }
}
```

---

# Why Hash the Password?

Never store:

```text
password: "secret123"
```

Instead store:

```text
password:
5e884898da280471...
```

Even if someone steals `users.json`, they won't immediately know users' passwords.

Later in the reflection questions, you'll examine why SHA-256 is still insufficient for production.

---

# Step 2 — User Controller

## controllers/user.controller.ts

```ts
import { IncomingMessage, ServerResponse } from "node:http";

import { getBody } from "../helpers/get-body.js";
import { sendError } from "../utils/send-error.js";
import { sendJson } from "../utils/send-json.js";

import { UserService } from "../services/user.service.js";

const userService = new UserService();

/**
 * Handles user registration.
 */
export async function registerUser(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const body = await getBody(request);

    const { name, email, password } = body;

    if (!name || !email || !password) {
      sendError(response, 400, "name, email and password are required");

      return;
    }

    const user = await userService.register(name, email, password);

    sendJson(response, 201, user);
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      sendError(response, 409, "Email already exists");

      return;
    }

    if (error instanceof Error) {
      sendError(response, 400, error.message);

      return;
    }

    sendError(response, 500, "Internal Server Error");
  }
}
```

---

# Why Doesn't the Controller Hash Passwords?

Because password hashing is not related to HTTP.

Imagine tomorrow you build:

- REST API
- CLI application
- GraphQL API
- Background worker

All of them should reuse the same registration logic.

That's exactly what the service layer provides.

---

# Step 3 — Connect the Router

Replace the placeholder import.

```ts
import { registerUser } from "../controllers/user.controller.js";
```

Replace:

```ts
return notImplemented(request, response);
```

with:

```ts
return registerUser(request, response);
```

for:

```text
POST /register
```

---

# Test in Postman

## First Request

```http
POST /register
```

Body

```json
{
  "name": "Elysee",
  "email": "elysee@example.com",
  "password": "123456"
}
```

Expected

Status:

```text
201 Created
```

Response

```json
{
  "id": "...",
  "name": "Elysee",
  "email": "elysee@example.com",
  "createdAt": "2026-..."
}
```

Notice:

No password is returned.

---

## users.json

```json
[
  {
    "id": "...",
    "name": "Elysee",
    "email": "elysee@example.com",
    "password": "8d969eef6ecad3c29...",
    "createdAt": "2026-..."
  }
]
```

---

## Duplicate Registration

Send exactly the same request.

Expected

```text
409 Conflict
```

```json
{
  "error": "Email already exists"
}
```

---

# Request Flow

```text
POST /register
        │
        ▼
Router
        │
        ▼
registerUser()
        │
        ▼
getBody()
        │
        ▼
UserService.register()
        │
        ▼
UserRepository.findByEmail()
        │
        ▼
Hash Password
        │
        ▼
Generate UUID
        │
        ▼
Write users.json
        │
        ▼
Return Safe User
```

---

# Mental Model

Notice the separation of concerns:

**Controller**

- Parse HTTP request
- Validate required fields
- Send HTTP response

**Service**

- Check duplicate email
- Hash password
- Generate UUID
- Create user
- Remove password before returning

**Repository**

- Read JSON
- Write JSON

Each layer has exactly one responsibility.

---

# Looking Ahead

Registration is complete, but users still can't authenticate.

The next feature is `POST /login`, where you'll:

- Read credentials from the request body.
- Hash the provided password.
- Compare it with the stored hash.
- Generate a session token.
- Save the session in `sessions.json`.
- Return the token to the client.

That token will then unlock every protected route in the rest of the exercise.

</details>

<br/><hr/><br/>

<details>
  <summary><b>Eighth phase</b></summary>

Excellent. This is the second major feature of the application.

After this step, you'll have a complete authentication flow:

```text
Register
    │
    ▼
users.json

        │
        ▼
Login
        │
        ▼
Verify credentials
        │
        ▼
Create session
        │
        ▼
sessions.json
        │
        ▼
Return token
        │
        ▼
Authenticated requests
```

This is essentially how session-based authentication works in many production systems, although production systems typically store sessions in databases or caches like Redis instead of JSON files.

---

# Step 10 — Implement Login

## Goal

Implement:

```http
POST /login
```

Request:

```json
{
  "email": "elysee@example.com",
  "password": "123456"
}
```

Response:

```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

The token will be sent with every protected request.

---

# What Happens During Login?

```text
Receive email/password
          │
          ▼
Find user by email
          │
          ▼
Hash supplied password
          │
          ▼
Compare hashes
          │
          ▼
Generate session token
          │
          ▼
Save session
          │
          ▼
Return token
```

---

# Step 1 — Extend the User Service

## services/user.service.ts

Add the following imports:

```ts
import { SessionRepository } from "../repositories/session.repository.js";
import { Session } from "../types/session.interface.js";
```

Create a repository instance:

```ts
const sessionRepository = new SessionRepository();
```

---

Add this method inside `UserService`.

```ts
/**
 * Authenticates a user and creates
 * a new session.
 *
 * @throws Error when credentials
 * are invalid.
 */
async login(
  email: string,
  password: string,
): Promise<{ token: string }> {
  const user =
    await userRepository.findByEmail(email);

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const hashedPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  if (hashedPassword !== user.password) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const session: Session = {
    token: crypto.randomUUID(),
    userId: user.id,
    createdAt: new Date().toISOString(),
  };

  await sessionRepository.create(session);

  return {
    token: session.token,
  };
}
```

---

# Why Hash Again?

Notice we never compare:

```text
123456
```

against:

```text
8d969eef...
```

Instead we do:

```text
Incoming Password
        │
        ▼
SHA-256
        │
        ▼
8d969eef...
        │
        ▼
Compare hashes
```

The original password is never stored.

---

# Step 2 — Create Login Controller

## controllers/auth.controller.ts

```ts
import { IncomingMessage, ServerResponse } from "node:http";

import { getBody } from "../helpers/get-body.js";
import { sendError } from "../utils/send-error.js";
import { sendJson } from "../utils/send-json.js";

import { UserService } from "../services/user.service.js";

const userService = new UserService();

/**
 * Handles user login.
 */
export async function loginUser(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const body = await getBody(request);

    const { email, password } = body;

    if (!email || !password) {
      sendError(response, 400, "email and password are required");

      return;
    }

    const token = await userService.login(email, password);

    sendJson(response, 200, token);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      sendError(response, 401, "Invalid email or password");

      return;
    }

    if (error instanceof Error) {
      sendError(response, 400, error.message);

      return;
    }

    sendError(response, 500, "Internal Server Error");
  }
}
```

---

# Why Create auth.controller.ts?

Notice the application is growing.

Instead of putting everything in `user.controller.ts`, we separate concerns.

```text
controllers/

user.controller.ts

auth.controller.ts
```

Authentication endpoints belong together.

Later we'll add:

- logout

to the same controller.

---

# Step 3 — Connect the Router

In `router/router.ts`

Import:

```ts
import { loginUser } from "../controllers/auth.controller.js";
```

Replace:

```ts
case "POST:/login":
    return notImplemented(request, response);
```

with

```ts
case "POST:/login":
    return loginUser(request, response);
```

---

# Test

## Successful Login

```http
POST /login
```

Body

```json
{
  "email": "elysee@example.com",
  "password": "123456"
}
```

Expected

```http
200 OK
```

```json
{
  "token": "4d7b2bfa-7e66-42e3-a7ec-2ddcd64cb38d"
}
```

---

## sessions.json

```json
[
  {
    "token": "4d7b2bfa-7e66-42e3-a7ec-2ddcd64cb38d",
    "userId": "1db48...",
    "createdAt": "2026-..."
  }
]
```

---

## Wrong Password

```json
{
  "email": "elysee@example.com",
  "password": "wrong"
}
```

Response

```http
401 Unauthorized
```

```json
{
  "error": "Invalid email or password"
}
```

---

## Unknown Email

```json
{
  "email": "missing@example.com",
  "password": "123456"
}
```

Response

```http
401 Unauthorized
```

Using the same response for both cases prevents attackers from discovering which email addresses are registered.

---

# Authentication Flow

```text
POST /login
        │
        ▼
Controller
        │
        ▼
UserService.login()
        │
        ▼
UserRepository.findByEmail()
        │
        ▼
Hash password
        │
        ▼
Compare hashes
        │
        ▼
SessionRepository.create()
        │
        ▼
sessions.json
        │
        ▼
Return token
```

---

# Mental Model

Notice the repositories working together.

```text
           UserRepository
                  ▲
                  │
                  │
UserService.login()
                  │
                  ▼
         SessionRepository
```

The service coordinates multiple repositories.

Repositories never call each other.

Controllers never call repositories directly.

This separation is one of the most common patterns in backend development.

---

# Looking Ahead

You now have:

- ✅ Register
- ✅ Login

The next logical feature is **Logout**.

That endpoint will introduce your first protected route. It will use the `authenticate()` helper you built earlier to verify the session, remove it from `sessions.json`, and demonstrate how a session token becomes invalid immediately after logout.

</details>

<br/><hr/><br/>

<details>
  <summary><b>Nineth phase</b></summary>

Excellent. From this point onward, you're moving from "public" endpoints into "protected" endpoints.

This is an important milestone because every protected endpoint from now on will reuse the authentication service you built earlier.

This is exactly why we separated authentication into its own service.

Instead of rewriting authentication logic repeatedly, every controller simply asks:

```ts
const auth = await authenticate(request);
```

and proceeds only if authentication succeeds.

---

# Step 11 — Implement Logout

## Goal

Implement:

```http
POST /logout
```

Requirements:

- Protected route.
- Read the `x-session-token` header.
- Authenticate the request.
- Remove the session from `sessions.json`.
- Return:

```json
{
  "message": "logged out"
}
```

After logout, using the same token must return `401 Unauthorized`.

---

# Request Flow

```text
Incoming Request
       │
       ▼
authenticate()
       │
       ▼
Valid Session?
       │
 ┌─────┴──────┐
 │            │
No           Yes
 │            │
 ▼            ▼
401      Delete Session
              │
              ▼
      Return Success
```

---

# Step 1 — Extend Authentication Controller

Open:

```text
controllers/auth.controller.ts
```

Add these imports:

```ts
import { authenticate } from "../services/authentication.service.js";
import { SessionRepository } from "../repositories/session.repository.js";
```

Create the repository instance:

```ts
const sessionRepository = new SessionRepository();
```

---

# Step 2 — Implement `logoutUser`

Add the following function.

```ts
/**
 * Logs out the authenticated user by
 * deleting the current session.
 */
export async function logoutUser(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const auth = await authenticate(request);

  if (!auth) {
    sendError(response, 401, "Unauthorized");

    return;
  }

  await sessionRepository.deleteByToken(auth.session.token);

  sendJson(response, 200, {
    message: "logged out",
  });
}
```

Notice how small this controller is.

Almost all of the work has already been done by previous layers.

---

# Why Don't We Read the Header Again?

Some beginners write this:

```ts
const token = request.headers["x-session-token"];
```

again inside the controller.

That duplicates work.

`authenticate()` has already:

- read the header
- validated it
- found the session

Since it returns both:

```ts
auth.user;

auth.session;
```

we reuse the existing data.

---

# Step 3 — Connect the Router

Replace:

```ts
case "POST:/logout":
    return notImplemented(request, response);
```

with

```ts
case "POST:/logout":
    return logoutUser(request, response);
```

Import:

```ts
import { loginUser, logoutUser } from "../controllers/auth.controller.js";
```

---

# Test Sequence

## 1. Register

```http
POST /register
```

Response:

```http
201 Created
```

---

## 2. Login

```http
POST /login
```

Response:

```json
{
  "token": "abc123"
}
```

Save the token.

---

## 3. Logout

```http
POST /logout
```

Headers

```http
x-session-token: abc123
```

Expected

```http
200 OK
```

```json
{
  "message": "logged out"
}
```

---

## sessions.json

Before:

```json
[
  {
    "token": "abc123",
    "userId": "123",
    "createdAt": "..."
  }
]
```

After:

```json
[]
```

---

## Logout Again

Send exactly the same request.

```http
POST /logout
```

Headers

```http
x-session-token: abc123
```

Expected

```http
401 Unauthorized
```

because the session no longer exists.

---

# Why Does Logout Work?

Nothing magical happens.

Logging out simply deletes the server-side session.

Before:

```text
Token
   │
   ▼
Session exists
   │
   ▼
Authenticated
```

After deletion:

```text
Token
   │
   ▼
Session lookup
   │
   ▼
Not found
   │
   ▼
401 Unauthorized
```

The client still has the token, but it has become meaningless because the server no longer recognizes it.

This illustrates an important concept:

> Authentication is determined by the server's session store, not by the existence of the token on the client.

---

# Mental Model

```text
POST /logout
        │
        ▼
authenticate()
        │
        ▼
AuthenticationResult
        │
        ▼
deleteByToken()
        │
        ▼
sessions.json
        │
        ▼
Return Success
```

Notice how each layer has a clear responsibility.

```
Controller
```

Coordinates the request.

```
Authentication Service
```

Verifies identity.

```
Session Repository
```

Removes persisted session data.

---

# Code Reuse

The authentication service is now reusable by every protected endpoint.

Soon you'll write:

```ts
const auth =
    await authenticate(request);

if (!auth) {
    ...
}
```

for:

- `/users`
- `/users/:id`
- `/me`
- `/users/:id (PUT)`
- `/users/:id (DELETE)`

without duplicating authentication logic.

This is one of the biggest advantages of separating business logic into services.

---

# Looking Ahead

The next endpoint is `GET /users`.

This introduces:

- protected routes
- sanitizing user data
- filtering by query parameters
- manual parsing of query strings with the `url` module
- returning collections safely without exposing passwords

It also demonstrates why repositories should expose reusable querying methods rather than forcing controllers to manipulate raw data.

</details>

<br/><hr/><br/>

<details>
  <summary><b>Tenth phase</b></summary>

Excellent. This step introduces something every backend API does constantly:

- Authentication
- Query parameters
- Filtering
- Data sanitization

Although the endpoint looks simple, it teaches several concepts that appear in almost every REST API.

We'll keep the same architecture:

```text
HTTP Request
      │
      ▼
Router
      │
      ▼
Controller
      │
      ▼
User Service
      │
      ▼
User Repository
      │
      ▼
users.json
```

Notice the controller still doesn't know how users are stored.

---

# Step 12 — Implement GET /users

## Goal

Implement:

```http
GET /users
```

Requirements:

- Protected endpoint.
- Return every user.
- Never return passwords.
- Support:

```http
GET /users?name=john
```

using a case-insensitive filter.

---

# Request Flow

```text
Incoming Request
        │
        ▼
authenticate()
        │
        ▼
Parse Query String
        │
        ▼
UserService.getAllUsers()
        │
        ▼
UserRepository.findAll()
        │
        ▼
Remove Passwords
        │
        ▼
Return Users
```

---

# Step 1 — Extend User Service

Open:

```text
services/user.service.ts
```

Add this method.

```ts
/**
 * Returns every registered user without
 * exposing password hashes.
 *
 * If a name filter is provided,
 * performs a case-insensitive match.
 */
async getAll(
  name?: string,
): Promise<Omit<User, "password">[]> {
  const users =
    await userRepository.findAll();

  const filteredUsers =
    name === undefined
      ? users
      : users.filter((user) =>
          user.name
            .toLowerCase()
            .includes(
              name.toLowerCase(),
            ),
        );

  return filteredUsers.map(
    ({ password: _, ...safeUser }) =>
      safeUser,
  );
}
```

---

# Why Filter in the Service?

Some developers would filter inside the controller.

Don't.

Controllers shouldn't contain business logic.

This belongs here because:

- filtering users
- hiding passwords

are business rules, not HTTP concerns.

---

# Step 2 — Add Controller

Open:

```text
controllers/user.controller.ts
```

Import:

```ts
import { authenticate } from "../services/authentication.service.js";
import { parse } from "node:url";
```

---

Add the controller.

```ts
/**
 * Returns every registered user.
 *
 * Supports filtering by name using:
 *
 * GET /users?name=john
 */
export async function getAllUsers(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const auth = await authenticate(request);

  if (!auth) {
    sendError(response, 401, "Unauthorized");

    return;
  }

  const { query } = parse(request.url ?? "", true);

  const filter = typeof query.name === "string" ? query.name : undefined;

  const users = await userService.getAll(filter);

  sendJson(response, 200, users);
}
```

---

# Why Parse the URL Again?

The router only cared about:

```text
/users
```

The controller needs:

```text
/users?name=john
```

because query parameters belong to the endpoint logic, not the routing logic.

---

# Step 3 — Connect the Router

Replace

```ts
case "GET:/users":
    return notImplemented(request, response);
```

with

```ts
case "GET:/users":
    return getAllUsers(
        request,
        response,
    );
```

Import:

```ts
import { registerUser, getAllUsers } from "../controllers/user.controller.js";
```

---

# Test 1

Login.

Copy your token.

---

Request

```http
GET /users
```

Headers

```http
x-session-token:
<token>
```

Expected

```json
[
  {
    "id": "...",
    "name": "Alice",
    "email": "alice@example.com",
    "createdAt": "..."
  },
  {
    "id": "...",
    "name": "John",
    "email": "john@example.com",
    "createdAt": "..."
  }
]
```

Notice:

No password field.

---

# Test 2

```http
GET /users?name=ali
```

Expected

```json
[
  {
    "id": "...",
    "name": "Alice",
    "email": "alice@example.com",
    "createdAt": "..."
  }
]
```

---

# Test 3

Case-insensitive.

```http
GET /users?name=ALI
```

Should produce the same result.

---

# Test 4

Without a token.

```http
GET /users
```

Expected

```http
401 Unauthorized
```

---

# Why Remove Passwords in the Service?

Imagine tomorrow you build:

- REST API
- GraphQL API
- CLI
- Background worker

All of them should automatically receive safe users.

If sanitization happened only in the controller, another consumer might accidentally expose password hashes.

Keeping this rule in the service makes it consistent everywhere.

---

# Request Flow

```text
GET /users
       │
       ▼
authenticate()
       │
       ▼
Parse query string
       │
       ▼
UserService.getAll()
       │
       ▼
UserRepository.findAll()
       │
       ▼
Filter users
       │
       ▼
Remove passwords
       │
       ▼
Response
```

---

# Mental Model

Notice how each layer has a single responsibility.

```text
Controller
```

- Authenticate request.
- Read query parameters.
- Send HTTP response.

```text
Service
```

- Filter users.
- Remove passwords.

```text
Repository
```

- Read `users.json`.

This separation keeps every layer small and easy to test.

---

# Small Refactoring (Recommended)

You're now sanitizing users in more than one service method (`register()` and `getAll()`). This is a good time to extract a reusable helper.

Create `src/utils/user-mapper.ts`:

```ts
import { User } from "../types/user.interface.js";

/**
 * Removes sensitive fields before a user
 * is returned to API clients.
 */
export function toSafeUser(user: User): Omit<User, "password"> {
  const { password: _, ...safeUser } = user;

  return safeUser;
}
```

Then update your service:

```ts
return toSafeUser(user);
```

and

```ts
return filteredUsers.map(toSafeUser);
```

This follows the DRY (Don't Repeat Yourself) principle and prepares for future endpoints like `/users/:id` and `/me`.

---

## Next Step

We'll implement `GET /users/:id`. This will introduce manual route parameter handling end-to-end, reuse the `toSafeUser()` mapper, return `404` for missing users, and further reinforce the separation between routing, business logic, and persistence before moving on to update and delete operations.

</details>

<br/><hr/><br/>

<details>
  <summary><b>Eleventh phase</b></summary>

Excellent. This endpoint completes the "read" portion of the CRUD operations.

Although it looks similar to `GET /users`, it introduces another important concept used by every web framework:

- Route parameters (`:id`)
- Looking up a single resource
- Returning `404 Not Found`
- Reusing the same service layer

This is exactly what Express does internally when you write:

```ts
app.get("/users/:id", ...)
```

Our router already extracts the `id`. Now we'll use it.

---

# Step 13 — Implement GET /users/:id

## Goal

Implement:

```http
GET /users/:id
```

Requirements:

- Protected endpoint.
- Return one user.
- Never return the password.
- Return `404` if the user doesn't exist.

---

# Request Flow

```text
Incoming Request
        │
        ▼
authenticate()
        │
        ▼
Router extracts :id
        │
        ▼
UserService.getById()
        │
        ▼
UserRepository.findById()
        │
        ▼
Remove password
        │
        ▼
Return user
```

---

# Step 1 — Extend User Service

Open:

```text
services/user.service.ts
```

Import the mapper if you extracted it in the previous step.

```ts
import { toSafeUser } from "../utils/user-mapper.js";
```

Add the following method.

```ts
/**
 * Returns a single user by ID.
 *
 * @throws Error if the user does not exist.
 */
async getById(
  id: string,
): Promise<Omit<User, "password">> {
  const user =
    await userRepository.findById(id);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return toSafeUser(user);
}
```

Notice something important.

The repository returns:

```ts
User | undefined;
```

The service decides whether that becomes:

```text
404 Not Found
```

Repositories don't know anything about HTTP.

---

# Step 2 — Update the Router

Earlier we built:

```ts
const route = matchRoute(pathname);
```

Let's improve it slightly so controllers receive route parameters without recomputing them.

Update the interface.

```ts
export interface RouteMatch {
  pathname: string;
  params: {
    id?: string;
  };
}
```

Update `matchRoute()`.

```ts
function matchRoute(pathname: string): RouteMatch {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 2 && segments[0] === "users") {
    return {
      pathname: "/users/:id",
      params: {
        id: segments[1],
      },
    };
  }

  return {
    pathname,
    params: {},
  };
}
```

This avoids parsing the URL again later.

---

# Step 3 — Pass Route Parameters

Update the router function.

Instead of:

```ts
return getUserById(request, response);
```

pass the ID.

```ts
return getUserById(request, response, route.params.id!);
```

Notice the router is responsible for extracting parameters.

Controllers shouldn't parse URLs.

---

# Step 4 — Implement Controller

Open:

```text
controllers/user.controller.ts
```

Add:

```ts
/**
 * Returns a single user.
 */
export async function getUserById(
  request: IncomingMessage,
  response: ServerResponse,
  id: string,
): Promise<void> {
  const auth = await authenticate(request);

  if (!auth) {
    sendError(response, 401, "Unauthorized");

    return;
  }

  try {
    const user = await userService.getById(id);

    sendJson(response, 200, user);
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      sendError(response, 404, "User not found");

      return;
    }

    sendError(response, 500, "Internal Server Error");
  }
}
```

---

# Step 5 — Connect the Router

Replace:

```ts
case "GET:/users/:id":
    return notImplemented(request, response);
```

with:

```ts
case "GET:/users/:id":
    return getUserById(
        request,
        response,
        route.params.id!,
    );
```

---

# Test 1

Login.

Copy the token.

Request

```http
GET /users/<existing-id>
```

Headers

```http
x-session-token: <token>
```

Expected

```http
200 OK
```

```json
{
  "id": "...",
  "name": "Alice",
  "email": "alice@example.com",
  "createdAt": "..."
}
```

---

# Test 2

Unknown ID.

```http
GET /users/not-found
```

Expected

```http
404 Not Found
```

```json
{
  "error": "User not found"
}
```

---

# Test 3

Without authentication.

```http
GET /users/<id>
```

No token.

Expected

```http
401 Unauthorized
```

---

# Request Flow

```text
GET /users/123
        │
        ▼
Router
        │
        ▼
Extract :id
        │
        ▼
authenticate()
        │
        ▼
UserService.getById()
        │
        ▼
UserRepository.findById()
        │
        ▼
Remove password
        │
        ▼
Response
```

---

# Why Doesn't the Controller Call `findById()`?

Because controllers shouldn't know where data comes from.

Tomorrow you might replace:

```text
users.json
```

with:

```text
PostgreSQL
```

The controller shouldn't change.

Only the repository changes.

That's one of the biggest benefits of the Repository pattern.

---

# Small Refactoring (Recommended)

At this point, you probably notice this repeated in every protected controller:

```ts
const auth = await authenticate(request);

if (!auth) {
  sendError(response, 401, "Unauthorized");

  return;
}
```

We're repeating ourselves.

A clean refactoring is to create a helper:

```ts
export async function requireAuth(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<AuthenticationResult | null> {
  const auth = await authenticate(request);

  if (!auth) {
    sendError(response, 401, "Unauthorized");
    return null;
  }

  return auth;
}
```

Controllers become:

```ts
const auth = await requireAuth(request, response);

if (!auth) {
  return;
}
```

This removes duplicated authentication boilerplate and makes protected controllers easier to read.

---

## Next Step

We'll implement `PUT /users/:id`, which is the most interesting endpoint so far. It introduces authorization in addition to authentication. You'll learn the difference between "Who are you?" (authentication) and "Are you allowed to do this?" (authorization), enforce ownership checks with `403 Forbidden`, update only the user's `name`, and persist the changes back to `users.json` while keeping the service and repository layers clean.

</details>

<br/><hr/><br/>

<details>
  <summary><b>Twelveth phase</b></summary>

Excellent. This is one of the most important exercises in the entire project.

Until now you've only answered one question:

> Who is making this request?

That is authentication.

Now we'll answer a second question:

> Is this authenticated user allowed to perform this action?

That is authorization.

Many junior developers confuse these concepts. Production applications rely on both.

---

# Step 14 — Implement PUT /users/:id

## Goal

Implement:

```http
PUT /users/:id
```

Requirements:

- Protected endpoint.
- Only the authenticated user can update their own record.
- Only the `name` field is editable.
- Return:
  - `401` if not authenticated.
  - `403` if authenticated but trying to update another user.
  - `404` if the user doesn't exist.

- Persist changes to `users.json`.

---

# Authentication vs Authorization

This endpoint introduces a new decision.

```text
Incoming Request
        │
        ▼
Authenticate
        │
        ▼
Who is this?
        │
        ▼
User #15
        │
        ▼
Can User #15 update User #18?
        │
   ┌────┴────┐
   │         │
  No        Yes
   │         │
403       Continue
```

Notice:

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
What are you allowed to do?
```

---

# Step 1 — Extend User Repository

Open

```text
repositories/user.repository.ts
```

Add a reusable update method.

```ts
/**
 * Updates an existing user.
 */
async update(
  updatedUser: User,
): Promise<void> {
  const users =
    await this.findAll();

  const updatedUsers =
    users.map((user) =>
      user.id === updatedUser.id
        ? updatedUser
        : user,
    );

  await this.saveAll(updatedUsers);
}
```

Notice the repository doesn't know:

- HTTP
- Authentication
- Authorization

It only knows how to persist users.

---

# Step 2 — Extend User Service

Open

```text
services/user.service.ts
```

Add:

```ts
/**
 * Updates the user's name.
 *
 * @throws Error if user does not exist.
 */
async updateName(
  id: string,
  name: string,
): Promise<Omit<User, "password">> {
  const user =
    await userRepository.findById(id);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const updatedUser: User = {
    ...user,
    name,
  };

  await userRepository.update(updatedUser);

  return toSafeUser(updatedUser);
}
```

Notice something important.

The service never checks:

```ts
auth.user.id;
```

Authorization belongs to the controller because it depends on the authenticated HTTP request.

The service only performs business logic.

---

# Step 3 — Implement Controller

Open

```text
controllers/user.controller.ts
```

Add:

```ts
/**
 * Updates the authenticated user's name.
 */
export async function updateUser(
  request: IncomingMessage,
  response: ServerResponse,
  id: string,
): Promise<void> {
  const auth = await requireAuth(request, response);

  if (!auth) {
    return;
  }

  if (auth.user.id !== id) {
    sendError(response, 403, "Forbidden");

    return;
  }

  try {
    const body = await getBody(request);

    const { name } = body;

    if (typeof name !== "string" || name.trim() === "") {
      sendError(response, 400, "name is required");

      return;
    }

    const user = await userService.updateName(id, name.trim());

    sendJson(response, 200, user);
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      sendError(response, 404, "User not found");

      return;
    }

    if (error instanceof Error) {
      sendError(response, 400, error.message);

      return;
    }

    sendError(response, 500, "Internal Server Error");
  }
}
```

---

# Why Only Update Name?

The exercise explicitly says:

> Allow updating name only.

Imagine allowing this:

```json
{
  "password": "...",
  "createdAt": "...",
  "id": "..."
}
```

A client could overwrite fields that should never change.

Instead we explicitly allow only:

```json
{
  "name": "New Name"
}
```

This is called a whitelist update.

Production APIs almost always use this approach.

---

# Step 4 — Connect the Router

Replace

```ts
case "PUT:/users/:id":
    return notImplemented(request, response);
```

with

```ts
case "PUT:/users/:id":
    return updateUser(
        request,
        response,
        route.params.id!,
    );
```

Update imports.

```ts
import {
  registerUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "../controllers/user.controller.js";
```

---

# Test 1

Login as Alice.

Suppose Alice has:

```text
id = 123
```

Request

```http
PUT /users/123
```

Headers

```http
x-session-token: <alice-token>
```

Body

```json
{
  "name": "Alice Cooper"
}
```

Expected

```http
200 OK
```

```json
{
  "id": "...",
  "name": "Alice Cooper",
  "email": "...",
  "createdAt": "..."
}
```

---

# Test 2

Login as Alice.

Try updating Bob.

```http
PUT /users/bob-id
```

Expected

```http
403 Forbidden
```

This demonstrates authorization.

Alice is authenticated.

She simply isn't allowed to edit Bob.

---

# Test 3

Unknown user.

```http
PUT /users/unknown
```

Expected

```http
404 Not Found
```

---

# Request Flow

```text
PUT /users/:id
        │
        ▼
requireAuth()
        │
        ▼
Authenticated?
        │
        ▼
Ownership Check
        │
   ┌────┴─────┐
   │          │
403         Continue
              │
              ▼
Read Body
              │
              ▼
Update Name
              │
              ▼
Persist users.json
              │
              ▼
Return Updated User
```

---

# Mental Model

Notice how responsibilities are divided.

```text
Router
```

Extracts:

```text
:id
```

Controller

- Authenticates.
- Authorizes.
- Reads request body.
- Sends response.

Service

- Updates business object.

Repository

- Writes to disk.

Each layer has exactly one responsibility.

---

# Authentication vs Authorization Recap

Authentication

```text
Who are you?
```

Authorization

```text
Can you perform this action?
```

Examples:

```text
Login
```

Authentication.

```text
Update another user's profile
```

Authorization.

You always authenticate before authorizing.

---

# Looking Ahead

The final CRUD endpoint is `DELETE /users/:id`.

Unlike update, deleting a user has an extra responsibility:

- Remove the user.
- Remove every active session belonging to that user.

This introduces coordination between two repositories (`UserRepository` and `SessionRepository`) inside the service layer, a common pattern in real backend applications.

</details>

<br/><hr/><br/>

<details>
  <summary><b>Thirteenth phase</b></summary>

Excellent. This is the final CRUD endpoint and the first operation that affects multiple data stores.

Up to now, every service has interacted with a single repository. Deleting a user is different because removing the user alone would leave orphaned sessions behind.

This is a good example of why the service layer exists. It coordinates business operations across multiple repositories while keeping each repository focused on its own persistence logic.

---

# Step 15 — Implement DELETE /users/:id

## Goal

Implement:

```http
DELETE /users/:id
```

Requirements:

- Protected endpoint.
- A user can only delete their own account.
- Delete the user from `users.json`.
- Delete every session belonging to that user from `sessions.json`.
- Return a success message.
- Return:
  - `401` if unauthenticated.
  - `403` if trying to delete another user.
  - `404` if the user doesn't exist.

---

# Request Flow

```text
Incoming Request
        │
        ▼
requireAuth()
        │
        ▼
Ownership Check
        │
        ▼
UserService.deleteUser()
        │
        ├───────────────┐
        ▼               ▼
UserRepository    SessionRepository
delete()          deleteByUserId()
        │               │
        └───────┬───────┘
                ▼
        Return Success
```

Notice that the service coordinates two repositories.

---

# Step 1 — Extend Session Repository

Open:

```text
repositories/session.repository.ts
```

Add a method to remove every session for a user.

```ts
/**
 * Deletes all sessions belonging
 * to the specified user.
 */
async deleteByUserId(
  userId: string,
): Promise<void> {
  const sessions = await this.findAll();

  const remainingSessions = sessions.filter(
    (session) => session.userId !== userId,
  );

  await this.saveAll(remainingSessions);
}
```

This ensures all active sessions are invalidated after account deletion.

---

# Step 2 — Extend User Repository

Open:

```text
repositories/user.repository.ts
```

Add:

```ts
/**
 * Deletes a user by ID.
 */
async delete(
  id: string,
): Promise<void> {
  const users = await this.findAll();

  const remainingUsers = users.filter(
    (user) => user.id !== id,
  );

  await this.saveAll(remainingUsers);
}
```

Again, the repository simply persists data. It doesn't know why the deletion is happening.

---

# Step 3 — Extend User Service

Open:

```text
services/user.service.ts
```

Make sure you already have:

```ts
const sessionRepository = new SessionRepository();
```

Now add:

```ts
/**
 * Deletes a user and all of
 * their active sessions.
 *
 * @throws Error if the user
 * does not exist.
 */
async deleteUser(
  id: string,
): Promise<void> {
  const user = await userRepository.findById(id);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  await userRepository.delete(id);

  await sessionRepository.deleteByUserId(id);
}
```

Notice the order:

```text
Find User
     │
     ▼
Delete User
     │
     ▼
Delete Sessions
```

If the user doesn't exist, nothing is deleted.

---

# Step 4 — Implement Controller

Open:

```text
controllers/user.controller.ts
```

Add:

```ts
/**
 * Deletes the authenticated user's account.
 */
export async function deleteUser(
  request: IncomingMessage,
  response: ServerResponse,
  id: string,
): Promise<void> {
  const auth = await requireAuth(request, response);

  if (!auth) {
    return;
  }

  if (auth.user.id !== id) {
    sendError(response, 403, "Forbidden");

    return;
  }

  try {
    await userService.deleteUser(id);

    sendJson(response, 200, {
      message: "User deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      sendError(response, 404, "User not found");

      return;
    }

    sendError(response, 500, "Internal Server Error");
  }
}
```

Notice how little business logic exists in the controller.

---

# Step 5 — Connect the Router

Replace:

```ts
case "DELETE:/users/:id":
    return notImplemented(request, response);
```

with:

```ts
case "DELETE:/users/:id":
    return deleteUser(
        request,
        response,
        route.params.id!,
    );
```

Update imports if needed.

```ts
import {
  registerUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
```

---

# Test 1

Login as Alice.

Suppose Alice's ID is:

```text
123
```

Request:

```http
DELETE /users/123
```

Headers:

```http
x-session-token: <alice-token>
```

Expected:

```http
200 OK
```

```json
{
  "message": "User deleted successfully"
}
```

---

# Verify Storage

`users.json`

Before:

```json
[
  {
    "id": "123",
    "name": "Alice"
  }
]
```

After:

```json
[]
```

---

`sessions.json`

Before:

```json
[
  {
    "token": "abc123",
    "userId": "123"
  }
]
```

After:

```json
[]
```

Every session belonging to Alice has been removed.

---

# Test 2

Reuse the same token.

```http
GET /me
```

Expected:

```http
401 Unauthorized
```

The session no longer exists.

---

# Test 3

Try deleting another user.

```http
DELETE /users/bob-id
```

Expected:

```http
403 Forbidden
```

Authentication succeeded.

Authorization failed.

---

# Request Lifecycle

```text
DELETE /users/:id
          │
          ▼
requireAuth()
          │
          ▼
Ownership Check
          │
          ▼
UserService.deleteUser()
          │
      ┌───┴────────────┐
      ▼                ▼
Delete User      Delete Sessions
      │                │
      └──────┬─────────┘
             ▼
      Success Response
```

---

# Why Does the Service Coordinate Both Repositories?

Imagine putting this logic inside the controller.

The controller would have to know:

- how users are stored
- how sessions are stored
- which order to delete them

That mixes HTTP handling with business rules.

Instead:

```text
Controller
```

Coordinates the HTTP request.

```text
Service
```

Coordinates business operations.

```text
Repositories
```

Coordinate persistence.

This separation becomes even more valuable as applications grow.

---

# Looking Ahead

Only two endpoints remain:

- `GET /me`
- Stress test and race condition analysis

`GET /me` is intentionally tiny. It demonstrates the value of the authentication service you've already built. The controller will be only a few lines because all the heavy lifting has already been done.

</details>

<br/><hr/><br/>

<details>
  <summary><b>Fourteenth phase</b></summary>

Excellent. This endpoint is intentionally small.

The exercise even hints at it:

> `GET /me` ... Three lines maximum.

The purpose is to demonstrate good architecture. If your authentication logic is well designed, this endpoint becomes almost trivial.

This is a common pattern in production APIs. The framework and middleware perform authentication before the controller runs, leaving the controller with very little work.

---

# Step 16 — Implement GET /me

## Goal

Implement:

```http
GET /me
```

Requirements:

- Protected endpoint.
- Authenticate the request.
- Return the authenticated user.
- Never return the password.
- Keep the controller extremely small.

---

# Request Flow

```text
Incoming Request
        │
        ▼
requireAuth()
        │
        ▼
Authenticated User
        │
        ▼
Return User
```

Notice something interesting.

Unlike previous endpoints:

- no repository call
- no service call
- no file read

Everything we need is already available.

---

# Why?

Recall what `authenticate()` returns.

```ts
interface AuthenticationResult {
  user: User;
  session: Session;
}
```

The user has already been loaded from `users.json`.

There is nothing else to do.

---

# Step 1 — Update Authentication Service

Currently your authentication service probably returns:

```ts
user;
```

Let's make it safer.

If it isn't already doing this, update it.

```ts
import { toSafeUser } from "../utils/user-mapper.js";
```

Return

```ts
return {
  user: toSafeUser(user),
  session,
};
```

instead of

```ts
return {
  user,
  session,
};
```

Now every authenticated endpoint automatically receives a sanitized user.

No controller has to remember to remove passwords.

This is a great example of pushing business rules down into reusable code.

---

# Step 2 — Implement Controller

Open

```text
controllers/user.controller.ts
```

Add

```ts
/**
 * Returns the currently
 * authenticated user.
 */
export async function getMe(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const auth = await requireAuth(request, response);

  if (!auth) {
    return;
  }

  sendJson(response, 200, auth.user);
}
```

That's it.

No repository.

No service.

No parsing.

Exactly as the exercise intended.

---

# Why Doesn't This Endpoint Call UserService?

Because doing so would read the file again.

Think about what has already happened.

```text
Incoming Request
        │
        ▼
authenticate()
        │
        ▼
Read users.json
        │
        ▼
Find User
```

Calling the service again would perform another unnecessary file read.

Instead we reuse the authenticated user.

---

# Step 3 — Connect the Router

Replace

```ts
case "GET:/me":
    return notImplemented(request, response);
```

with

```ts
case "GET:/me":
    return getMe(
        request,
        response,
    );
```

Update imports.

```ts
import {
  registerUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getMe,
} from "../controllers/user.controller.js";
```

---

# Test 1

Login.

Receive

```json
{
  "token": "abc123"
}
```

---

Request

```http
GET /me
```

Headers

```http
x-session-token: abc123
```

Expected

```json
{
  "id": "...",
  "name": "Alice",
  "email": "alice@example.com",
  "createdAt": "..."
}
```

Notice:

No password field.

---

# Test 2

Without token.

```http
GET /me
```

Expected

```http
401 Unauthorized
```

---

# Test 3

Logout.

Then immediately call

```http
GET /me
```

using the same token.

Expected

```http
401 Unauthorized
```

Why?

Because:

```text
Token
     │
     ▼
authenticate()
     │
     ▼
sessions.json
     │
     ▼
Session missing
     │
     ▼
Unauthorized
```

The client still sends the token.

The server no longer recognizes it.

---

# Mental Model

Notice how much work was reused.

```text
GET /me
      │
      ▼
requireAuth()
      │
      ▼
authenticate()
      │
      ▼
SessionRepository
      │
      ▼
UserRepository
      │
      ▼
Return User
```

The controller performs almost no work.

That is a sign of good architecture.

---

# Architecture Review

Your application now looks like this.

```text
                Router
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
User Controllers      Auth Controller
        │                     │
        └──────────┬──────────┘
                   ▼
            User Service
                   │
      ┌────────────┴────────────┐
      ▼                         ▼
User Repository        Session Repository
      │                         │
      └────────────┬────────────┘
                   ▼
              JSON Files
```

Every layer has one responsibility.

This is the same architecture you'll find in many Express, NestJS, Spring Boot, and ASP.NET applications.

---

# Exercise 6 Status

You have now completed all functional requirements:

- ✅ Manual request body parsing
- ✅ Manual router
- ✅ User registration
- ✅ Password hashing
- ✅ Login
- ✅ Session management
- ✅ Authentication helper
- ✅ Logout
- ✅ Protected routes
- ✅ Authorization
- ✅ User CRUD
- ✅ `/me`

Only one major task remains:

## Step 17 — Stress Testing and Race Condition Analysis

This is arguably the most educational part of the exercise. You'll intentionally expose a race condition in your file-based database, analyze it at the event loop level, implement a write lock, rerun the stress test, and observe why the fix guarantees exactly one successful registration and nineteen duplicate responses.

</details>

<br/><hr/><br/>
