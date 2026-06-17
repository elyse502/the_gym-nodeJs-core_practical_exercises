# Exercise 4 - Event Loop, Scheduling, and EventEmitter Deep Dive

## Overview

This exercise explores one of the most important parts of Node.js: the Event Loop.

Unlike previous exercises that focused on building APIs and servers, this exercise focuses on understanding how Node.js schedules work internally and how different queues and phases interact.

The objective is to build a strong mental model rather than memorize execution orders.

Topics covered include:

- Event Loop phases
- Microtasks
- process.nextTick()
- Promise queues
- Timers
- setImmediate()
- EventEmitter behavior
- Event loop starvation
- The Always Async pattern
- Background task scheduling
- Queue priorities and ordering constraints

---

# Objectives

Learn:

- How Node.js schedules work
- Why execution order matters
- When to use process.nextTick()
- When to use setImmediate()
- Why recursive nextTick causes starvation
- Why APIs should be consistently asynchronous
- How EventEmitter behaves
- How scheduling primitives affect application responsiveness
- How to reason about execution instead of memorizing outputs

---

# Project Structure

```text
exercise-4/
│
├── src/
│
├── 4a-event-loop-visualizer/
│   ├── index.ts
│   ├── prediction.md
│   └── users.json
│
├── 4b-1-emit-after-listener/
│   └── index.ts
│
├── 4b-2-starvation-trap/
│   └── index.ts
│
├── 4b-3-always-async/
│   ├── index.ts
│   └── data.txt
│
├── 4b-4-log-scheduling/
│   ├── server.ts
│   ├── send20.ts
│   ├── analytics.log
│   └── helpers/
│       └── logger.ts
│
├── 4b-5-control-order/
│   └── index.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

---

# Exercise 4A - Event Loop Visualizer

## Goal

Understand how callbacks are scheduled across different queues and phases.

### Scheduling Primitives Used

- process.nextTick()
- Promise.resolve().then()
- setTimeout()
- setImmediate()
- fs.readFile()

### Concepts Learned

- Main thread execution
- Microtasks
- Timers phase
- Poll phase
- Check phase
- I/O callbacks

### Output Analysis

The exercise encourages predicting execution order before running the code and comparing predictions with actual runtime behavior.

This develops a mental model of the event loop instead of relying on memorization.

---

# Exercise 4B.1 - Emit After Listener Registration

## Problem

Events emitted before listeners are registered are lost.

```ts
loader.load();
loader.on("ready", callback);
```

The listener misses the event because it is attached too late.

## Solution

Use:

```ts
process.nextTick(() => {
  this.emit("ready");
});
```

## Concepts Learned

- EventEmitter behavior
- Deferred event emission
- Why nextTick exists
- Difference between nextTick and setTimeout

---

# Exercise 4B.2 - Event Loop Starvation

## Problem

Recursive process.nextTick() prevents Node from progressing through event loop phases.

```ts
function recursive() {
  process.nextTick(recursive);
}
```

The server starts but becomes unresponsive.

## Solution

Replace:

```ts
process.nextTick(recursive);
```

with:

```ts
setImmediate(recursive);
```

## Concepts Learned

- Event loop starvation
- Queue draining behavior
- Cooperative scheduling
- Why setImmediate exists

---

# Exercise 4B.3 - Always Async Pattern

## Problem

Callbacks sometimes execute synchronously and sometimes asynchronously.

```ts
if (cache[key]) {
  callback();
}
```

This creates unpredictable behavior.

Known as:

> Releasing Zalgo

## Solution

```ts
process.nextTick(() => {
  callback();
});
```

## Concepts Learned

- Always Async pattern
- Consistent API behavior
- Cache hit vs cache miss timing
- Why Node core prefers asynchronous callbacks

---

# Exercise 4B.4 - Log Scheduling

## Problem

Analytics writes should not delay request processing.

Three strategies were evaluated:

### process.nextTick()

Works but treats logging as high priority work.

### setTimeout()

Works but introduces unnecessary timer semantics.

### setImmediate()

Provides the correct scheduling semantics for background work.

## Recommended Choice

```ts
setImmediate();
```

## Concepts Learned

- Background task scheduling
- Priorities and intent
- Event loop friendly design

---

# Exercise 4B.5 - Controlling Execution Order

## Goal

Control output ordering using scheduling primitives without changing code order.

Scheduling mechanisms used:

- Promise.resolve().then()
- process.nextTick()
- setTimeout()
- setImmediate()

Example:

```ts
setTimeout(() => console.log("A"), 0);

Promise.resolve().then(() => console.log("B"));

setImmediate(() => console.log("C"));

process.nextTick(() => console.log("D"));
```

Output:

```
B
D
A
C
```

## Concepts Learned

- Queue priorities
- Scheduling constraints
- Ordering guarantees
- Event loop reasoning

---

# Core Concepts Covered

## Call Stack

Executes synchronous code.

---

## Promise Microtasks

Executed after the current stack completes.

---

## process.nextTick Queue

High-priority queue drained before event loop continuation.

---

## Timers Phase

Handles:

```ts
setTimeout();
setInterval();
```

---

## Poll Phase

Processes I/O operations.

Examples:

- fs.readFile()
- sockets
- HTTP requests

---

## Check Phase

Processes:

```ts
setImmediate();
```

---

# Key Lessons

### EventEmitter does not replay events.

Events are delivered only to listeners registered at emission time.

---

### process.nextTick() is powerful but dangerous.

Recursive nextTick usage can starve the event loop.

---

### setImmediate() enables cooperative scheduling.

It allows Node to continue servicing I/O.

---

### APIs should be consistently asynchronous.

Callbacks should never behave synchronously on one path and asynchronously on another.

---

### Scheduling communicates intent.

Different scheduling mechanisms express different priorities.

---

### Understanding queues is more important than memorizing output.

The correct questions are:

1. Which queue receives the callback?
2. When is that queue drained?
3. Which phase is currently executing?
4. Will additional microtasks be created?

---

# Technologies

- TypeScript
- Node.js
- EventEmitter
- HTTP module
- File System module

---

# Skills Demonstrated

- Event Loop internals
- Queue prioritization
- Scheduling strategies
- EventEmitter patterns
- Cooperative multitasking
- API design principles
- Debugging asynchronous behavior
- Performance reasoning
- Mental model development

---

# Key Takeaway

This exercise focuses on understanding how Node.js works internally.

Rather than memorizing execution orders, the goal is to reason about queues, phases, and priorities so that asynchronous code becomes predictable and easier to design.
