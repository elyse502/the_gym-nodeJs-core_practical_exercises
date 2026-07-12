<div align="center">

# 🚀 Node.js Core Practical Exercises 🔗

## Building Node.js from First Principles

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Commits](https://img.shields.io/github/commit-activity/m/elyse502/the_gym-nodeJs-core_practical_exercises?style=for-the-badge)

### **Mastering Node.js Internals Without Frameworks**

![Event Loop](https://img.shields.io/badge/Event_Loop-Deep_Dive-FF6B6B?style=flat-square&logo=node.js&logoColor=white)
![Worker Threads](https://img.shields.io/badge/Worker_Threads-Concurrency-4CAF50?style=flat-square&logo=node.js&logoColor=white)
![HTTP](https://img.shields.io/badge/HTTP-Protocol-1E90FF?style=flat-square&logo=http&logoColor=white)
![Authentication](https://img.shields.io/badge/Authentication-Security-DC143C?style=flat-square&logo=auth0&logoColor=white)

</div>

---

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [🏗️ Repository Structure](#️-repository-structure)
- [📚 Learning Roadmap](#-learning-roadmap)
- [🛠️ Technologies](#️-technologies)
- [🔬 Exercise Deep Dives](#-exercise-deep-dives)
- [🏛️ Architecture Patterns](#️-architecture-patterns)
- [📊 Key Concepts Covered](#-key-concepts-covered)
- [🛡️ Skills Demonstrated](#️-skills-demonstrated)
- [⚙️ Running the Projects](#️-running-the-projects)
- [💡 Philosophy](#-philosophy)
- [📈 What I Learned](#-what-i-learned)
- [🔮 Future Improvements](#-future-improvements)
- [👨‍💻 Author](#-author)
- [📄 License](#-license)

---

## 🎯 Overview

This repository documents my **deep dive into Node.js internals** by implementing backend systems **without relying on frameworks** whenever possible. Instead of learning how to use Express or NestJS, I rebuilt many of their core features using **only the Node.js standard library**.

> **"Understanding how things work internally makes you a better engineer when using abstractions."**

### The Journey

| Phase       | Focus                      | Outcome                          |
| ----------- | -------------------------- | -------------------------------- |
| **Phase 1** | Event Loop & Concurrency   | Understanding Node.js scheduling |
| **Phase 2** | HTTP & Networking          | Building servers from scratch    |
| **Phase 3** | File Systems & Persistence | JSON-based databases             |
| **Phase 4** | Security & Authentication  | Session management & hashing     |
| **Phase 5** | Production Architecture    | Layered, scalable design         |

---

## 🏗️ Repository Structure

```console
nodejs-core-practical-exercises/
│
├── 📁 exercise-1/                      # Event Loop & Worker Threads
│   ├── 📄 server.ts                    # Multi-server implementation
│   ├── 📄 worker.ts                    # CPU-bound task worker
│   └── 📄 README.md
│
├── 📁 exercise-2/                      # Process Monitor
│   ├── 📄 server.ts                    # System monitoring server
│   └── 📄 README.md
│
├── 📁 exercise-3/                      # File System Database
│   ├── 📄 server.ts                    # REST API with JSON storage
│   └── 📄 README.md
│
├── 📁 exercise-4/                      # Event Loop Deep Dive
│   ├── 📄 experiments.ts               # Microtask/Macrotask tests
│   └── 📄 README.md
│
├── 📁 exercise-5/                      # HTTPS & Middleware
│   ├── 📄 server.ts                    # HTTPS + Express middleware
│   └── 📄 README.md
│
├── 📁 exercise-6/                      # Pure Node.js User System
│   ├── 📄 server.ts                    # Full backend without Express
│   ├── 📄 flood.js                     # Concurrency testing script
│   └── 📄 README.md
│
└── 📄 README.md                        # Documentation
```

---

## 📚 Learning Roadmap

| Exercise | Topic                       | Core Concepts                                                    | Difficulty |
| -------- | --------------------------- | ---------------------------------------------------------------- | ---------- |
| **1**    | Event Loop & Worker Threads | Blocking operations, Worker Threads, multi-server architecture   | ⭐⭐⭐     |
| **2**    | Process Monitor             | OS module, Process API, Environment Variables, Graceful Shutdown | ⭐⭐       |
| **3**    | File System Database        | Express, Repository Pattern, Async File I/O                      | ⭐⭐⭐     |
| **4**    | Event Loop Deep Dive        | Microtasks, Macrotasks, Timers, nextTick, EventEmitter           | ⭐⭐⭐⭐   |
| **5**    | HTTPS & Middleware          | TLS, HTTPS, Express Middleware Pipeline                          | ⭐⭐⭐     |
| **6**    | Pure Node.js User System    | Authentication, Authorization, Sessions, Routing, Concurrency    | ⭐⭐⭐⭐⭐ |

---

## 🛠️ Technologies

<div align="center">

### Core Technologies

| Technology     | Purpose     | Badge                                                                                             |
| -------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| **TypeScript** | Type Safety | ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white) |
| **Node.js**    | Runtime     | ![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)        |

### Node.js Core Modules

| Module             | Purpose        | Badge                                                                                                   |
| ------------------ | -------------- | ------------------------------------------------------------------------------------------------------- |
| **http**           | HTTP Server    | ![HTTP](https://img.shields.io/badge/http-Core-FF6B6B?logo=node.js&logoColor=white)                     |
| **https**          | HTTPS Server   | ![HTTPS](https://img.shields.io/badge/https-Core-4CAF50?logo=node.js&logoColor=white)                   |
| **fs**             | File System    | ![FS](https://img.shields.io/badge/fs-Core-1E90FF?logo=node.js&logoColor=white)                         |
| **path**           | Path Utilities | ![Path](https://img.shields.io/badge/path-Core-FFA500?logo=node.js&logoColor=white)                     |
| **url**            | URL Parsing    | ![URL](https://img.shields.io/badge/url-Core-8A2BE2?logo=node.js&logoColor=white)                       |
| **os**             | OS Information | ![OS](https://img.shields.io/badge/os-Core-DC143C?logo=node.js&logoColor=white)                         |
| **crypto**         | Cryptography   | ![Crypto](https://img.shields.io/badge/crypto-Core-006400?logo=node.js&logoColor=white)                 |
| **worker_threads** | Concurrency    | ![Worker Threads](https://img.shields.io/badge/worker_threads-Core-FF1493?logo=node.js&logoColor=white) |
| **perf_hooks**     | Performance    | ![Performance](https://img.shields.io/badge/perf_hooks-Core-00CED1?logo=node.js&logoColor=white)        |

### External Packages (Minimal)

| Package     | Purpose                              |
| ----------- | ------------------------------------ |
| **Express** | HTTP framework (Exercise 3 & 5 only) |
| **tsx**     | TypeScript execution                 |

</div>

> **Note:** No databases or ORMs were used. All persistence is file-based with JSON.

---

## 🔬 Exercise Deep Dives

### 🧵 Exercise 1: Event Loop Blocking & Worker Threads

**Built two HTTP servers inside a single Node.js process.**

```typescript
// Key Implementation
import { Worker } from "worker_threads";

// CPU-intensive work moved to worker thread
const worker = new Worker("./worker.ts");
worker.postMessage({ data: heavyTask });
worker.on("message", (result) => {
  // Event loop stays responsive
});
```

**Explored:**

- ✅ Shared Event Loop
- ✅ CPU-bound operations
- ✅ Worker Threads
- ✅ Performance measurement
- ✅ Event Loop responsiveness

**Key Takeaway:** Moving CPU-intensive work into Worker Threads keeps the Event Loop responsive and allows multiple servers within the same process to continue serving requests.

---

### 📊 Exercise 2: Process Monitoring Server

**Built a system monitoring server using only Node.js core modules.**

```typescript
// Key Implementation
import os from "os";
import process from "process";

const memoryStats = {
  total: os.totalmem(),
  free: os.freemem(),
  usage: (1 - os.freemem() / os.totalmem()) * 100,
};

const cpuInfo = os.cpus().map((cpu) => ({
  model: cpu.model,
  speed: cpu.speed,
  times: cpu.times,
}));
```

**Implemented:**

- ✅ Memory statistics
- ✅ CPU information
- ✅ Process information
- ✅ Environment variable masking
- ✅ Graceful shutdown logging

**Key Takeaway:** Understanding the relationship between the operating system and the Node.js runtime is crucial for building production-ready applications.

---

### 🗄️ Exercise 3: File System Database

**Implemented a REST API backed entirely by JSON files.**

```typescript
// Repository Pattern Implementation
class UserRepository {
  private filePath = "./data/users.json";

  async findAll(): Promise<User[]> {
    const data = await fs.readFile(this.filePath, "utf-8");
    return JSON.parse(data);
  }

  async save(user: User): Promise<void> {
    const users = await this.findAll();
    users.push(user);
    await fs.writeFile(this.filePath, JSON.stringify(users, null, 2));
  }
}
```

**Features:**

- ✅ User registration
- ✅ File-based persistence
- ✅ Repository Pattern
- ✅ Async File I/O
- ✅ Service Layer
- ✅ Controllers

**Key Takeaway:** Asynchronous I/O improves scalability because the Event Loop remains free while libuv performs file operations.

---

### 🔄 Exercise 4: Event Loop Visualizer

**Built multiple experiments to understand Node.js scheduling.**

```typescript
// Event Loop Priority Experiment
setImmediate(() => console.log("1: setImmediate"));
setTimeout(() => console.log("2: setTimeout"), 0);
process.nextTick(() => console.log("3: nextTick"));
Promise.resolve().then(() => console.log("4: Promise"));

// Output Order:
// 3: nextTick
// 4: Promise
// 2: setTimeout
// 1: setImmediate
```

**Covered:**

- ✅ `process.nextTick()`
- ✅ Promise microtasks
- ✅ Timers
- ✅ `setImmediate()`
- ✅ Poll phase
- ✅ EventEmitter
- ✅ Starvation
- ✅ Always Async Pattern

**Key Takeaway:** Understanding why Node.js executes callbacks in a specific order rather than memorizing the order itself.

---

### 🔒 Exercise 5: HTTPS & Middleware

**Implemented HTTPS server with custom middleware pipeline.**

```typescript
// Custom Middleware Pipeline
const middleware = [
  loggerMiddleware,
  requestTimer,
  authMiddleware,
  bodySizeGuard,
];

function runMiddleware(req, res, index) {
  if (index >= middleware.length) {
    return handleRequest(req, res);
  }
  middleware[index](req, res, () => runMiddleware(req, res, index + 1));
}
```

**Implemented:**

- ✅ HTTPS server
- ✅ Self-signed TLS certificates
- ✅ Express middleware pipeline
- ✅ Custom logger
- ✅ Request timer
- ✅ Authentication middleware
- ✅ Body size guard

**Key Takeaway:** Express middleware is fundamentally a chain of functions connected through `next()`.

---

### 🏗️ Exercise 6: Pure Node.js User System

**Built a complete backend application without Express.**

```typescript
// Manual Router Implementation
class Router {
  private routes = new Map<string, Map<string, Handler>>();

  addRoute(method: string, path: string, handler: Handler) {
    if (!this.routes.has(path)) {
      this.routes.set(path, new Map());
    }
    this.routes.get(path)!.set(method, handler);
  }

  async handleRequest(req, res) {
    const route = this.routes.get(req.url);
    if (route && route.has(req.method)) {
      await route.get(req.method)!(req, res);
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  }
}
```

**Features:**

- ✅ Manual HTTP server
- ✅ Manual router
- ✅ Manual request body parsing
- ✅ Authentication
- ✅ Authorization
- ✅ Session management
- ✅ User CRUD
- ✅ Password hashing
- ✅ Repository Pattern
- ✅ Service Layer
- ✅ Controllers
- ✅ JSON persistence

**Concurrency Testing:**

```bash
# Stress test with concurrent requests
node flood.js
```

**Key Takeaway:** Correct code is not necessarily concurrency-safe. Implemented an in-memory write lock to eliminate race conditions during concurrent registrations.

---

## 🏛️ Architecture Patterns

### Layered Architecture

```console
                    ┌─────────────────┐
                    │   HTTP Server   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     Router      │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
       ┌─────────────────┐     ┌─────────────────┐
       │   Controllers   │     │  Authentication │
       └────────┬────────┘     └─────────────────┘
                │
                ▼
       ┌─────────────────┐
       │    Services     │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  Repositories   │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │ JSON File Store │
       └─────────────────┘
```

### Layer Responsibilities

| Layer            | Responsibility            | Example                                     |
| ---------------- | ------------------------- | ------------------------------------------- |
| **Router**       | Matches incoming requests | `router.addRoute('GET', '/users', handler)` |
| **Controllers**  | Handles HTTP concerns     | `req, res → service.call()`                 |
| **Services**     | Contains business logic   | `userService.register(data)`                |
| **Repositories** | Manages persistence       | `userRepo.save(user)`                       |
| **Storage**      | Physical data storage     | `data/users.json`                           |

---

## 📊 Key Concepts Covered

### Node.js Runtime

- 🔄 **Event Loop** - Understanding phases and scheduling
- 📦 **libuv** - Cross-platform asynchronous I/O
- 🧵 **Worker Threads** - CPU-bound task offloading
- 🏊 **Thread Pool** - Managing concurrent operations
- ⏰ **Process Lifecycle** - Startup, execution, shutdown

### Networking

- 🌐 **HTTP** - Server creation, request parsing, response streaming
- 🔒 **HTTPS** - TLS/SSL implementation
- 🔑 **TLS** - Certificate generation and management
- 📨 **Request Parsing** - Manual body parsing (JSON, form data)
- 📤 **Response Streaming** - Chunked responses

### File System

- 📂 **Async File I/O** - Non-blocking operations
- 🔒 **Synchronous File I/O** - Blocking operations
- 💾 **JSON Persistence** - Data storage without databases
- 📁 **Directory Management** - Creating, reading, deleting

### Authentication

- 🍪 **Session Tokens** - Managing user sessions
- 🔐 **Password Hashing** - Secure password storage
- 🛡️ **Authorization** - Role-based access control

### Performance

- ⚡ **Blocking vs Non-blocking** - Understanding the difference
- 🌀 **Event Loop Starvation** - Causes and prevention
- 🧵 **Worker Threads** - Proper usage patterns
- 📊 **Performance Measurement** - `perf_hooks` module

### Concurrency

- 🏃 **Race Conditions** - Identifying and fixing
- 🔒 **Write Locks** - Implementing critical sections
- 📈 **Concurrent Requests** - Stress testing
- 🚦 **Critical Sections** - Protecting shared resources

---

## 🛡️ Skills Demonstrated

| Category           | Skills                                                     |
| ------------------ | ---------------------------------------------------------- |
| **Languages**      | TypeScript, JavaScript                                     |
| **Runtime**        | Node.js Internals                                          |
| **Architecture**   | Layered Design, Separation of Concerns, Repository Pattern |
| **Authentication** | Session Management, Password Hashing, Authorization        |
| **Networking**     | HTTP Protocol, HTTPS, TLS                                  |
| **Performance**    | Event Loop Understanding, Worker Threads, Optimization     |
| **Concurrency**    | Race Condition Prevention, Write Locks                     |
| **Persistence**    | File-based Storage, JSON Operations                        |
| **Testing**        | Stress Testing, Concurrent Request Handling                |

---

## ⚙️ Running the Projects

Each exercise is self-contained with its own README.

### Quick Start

```console
# Clone the repository
git clone https://github.com/elyse502/the_gym-nodeJs-core_practical_exercises.git

# Navigate to an exercise
cd exercise-1

# Install dependencies
npm install

# Start development mode
npm run dev
```

### Exercise Specific Commands

```console
# Exercise 6 - Concurrency testing
node flood.js

# Exercise 4 - Run event loop experiments
npm run experiment

# Exercise 5 - Generate SSL certificates
npm run generate-cert
```

---

## 💡 Philosophy

### Why This Repository Exists

> **"Most tutorials teach how to use frameworks. This repository focuses on understanding how those frameworks work internally."**

| Approach    | Traditional Learning | This Repository       |
| ----------- | -------------------- | --------------------- |
| **Focus**   | Using frameworks     | Building from scratch |
| **Goal**    | Productivity         | Understanding         |
| **Outcome** | Know how to use      | Know why it works     |

### Benefits of Learning Internals

| Benefit              | Explanation                                                  |
| -------------------- | ------------------------------------------------------------ |
| **Debugging**        | Easier to debug when you understand the underlying mechanics |
| **Performance**      | Make better optimization decisions                           |
| **Framework Choice** | Choose the right tool for the job                            |
| **Custom Solutions** | Build custom solutions when needed                           |
| **Confidence**       | Greater confidence in production code                        |

---

## 📈 What I Learned

### Technical Insights

1. **How Node.js processes requests**
   - Event Loop phases
   - Connection handling
   - Request/Response lifecycle

2. **Why the Event Loop behaves the way it does**
   - Microtasks vs Macrotasks
   - `nextTick` vs `setImmediate`
   - Poll phase mechanics

3. **How asynchronous I/O interacts with libuv**
   - Thread pool operations
   - Non-blocking I/O
   - Cross-platform compatibility

4. **Why Worker Threads exist**
   - CPU-bound operations
   - Parallel processing
   - Shared memory

5. **How Express routing and middleware work internally**
   - `next()` function
   - Middleware chains
   - Route matching

6. **How authentication systems are built**
   - Session generation
   - Token validation
   - Password security

7. **Why race conditions occur**
   - Concurrent operations
   - Shared state
   - Critical sections

8. **How layered backend architectures improve maintainability**
   - Separation of concerns
   - Testability
   - Scalability

### Soft Skills

- 📝 **Documentation** - Clear technical writing
- 🏗️ **Architecture** - System design thinking
- 🐛 **Debugging** - Problem-solving skills
- 🔍 **Research** - Deep diving into documentation

---

## 🔮 Future Improvements

| Feature                         | Priority | Description                   |
| ------------------------------- | -------- | ----------------------------- |
| 🔐 **JWT Authentication**       | High     | JSON Web Token implementation |
| 🔄 **Refresh Tokens**           | High     | Token refresh mechanism       |
| 👥 **Role-Based Authorization** | High     | Granular permission system    |
| 🧂 **Password Salting**         | High     | bcrypt or Argon2 integration  |
| 🗄️ **Database Integration**     | Medium   | PostgreSQL or MongoDB         |
| 🐳 **Docker Support**           | Medium   | Containerized development     |
| 🧪 **Automated Testing**        | Medium   | Jest unit & integration tests |
| 🔄 **CI/CD Pipeline**           | Medium   | Automated deployment          |
| 📚 **OpenAPI Documentation**    | Low      | API specification             |
| 📊 **Structured Logging**       | Low      | Winston or Pino integration   |
| 🚦 **Rate Limiting**            | Low      | Prevent abuse                 |
| 🔌 **WebSocket Support**        | Low      | Real-time communication       |

---

## 🙏 Acknowledgments

- **Node.js Core Team** - For building an incredible runtime
- **TypeScript Team** - For type safety
- **Open Source Community** - For continuous inspiration
- **The Gym Rwanda** - For the learning environment

---

## 👨‍💻 Author

### **NIYIBIZI Elysee**

_Computer Science Student | Backend Software Engineer_

<div align="center">

[![Portfolio](https://img.shields.io/badge/Portfolio-elyseedev.netlify.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://elyseedev.netlify.app)
[![GitHub](https://img.shields.io/badge/GitHub-elyse502-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/elyse502)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Niyibizi_Elysée-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/niyibizi-elysée)
[![Email](https://img.shields.io/badge/Email-elyseniyibizi502@gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:elyseniyibizi502@gmail.com)

</div>

**Focused on:**

- 🔧 Building scalable backend systems
- 📦 Node.js & TypeScript
- 🌐 Distributed systems
- 🏛️ Modern software architecture

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](https://github.com/elyse502/the_gym-nodeJs-core_practical_exercises/blob/main/LICENSE) file for details.

```
MIT License

Copyright (c) 2026 NIYIBIZI Elysee

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

<div align="center">

### ⭐ Star this repository if you're on a journey to master Node.js internals!

**Built with 💻, TypeScript, and Deep Understanding**

---

_"The best way to understand abstractions is to build them yourself."_

[⬆ Back to Top](#-table-of-contents)

</div>
