# Exercise 6 — Full User Management System in Pure Node.js

## Overview

This project implements a complete user management and authentication system using only Node.js core modules.

No Express.
No MongoDB.
No third-party libraries.

The goal of the exercise is to understand how modern backend frameworks work internally by building the core functionality manually from first principles.

The application supports:

- User registration
- Login
- Session management
- Authentication
- Authorization
- User CRUD operations
- Protected routes
- File-based persistence
- Manual request body parsing
- Manual routing
- Race condition detection and prevention

---

## Learning Objectives

This exercise explores:

- HTTP servers using the Node.js `http` module
- Parsing request bodies manually
- Routing requests without Express
- Working with JSON files as a persistence layer
- Password hashing with Node.js `crypto`
- Session-based authentication
- Authorization checks
- Event loop behavior during file operations
- Race conditions in concurrent requests
- Implementing a write lock

---

## Project Structure

```text
exercise-6/
│
├── data/
│   ├── users.json
│   └── sessions.json
│
├── src/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── routes/
│   ├── utils/
│   ├── types/
│   └── server.ts
│
├── flood.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## Architecture

```text
                    HTTP Server
                         │
                         ▼
                      Router
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
 User Controller                  Auth Controller
        │                                 │
        └────────────────┬────────────────┘
                         ▼
                   User Service
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
 User Repository                  Session Repository
        │                                 │
        └────────────────┬────────────────┘
                         ▼
                     JSON Files
```

---

## Features

### Register User

Endpoint:

```http
POST /register
```

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

Behavior:

- Validates email uniqueness
- Hashes password using SHA-256
- Generates UUID
- Persists user in users.json

Response:

```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "timestamp"
}
```

---

### Login

Endpoint:

```http
POST /login
```

Behavior:

- Verifies credentials
- Creates a session
- Stores token in sessions.json

Response:

```json
{
  "token": "session-token"
}
```

---

### Logout

Endpoint:

```http
POST /logout
```

Behavior:

- Removes active session
- Invalidates token

---

### Get Current User

Endpoint:

```http
GET /me
```

Protected route.

Returns currently authenticated user.

---

### Get All Users

Endpoint:

```http
GET /users
```

Supports:

```http
GET /users?name=john
```

Features:

- Passwords never returned
- Case-insensitive filtering

---

### Get User By ID

Endpoint:

```http
GET /users/:id
```

Returns a single user.

---

### Update User

Endpoint:

```http
PUT /users/:id
```

Rules:

- User can only update their own profile
- Only name field can be modified

---

### Delete User

Endpoint:

```http
DELETE /users/:id
```

Rules:

- User can only delete their own account
- All active sessions are removed

---

## Authentication

Authentication is implemented using session tokens.

Header:

```http
x-session-token: your-token
```

Authentication flow:

```text
Request
   │
   ▼
Read Token
   │
   ▼
Find Session
   │
   ▼
Find User
   │
   ▼
Authorized
```

---

## Password Hashing

Passwords are hashed using:

```js
crypto.createHash("sha256").update(password).digest("hex");
```

This is sufficient for learning purposes.

Production systems should use:

- bcrypt
- scrypt
- argon2

with salting and configurable work factors.

---

## Manual Request Body Parsing

The project implements a custom body parser using:

```js
req.on("data");
req.on("end");
```

Features:

- Chunk collection
- JSON parsing
- 2 KB size limit
- Malformed JSON detection

---

## Manual Router

No Express router is used.

Requests are matched manually using:

```js
req.method;
req.url;
```

Dynamic routes such as:

```http
/users/:id
```

are parsed manually.

---

## Race Condition Demonstration

The application intentionally demonstrates a common backend problem.

Scenario:

20 concurrent registration requests attempt to create the same user.

Without synchronization:

```text
Request A → email available
Request B → email available

Both create users
```

Result:

- Duplicate users
- Inconsistent state

---

## Write Lock Solution

A simple in-memory lock serializes registration writes.

```text
Request A
    │
    ▼
Acquire Lock
    │
    ▼
Read
Validate
Write
    │
    ▼
Release Lock

Request B waits
```

Result:

```text
201 Created   : 1
409 Duplicate : 19
```

Every run produces deterministic results.

---

## Stress Testing

Run the server:

```bash
npm run dev
```

In another terminal:

```bash
node flood.js
```

The script sends 20 concurrent registration requests to verify race condition behavior.

---

## Key Concepts Demonstrated

- Event Loop
- Non-blocking I/O
- File Persistence
- Session Authentication
- Authorization
- Request Parsing
- Routing
- Password Hashing
- Repository Pattern
- Service Layer
- Controller Layer
- Concurrency
- Race Conditions
- Write Locks

---

## Technologies Used

- Node.js
- TypeScript
- HTTP Module
- FS Promises
- Crypto Module
- URL Module

No external backend frameworks or databases were used.

---

## Final Reflection

This exercise demonstrates how many of the features commonly provided by Express, NestJS, Fastify, Spring Boot, and ASP.NET can be implemented manually using Node.js core modules.

Building these components from scratch provides a deeper understanding of request processing, authentication, persistence, concurrency, and the Node.js event loop.
