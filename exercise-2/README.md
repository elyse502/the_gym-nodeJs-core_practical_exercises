# Exercise 2: Process Monitor with Node.js Core Modules

## Overview

This exercise explores how Node.js interacts with the operating system and manages its own process lifecycle.

The application exposes a lightweight process monitoring API built entirely with Node.js core modules. No external web frameworks or middleware are used.

The server provides endpoints for:

- Operating system diagnostics
- Process diagnostics
- Environment variable inspection
- Graceful process termination
- Shutdown logging

This exercise focuses on understanding the `os` module, the global `process` object, process lifecycle events, memory monitoring, environment variables, and manual HTTP routing using the core `http` and `url` modules.

---

## Learning Objectives

After completing this exercise, you should be able to:

- Create HTTP APIs without Express
- Route requests manually using the `url` module
- Inspect operating system resources with the `os` module
- Monitor Node.js process memory usage
- Track process uptime
- Work with environment variables securely
- Handle process lifecycle events
- Implement graceful shutdown behavior
- Persist shutdown events to log files
- Structure Node.js applications using separation of concerns

---

## Project Structure

```text
exercise-2/
│
├── logs/
│   └── server.log
│
├── src/
│   ├── env.ts
│   ├── index.ts
│   ├── logger.ts
│   ├── metrics.ts
│   └── shutdown.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Architecture

### metrics.ts

Responsible for:

- Memory calculations
- CPU information collection
- Process metrics collection
- OS metrics collection

---

### env.ts

Responsible for:

- Reading environment variables
- Masking sensitive values

Sensitive keys containing:

```text
SECRET
KEY
PASSWORD
```

are automatically hidden.

---

### logger.ts

Responsible for:

- Creating log directories
- Writing log entries
- Managing shutdown logs

---

### shutdown.ts

Responsible for:

- Registering process exit handlers
- Scheduling application shutdown
- Persisting shutdown information

---

### index.ts

Responsible for:

- HTTP server creation
- Request routing
- Response formatting
- Endpoint orchestration

---

## Available Endpoints

### GET /health

Returns system and process diagnostics.

Example response:

```json
{
  "system": {
    "totalMemoryMb": 16384,
    "freeMemoryMb": 7210,
    "platform": "win32",
    "osType": "Windows_NT"
  },
  "cpu": {
    "cores": 12,
    "model": "Intel(R) Core(TM) i7"
  },
  "process": {
    "pid": 12345,
    "uptimeSeconds": 42.18,
    "memoryUsage": {
      "rssMb": 55.2,
      "heapUsedMb": 8.9,
      "heapTotalMb": 15.4
    }
  }
}
```

### Metrics Explained

#### RSS

Resident Set Size.

Represents total memory allocated for the process.

#### heapUsed

Memory currently used by JavaScript objects.

#### heapTotal

Total heap allocated by the V8 engine.

#### uptime

Amount of time the process has been running.

---

### GET /env

Returns all environment variables.

Sensitive variables are masked.

Example:

Environment:

```env
DB_PASSWORD=my-secret
JWT_SECRET=top-secret
PORT=3000
```

Response:

```json
{
  "DB_PASSWORD": "***",
  "JWT_SECRET": "***",
  "PORT": "3000"
}
```

---

### GET /kill

Triggers graceful process shutdown.

Behavior:

1. Logs warning message.
2. Responds to client.
3. Waits 3 seconds.
4. Executes `process.exit(1)`.
5. Triggers shutdown log entry.

Response:

```json
{
  "message": "Server shutting down in 3 seconds"
}
```

---

## Shutdown Logging

The application registers a process exit handler.

```ts
process.on("exit", ...)
```

When the process exits:

```text
server shut down at 2026-06-12T10:15:43.921Z
```

is appended to:

```text
logs/server.log
```

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

Build:

```bash
npm run build
```

Run production build:

```bash
npm start
```

---

## Manual Testing

### Health Endpoint

```bash
curl http://localhost:3000/health
```

### Environment Endpoint

```bash
curl http://localhost:3000/env
```

### Shutdown Endpoint

```bash
curl http://localhost:3000/kill
```

Verify:

```text
logs/server.log
```

contains a shutdown entry.

---

## Concepts Demonstrated

### Node.js Core HTTP Server

Building APIs without Express.

### Manual URL Routing

Using:

```ts
parse(req.url);
```

to determine route handlers.

### Operating System Inspection

Using:

```ts
os.totalmem();
os.freemem();
os.cpus();
os.type();
```

### Process Monitoring

Using:

```ts
process.memoryUsage();
process.pid;
process.uptime();
```

### Environment Variable Management

Using:

```ts
process.env;
```

while protecting sensitive information.

### Graceful Shutdown

Using:

```ts
process.on("exit");
process.exit();
```

to coordinate application termination.

---

## Skills Demonstrated

- TypeScript
- Node.js Core APIs
- HTTP Server Development
- Process Monitoring
- OS Monitoring
- Manual Routing
- Environment Variable Handling
- Graceful Shutdown Patterns
- Logging
- Separation of Concerns
- Backend Diagnostics

---

## Takeaways

This exercise demonstrates how Node.js applications can inspect both the operating system and their own runtime environment without relying on external libraries.

It reinforces an important backend engineering principle:

Understanding the health of a running process is often as important as implementing business logic.
