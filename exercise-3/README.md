# Exercise 3: File System Database API

## Overview

This project implements a RESTful User Management API using Express and TypeScript while using the local file system as the persistence layer.

Instead of relying on a traditional database such as MongoDB, PostgreSQL, or SQLite, user records are stored inside a JSON file on disk and managed through asynchronous file operations using `fs.promises`.

The project demonstrates how backend services can persist and retrieve data using the file system while maintaining a clean architecture through separation of concerns.

---

## Learning Objectives

This exercise focuses on:

- Building REST APIs with Express
- Using TypeScript in backend applications
- Working with `fs.promises`
- Reading and writing JSON files
- Implementing CRUD operations
- Applying Separation of Concerns
- Designing layered architectures
- Understanding asynchronous I/O
- Understanding event loop behavior
- Comparing blocking and non-blocking file operations

---

## Architecture

The application follows a layered architecture.

```text
Client
  │
  ▼
Routes
  │
  ▼
Controllers
  │
  ▼
Services
  │
  ▼
Repositories
  │
  ▼
users.json
```

Each layer has a single responsibility.

---

## Project Structure

```text
exercise-3/
│
├── data/
│   └── users.json
│
├── src/
│   ├── controllers/
│   │   └── user.controller.ts
│   │
│   ├── repositories/
│   │   └── user.repository.ts
│   │
│   ├── routes/
│   │   └── user.routes.ts
│   │
│   ├── services/
│   │   └── user.service.ts
│   │
│   ├── types/
│   │   └── user.ts
│   │
│   ├── utils/
│   │   └── file.util.ts
│   │
│   └── app.ts
│
├── data/
│   └── users.json
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Features

### Create User

Registers a new user.

#### Endpoint

```http
POST /users
```

#### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

#### Behavior

- Reads users from disk
- Validates email uniqueness
- Generates a UUID
- Generates a creation timestamp
- Persists the new user

---

### Get All Users

Returns all registered users.

#### Endpoint

```http
GET /users
```

#### Response

Passwords are never returned.

```json
[
  {
    "id": "f71f90c7",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-06-13T10:00:00.000Z"
  }
]
```

---

### Get User By ID

Returns a single user.

#### Endpoint

```http
GET /users/:id
```

#### Response

```json
{
  "id": "f71f90c7",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2026-06-13T10:00:00.000Z"
}
```

Passwords are omitted from all responses.

---

### Delete User

Deletes a user from the file system database.

#### Endpoint

```http
DELETE /users/:id
```

#### Behavior

- Reads current users
- Removes matching user
- Writes updated collection back to disk

---

## Data Persistence

All data is stored inside:

```text
data/users.json
```

Example:

```json
[
  {
    "id": "8e8f95c8-9ab3-4b98-bf87-0dc71f9fdb56",
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secret123",
    "createdAt": "2026-06-13T10:00:00.000Z"
  }
]
```

---

## Separation of Concerns

### Routes

Responsible for:

- Endpoint registration
- Request mapping

### Controllers

Responsible for:

- Request handling
- Response generation
- HTTP concerns

### Services

Responsible for:

- Business rules
- Validation
- User creation logic

### Repositories

Responsible for:

- File system persistence
- Data retrieval
- Data storage

### Utilities

Responsible for:

- Shared helper functions
- JSON file operations

---

## Asynchronous File Operations

All file access uses:

```ts
fs.promises.readFile();
fs.promises.writeFile();
```

Benefits:

- Non-blocking I/O
- Better concurrency
- Event loop remains responsive
- Improved scalability

---

## Event Loop Experiment

The exercise includes an intentional performance experiment.

### Version 1: Blocking I/O

Replace:

```ts
await fs.promises.readFile(...)
```

with:

```ts
fs.readFileSync(...)
```

inside the user retrieval flow.

Send 50 concurrent requests.

Expected result:

- Requests become progressively slower.
- The event loop becomes blocked.
- Incoming requests wait in a queue.

### Version 2: Non-Blocking I/O

Restore:

```ts
await fs.promises.readFile(...)
```

Expected result:

- More consistent response times.
- Better concurrency.
- Event loop remains available.

### Why?

Synchronous operations execute on the main thread and block the event loop.

Asynchronous file operations are delegated to libuv worker threads, allowing the event loop to continue processing incoming requests.

The key takeaway is not that asynchronous operations are "faster". The key difference is that asynchronous I/O does not block the event loop.

---

## Running the Application

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build application:

```bash
npm run build
```

Run production build:

```bash
npm start
```

---

## Example API Testing

Create user:

```bash
curl -X POST http://localhost:3000/users \
-H "Content-Type: application/json" \
-d '{"name":"John","email":"john@example.com","password":"123456"}'
```

Get users:

```bash
curl http://localhost:3000/users
```

Get user by id:

```bash
curl http://localhost:3000/users/{id}
```

Delete user:

```bash
curl -X DELETE http://localhost:3000/users/{id}
```

---

## Concepts Demonstrated

- Express
- TypeScript
- REST APIs
- CRUD Operations
- Repository Pattern
- Service Layer Pattern
- Separation of Concerns
- File System Persistence
- Asynchronous Programming
- Event Loop Behavior
- Non-Blocking I/O
- JSON Storage
- UUID Generation

---

## Skills Demonstrated

- Backend Development
- API Design
- TypeScript Development
- Node.js File System APIs
- Architecture Design
- Layered Applications
- Event Loop Analysis
- Performance Investigation
- Clean Code Practices

---

## Key Takeaway

This project demonstrates how a backend application can implement persistent storage without a traditional database while maintaining a scalable architecture and highlighting one of Node.js's most important concepts: the difference between blocking and non-blocking I/O and their impact on the event loop.
