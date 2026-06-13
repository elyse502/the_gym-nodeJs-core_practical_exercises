# Event Loop Visualizer Analysis

## Goal

The purpose of this exercise is to understand how Node.js schedules work across:

- Call Stack
- nextTick Queue
- Promise Microtask Queue
- Timers Queue
- Poll Phase
- Check Phase

Many developers memorize the event loop. The goal here is to understand why each line appears where it does.

---

# The Code

```ts
setTimeout(() => console.log("setTimeout 1"), 0);
setImmediate(() => console.log("setImmediate 1"));

process.nextTick(() => console.log("nextTick 1"));

Promise.resolve().then(() => console.log("Promise 1"));

fs.readFile("./users.json", () => console.log("fs.readFile done"));

process.nextTick(() => console.log("nextTick 2"));

Promise.resolve().then(() => console.log("Promise 2"));

setTimeout(() => console.log("setTimeout 2"), 0);
setImmediate(() => console.log("setImmediate 2"));

console.log("synchronous — main thread");
```

---

# Mental Model

When Node executes a script, two things happen:

1. The entire file runs synchronously from top to bottom.
2. Asynchronous work is registered into various queues.

Nothing asynchronous executes immediately.

Only the final `console.log()` executes during the first pass.

---

# Phase 1: Main Thread Execution

Node starts executing the file.

It encounters:

```ts
setTimeout(...)
```

The callback is registered inside the Timers Queue.

Nothing prints.

---

It encounters:

```ts
setImmediate(...)
```

The callback is registered for the Check Phase.

Nothing prints.

---

It encounters:

```ts
process.nextTick(...)
```

The callback is placed inside the nextTick Queue.

Nothing prints.

---

It encounters:

```ts
Promise.resolve().then(...)
```

The callback is placed inside the Promise Microtask Queue.

Nothing prints.

---

It encounters:

```ts
fs.readFile(...)
```

The file read operation is delegated to libuv.

Nothing prints.

---

Node continues registering work until reaching:

```ts
console.log("synchronous — main thread");
```

Output:

```console
synchronous — main thread
```

---

# What Happens Next?

The main script has finished.

Before Node enters the event loop phases, it performs special queue processing.

Priority order:

```txt
nextTick Queue
↓
Promise Microtask Queue
↓
Event Loop Phases
```

This priority is extremely important.

---

# Step 1: Drain nextTick Queue

Node executes:

```ts
nextTick 1
nextTick 2
```

Output:

```console
nextTick 1
nextTick 2
```

The queue is now empty.

---

# Step 2: Drain Promise Queue

Node executes:

```ts
Promise 1
Promise 2
```

Output:

```console
Promise 1
Promise 2
```

The queue is now empty.

---

# Step 3: Timers Phase

Node enters the Timers Phase.

The two zero-delay timers are ready.

Output:

```console
setTimeout 1
setTimeout 2
```

---

# Step 4: Poll Phase

Node checks for completed I/O operations.

At this moment the file read may or may not be finished.

In this run it was not ready yet.

Node continues.

---

# Step 5: Check Phase

Node executes all scheduled setImmediate callbacks.

Output:

```console
setImmediate 1
setImmediate 2
```

---

# Step 6: Poll Phase Again

The file read has now completed.

The callback becomes available.

Output:

```console
fs.readFile done
```

---

# Common Mistake #1

I thought nextTick runs after every phase.

This is not correct.

Many developers imagine:

```txt
Timers
↓
nextTick
↓
Poll
↓
nextTick
↓
Check
↓
nextTick
```

That is not what happened.

---

# Correct Mental Model

Node drains the nextTick queue whenever JavaScript execution returns control back to Node.

Examples:

```ts
process.nextTick(...)
```

inside:

- main script
- timer callback
- setImmediate callback
- I/O callback

When execution finishes, Node immediately drains nextTick callbacks before continuing.

---

# Why Did nextTick Run Only Once?

Because only two nextTick callbacks were scheduled.

Both were scheduled during the initial script execution.

Node drained them completely.

No additional nextTick callbacks were added later.

Therefore nothing else ran.

Think of it like:

```txt
main script
↓
nextTick queue exists
↓
drain queue completely
↓
continue
```

After the queue becomes empty, Node moves on.

It does not magically rerun old callbacks.

---

# Important Rule

Whenever Node finishes executing JavaScript and regains control:

1. Drain nextTick queue
2. Drain Promise queue
3. Continue event loop

This rule applies repeatedly throughout the application's lifetime.

---

# Current Mental Model

Priority from highest to lowest:

```txt
Call Stack

↓

process.nextTick()

↓

Promise.then()
queueMicrotask()

↓

Timers
(setTimeout)

↓

Poll
(I/O callbacks)

↓

Check
(setImmediate)

↓

Close Callbacks
```

If you remember only one thing from this exercise, remember this ordering.

Most event loop interview questions come down to understanding this priority chain.

---

# Key Takeaway

The most important lesson is not where each line appeared.

The most important lesson is understanding that `process.nextTick()` is a special queue with higher priority than Promises and higher priority than every event-loop phase.

Node always empties the nextTick queue before moving forward.
