# Exercise 4B.3 — Always Async

This exercise teaches one of the most important API design principles in Node.js:

> A callback should never sometimes be synchronous and sometimes asynchronous.

This is known as the:

```txt
Zalgo Problem
```

You'll hear experienced Node.js developers say:

```txt
Don't release Zalgo.
```

Meaning:

```txt
Don't create APIs that behave synchronously sometimes
and asynchronously other times.
```

---

# Why This Matters

Suppose you have this API:

```ts
getData(key, callback);
```

As a consumer, you want one predictable behavior.

Either:

```txt
Always synchronous
```

or

```txt
Always asynchronous
```

Mixing both creates bugs that are difficult to debug.

---

# Folder Structure

```txt
src/
└── 4b-3-always-async/
    ├── index.ts
    └── data.txt
```

---

# Step 1 — Create Test Data

## data.txt

```txt
Hello from file system
```

---

# Step 2 — Create the Broken Version

## index.ts

```ts
import { readFile } from "node:fs";

const cache: Record<string, string> = {};

/**
 * Retrieves data from cache or disk.
 *
 * BUG:
 * Cache hits are synchronous.
 * File reads are asynchronous.
 */
function getData(
  key: string,
  callback: (error: Error | null, data?: string) => void,
): void {
  if (cache[key]) {
    callback(null, cache[key]);

    return;
  }

  readFile(key, "utf8", (error, data) => {
    if (error) {
      callback(error);

      return;
    }

    cache[key] = data;

    callback(null, data);
  });
}

console.log("START");

getData("./src/4b-3-always-async/data.txt", (_error, data) => {
  console.log("CALLBACK:", data);
});

console.log("END");
```

---

# Prediction

First run.

Cache is empty.

What prints?

---

# Actual Output

```txt
START
END
CALLBACK: Hello from file system
```

Why?

Because:

```txt
readFile()
```

is asynchronous.

---

# Call Stack Visualization

```txt
START
↓
getData()
↓
readFile()
↓
END
↓
file finishes
↓
callback
```

Everything looks fine.

---

# Step 3 — Demonstrate The Bug

Now call the same function twice.

Replace the test code with:

```ts
console.log("FIRST REQUEST");

getData("./src/4b-3-always-async/data.txt", () => {
  console.log("FIRST CALLBACK");

  console.log("SECOND REQUEST");

  getData("./src/4b-3-always-async/data.txt", () => {
    console.log("SECOND CALLBACK");
  });

  console.log("AFTER SECOND REQUEST");
});
```

---

# Prediction

Think carefully.

The second request hits cache.

---

# Actual Output

```txt
FIRST REQUEST
FIRST CALLBACK
SECOND REQUEST
SECOND CALLBACK
AFTER SECOND REQUEST
```

Surprised?

Many people are.

---

# Why?

The second request found:

```ts
cache[key];
```

which executes:

```ts
callback(...)
```

immediately.

---

So execution becomes:

```txt
SECOND REQUEST
↓
getData()
↓
cache hit
↓
callback()
↓
SECOND CALLBACK
↓
AFTER SECOND REQUEST
```

The callback fires before the function caller finishes executing.

---

# The Bug

The callback order depends on:

```txt
Cache Miss
or
Cache Hit
```

That means:

```txt
Same API
Different Timing Behavior
```

Dangerous.

---

# This Is The Zalgo Problem

One path:

```txt
Async
```

Another path:

```txt
Sync
```

Same function.

Different timing.

---

# Step 4 — Create a Better Test

Replace the test code.

```ts
console.log("REQUEST");

let completed = false;

getData("./src/4b-3-always-async/data.txt", () => {
  console.log("CALLBACK");

  completed = true;
});

console.log("COMPLETED:", completed);
```

---

# Cache Miss Output

```txt
REQUEST
COMPLETED: false
CALLBACK
```

---

# Cache Hit Output

```txt
REQUEST
CALLBACK
COMPLETED: true
```

---

Same API.

Different behavior.

This is the bug.

---

# Step 5 — Fix Using process.nextTick

Update the cache path.

```ts
/**
 * Retrieves data from cache or disk.
 *
 * Always asynchronous.
 */
function getData(
  key: string,
  callback: (error: Error | null, data?: string) => void,
): void {
  if (cache[key]) {
    process.nextTick(() => {
      callback(null, cache[key]);
    });

    return;
  }

  readFile(key, "utf8", (error, data) => {
    if (error) {
      callback(error);

      return;
    }

    cache[key] = data;

    callback(null, data);
  });
}
```

---

# Why This Works

Instead of:

```txt
Cache Hit
↓
callback now
```

we do:

```txt
Cache Hit
↓
schedule nextTick
↓
return
↓
current stack finishes
↓
callback
```

Now both paths are asynchronous.

---

# Run Again

Output:

```txt
REQUEST
COMPLETED: false
CALLBACK
```

Cache miss.

---

Second run:

```txt
REQUEST
COMPLETED: false
CALLBACK
```

Cache hit.

---

Identical behavior.

Success.

---

# Event Loop Timeline

## Before Fix

Cache Miss

```txt
readFile
↓
future callback
```

Cache Hit

```txt
callback immediately
```

---

## After Fix

Cache Miss

```txt
future callback
```

Cache Hit

```txt
nextTick callback
```

Both occur after current execution completes.

---

# Why Not setTimeout(0)?

This would work:

```ts
setTimeout(() => {
  callback(null, cache[key]);
}, 0);
```

---

But it communicates the wrong intent.

We don't want:

```txt
Run later
```

We want:

```txt
Run immediately after current stack
```

That is exactly what `process.nextTick()` was designed for.

---

# Why Node Core Uses This Pattern

Many Node APIs guarantee:

```txt
Callbacks never fire synchronously.
```

Examples include:

- Streams
- Events
- DNS APIs
- Network APIs
- File APIs

This predictability prevents timing bugs.

---

# What You Should Remember

Bad API:

```txt
Sometimes sync
Sometimes async
```

Good API:

```txt
Always sync
```

or

```txt
Always async
```

Never mix both.

---
