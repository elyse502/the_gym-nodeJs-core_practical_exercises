# Exercise 1: Event Loop Blocking vs Worker Threads in Node.js

## Overview

This exercise demonstrates one of the most important concepts in Node.js:

> Multiple HTTP servers running on different ports inside the same Node.js process still share a single event loop.

The project intentionally creates a CPU-intensive operation that blocks the event loop and shows how that affects every server running in the same process. It then solves the problem using `worker_threads` to move CPU work off the main thread.

By completing this exercise, you will gain practical experience with:

- Node.js Event Loop
- CPU-bound vs I/O-bound workloads
- HTTP servers using the core `http` module
- Process architecture in Node.js
- Worker Threads
- Event loop starvation
- Concurrent request handling
- Performance bottlenecks in backend applications

---

## Learning Objectives

After completing this exercise, you should be able to explain:

- Why different ports do not create different event loops
- How multiple servers share the same JavaScript execution thread
- Why CPU-intensive code blocks incoming requests
- How the event loop schedules work
- When to use Worker Threads
- How Worker Threads improve application responsiveness
- The difference between concurrency and parallelism in Node.js

---

## Project Structure

```text
exercise-1/
│
├── src/
│   ├── index.ts
│   └── worker.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Scenario

The application creates two HTTP servers inside the same Node.js process.

### Server A

Runs on:

```text
http://localhost:3000
```

Available route:

```http
GET /heavy
```

Purpose:

- Executes a CPU-intensive counting loop
- Simulates a blocking operation
- Measures execution time

---

### Server B

Runs on:

```text
http://localhost:4000
```

Available route:

```http
GET /ping
```

Purpose:

- Acts as a health-check endpoint
- Returns an immediate response
- Helps observe event-loop behavior

Example response:

```json
{
  "status": "alive",
  "time": 1749999999999
}
```

---

## Architecture Before Worker Threads

```text
                 ┌───────────────────┐
                 │ Node.js Process   │
                 └─────────┬─────────┘
                           │
                    Single Event Loop
                           │
          ┌────────────────┴───────────────┐
          │                                │
          ▼                                ▼
     Server A                         Server B
   Port 3000                        Port 4000
      │                                │
      ▼                                ▼
  GET /heavy                      GET /ping
      │
      ▼
5 Billion Loop
      │
      ▼
Blocks Entire Event Loop
```

### Result

When `/heavy` starts running:

```text
GET /heavy  ---> Processing...

GET /ping   ---> Waiting...
```

Even though the requests target different ports, both servers share the same event loop.

Server B cannot respond until the loop finishes.

---

## Why This Happens

Node.js executes JavaScript on a single main thread.

Both servers:

```text
Server A
Server B
```

exist inside the same process and use the same event loop.

When the heavy route executes:

```js
while (count < 5_000_000_000) {
  count++;
}
```

the JavaScript thread becomes occupied.

The event loop cannot:

- Accept new requests
- Execute callbacks
- Process timers
- Handle other server routes

Everything waits.

This condition is known as:

```text
Event Loop Blocking
```

or

```text
Event Loop Starvation
```

---

## Architecture After Worker Threads

```text
                 ┌───────────────────┐
                 │ Node.js Process   │
                 └─────────┬─────────┘
                           │
                    Main Event Loop
                           │
          ┌────────────────┴───────────────┐
          │                                │
          ▼                                ▼
     Server A                         Server B
   Port 3000                        Port 4000
      │
      ▼
Creates Worker
      │
      ▼
┌───────────────────────┐
│     Worker Thread     │
│                       │
│   5 Billion Loop      │
│                       │
└───────────────────────┘
```

### Result

```text
GET /heavy  ---> Processing in Worker

GET /ping   ---> Immediate Response
```

The event loop stays free because the heavy computation executes in a separate thread.

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
```

Move into the project:

```bash
cd exercise-1
```

Install dependencies:

```bash
npm install
```

---

## Running the Project

Development mode:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

---

## Testing Event Loop Blocking

### Step 1

Start the application.

### Step 2

Open Postman or your browser.

Send:

```http
GET http://localhost:3000/heavy
```

### Step 3

Before the response returns, immediately send:

```http
GET http://localhost:4000/ping
```

---

### Expected Result Without Worker Threads

```text
/heavy is running

/ping waits
```

The second request does not return immediately.

---

### Expected Result With Worker Threads

```text
/heavy is running

/ping responds instantly
```

The application remains responsive.

---

## Example Response

### Heavy Route

```json
{
  "completed": true,
  "duration": 8743
}
```

---

### Ping Route

```json
{
  "status": "alive",
  "time": 1749999999999
}
```

---

## Key Concepts Demonstrated

### Event Loop

The event loop coordinates asynchronous operations and callback execution in Node.js.

A blocked event loop means:

- Requests wait
- Timers wait
- Callbacks wait
- Application responsiveness drops

---

### CPU-Bound Work

Examples:

- Image processing
- Video encoding
- Large calculations
- Cryptographic operations
- Machine learning workloads

CPU-bound tasks consume processor time directly.

These tasks are poor candidates for execution on the main thread.

---

### I/O-Bound Work

Examples:

- Database queries
- Reading files
- Network requests
- API calls

These operations spend most of their time waiting.

Node.js performs well with these workloads because they do not continuously occupy the event loop.

---

### Worker Threads

Worker Threads provide:

- Separate JavaScript execution contexts
- Separate V8 instances
- Parallel execution
- Message-based communication

They are ideal for CPU-intensive workloads.

---

## Interview Questions Covered

### Why did Server B become blocked even though it used a different port?

Because both servers shared the same Node.js process and event loop. The CPU-intensive loop occupied the JavaScript thread, preventing the event loop from processing requests for any server.

---

### Does every port get its own event loop?

No.

Ports are network endpoints.

The event loop belongs to the Node.js process, not the port.

---

### What changed after introducing Worker Threads?

The heavy computation moved from the main thread to a worker thread.

The main event loop remained available to handle incoming requests.

---

### What if a third server was added on port 5000?

Without Worker Threads:

```text
Server A blocked
Server B blocked
Server C blocked
```

With Worker Threads:

```text
Server A processing
Server B responsive
Server C responsive
```

---

## Skills Demonstrated

- TypeScript
- Node.js Core APIs
- HTTP Server Development
- Event Loop Analysis
- Performance Troubleshooting
- Worker Threads
- Concurrent Systems
- Backend Architecture
- CPU Workload Offloading
- Process and Thread Management

---

## Takeaway

This exercise demonstrates a fundamental Node.js principle:

> Multiple servers running inside the same process share the same event loop.

A CPU-intensive task blocks every route, every server, and every request in that process.

Moving heavy computation into Worker Threads isolates the workload, keeps the event loop responsive, and allows the application to continue serving requests while expensive work executes in parallel.
