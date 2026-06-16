Now we move into one of the most important event-loop exercises you'll ever do.

This exercise explains why Node.js has repeatedly warned developers about abusing `process.nextTick()`.

---

# Exercise 4B.2 — The Starvation Trap

## Learning Goals

By the end of this exercise you should understand:

- Why Node.js is "single-threaded" for JavaScript
- What event-loop starvation means
- Why `process.nextTick()` is dangerous when abused
- Why `setImmediate()` exists
- How Node decides when to move between phases

---

# Step 1 — Create the Broken Server

## Structure

```txt id="y35d4m"
src/
└── 4b-2-starvation-trap/
    └── index.ts
```

---

## index.ts

```ts
import http from "node:http";

/**
 * Demonstrates event-loop starvation
 * caused by recursive process.nextTick().
 */
function recursive(): void {
  process.nextTick(recursive);
}

recursive();

http
  .createServer((_req, res) => {
    res.end("hello");
  })
  .listen(3000, () => {
    console.log("Server listening on port 3000");
  });
```

---

# Step 2 — Prediction

Before running, answer:

### Question 1

Will the server start?

Prediction:

```txt id="43it4s"
Yes
```

Why?

Because:

```ts
listen();
```

is still reached during initial execution.

---

### Question 2

Will GET / respond?

Think before running.

Most developers answer:

```txt id="cey7hr"
Yes
```

because:

```txt id="tcbfuz"
The server started successfully.
```

This assumption is wrong.

---

# Step 3 — Run

```bash id="5jlwmc"
npm run dev
```

Open browser:

```txt id="q6xbh3"
http://localhost:3000
```

or Postman.

---

# What Happens?

You will likely observe:

```txt id="4v0jlwm"
Request hangs forever.
```

No response.

---

# Why?

Let's walk through the execution.

---

# Phase 1

Main script executes.

---

Node reaches:

```ts
recursive();
```

---

Inside:

```ts
process.nextTick(recursive);
```

Node schedules:

```txt id="o6x9wz"
recursive
```

inside the nextTick queue.

---

Function returns.

---

Call stack becomes empty.

---

Node now asks:

```txt id="6zzgzb"
Any nextTick callbacks waiting?
```

Answer:

```txt id="lnhbt4"
Yes.
```

---

Node executes:

```txt id="bm56eg"
recursive
```

again.

---

Inside recursive:

```ts
process.nextTick(recursive);
```

adds another callback.

---

Callback ends.

---

Node asks again:

```txt id="m7z4q0"
Any nextTick callbacks waiting?
```

Answer:

```txt id="lpw2sx"
Yes.
```

---

Execute again.

---

Schedule another.

---

Execute again.

---

Schedule another.

---

Forever.

---

# Visual Representation

```txt id="mb40zh"
nextTick Queue

[recursive]
↓
execute

[recursive]
↓
execute

[recursive]
↓
execute

[recursive]
↓
execute

...
```

Never ends.

---

# What Is Node Waiting For?

Node wants to enter:

```txt id="jlwmnm"
Timers Phase
```

Then:

```txt id="r7br1t"
Poll Phase
```

Then:

```txt id="x0fdc9"
Check Phase
```

But it never gets there.

---

Because:

```txt id="jifwhh"
nextTick queue is never empty
```

---

# This Is Event Loop Starvation

Definition:

> One queue continuously creates more work and prevents the event loop from reaching other phases.

---

The HTTP server exists.

The socket is open.

The OS accepts connections.

But Node never processes them.

---

Because Node is trapped here:

```txt id="89mrxg"
nextTick
↓
nextTick
↓
nextTick
↓
nextTick
↓
nextTick
```

forever.

---

# Add Debug Logging

Modify:

```ts
function recursive(): void {
  console.log("running nextTick");

  process.nextTick(recursive);
}
```

---

Run again.

You'll see:

```txt id="8y2a3h"
running nextTick
running nextTick
running nextTick
running nextTick
running nextTick
...
```

Thousands per second.

---

# Mental Model

Many developers imagine:

```txt id="9zcrd2"
nextTick
↓
Timers
↓
Poll
↓
Check
```

---

Reality:

Node does:

```txt id="n6br6v"
Drain nextTick Queue
```

completely before continuing.

---

If new nextTicks keep appearing:

```txt id="ef6o8w"
Queue never empties.
```

---

No phase transition occurs.

---

# Step 4 — Fix Using setImmediate

Replace:

```ts
process.nextTick(recursive);
```

with:

```ts
setImmediate(recursive);
```

---

Full Script

```ts
import http from "node:http";

/**
 * Demonstrates cooperative scheduling
 * using setImmediate.
 */
function recursive(): void {
  setImmediate(recursive);
}

recursive();

http
  .createServer((_req, res) => {
    res.end("hello");
  })
  .listen(3000, () => {
    console.log("Server listening on port 3000");
  });
```

---

# Prediction

Will recursion still happen?

```txt id="2r21eg"
Yes.
```

---

Will server respond?

```txt id="jrz4cn"
Yes.
```

---

# Why?

Because:

```ts
setImmediate();
```

does not execute immediately.

It enters:

```txt id="0zd0i0"
Check Phase
```

---

Node now has a chance to visit:

```txt id="v2m12m"
Timers
↓
Poll
↓
Check
```

repeatedly.

---

Connections are processed.

Requests are handled.

Server remains responsive.

---

# Visual Comparison

## process.nextTick

```txt id="zvjsz9"
nextTick
↓
nextTick
↓
nextTick
↓
nextTick

(event loop trapped)
```

---

## setImmediate

```txt id="mwh4d0"
Timers
↓
Poll
↓
Check
↓
recursive

Timers
↓
Poll
↓
Check
↓
recursive
```

---

Node keeps moving.

Nothing starves.

---

# Real World Lesson

Bad:

```ts
while (true) {
  doWork();
}
```

Bad:

```ts
process.nextTick(loop);
```

Bad:

```ts
Promise.resolve().then(loop);
```

These monopolize execution.

---

Better:

```ts
setImmediate(loop);
```

because it cooperates with the event loop.

---

# Why Node Core Uses setImmediate

When Node needs:

```txt id="xg1dlj"
Continue processing work
```

without blocking:

it often schedules future chunks using:

```ts
setImmediate(...)
```

instead of:

```ts
process.nextTick(...)
```

to avoid starvation.

---

# What You Should Remember

`process.nextTick()` is not an event-loop phase.

It is a priority queue that executes before Node continues.

If you continuously refill that queue, Node never reaches timers, I/O, or HTTP handling.

That is starvation.

`setImmediate()` schedules work for a future phase and allows the event loop to keep moving.

---

## Commit

```bash
git add .

git commit -m "feat(exercise-4b2): demonstrate event loop starvation

- reproduce starvation using recursive nextTick
- analyze blocked HTTP request handling
- replace nextTick with setImmediate
- demonstrate cooperative event loop scheduling
"
```

---
