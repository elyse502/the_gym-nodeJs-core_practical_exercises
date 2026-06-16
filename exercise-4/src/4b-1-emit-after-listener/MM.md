Perfect. Let's move to Exercise 4B.1.

This is the first place where `process.nextTick()` solves a real engineering problem instead of being a trivia question.

---

# Exercise 4B.1 — Emit After the Listener Is Registered

## Goal

Understand:

- Why some events are missed
- How `EventEmitter` works internally
- Why `process.nextTick()` exists
- When `nextTick()` is preferable to `setTimeout(0)`

---

# Step 1 — Create the Failing Example

## Structure

```txt id="g54k3f"
src/
└── 4b-1-emit-after-listener/
    └── index.ts
```

---

## index.ts

```ts
import { EventEmitter } from "node:events";

/**
 * Simulates a component that loads data
 * and emits a ready event.
 */
class DataLoader extends EventEmitter {
  /**
   * Loads data and immediately emits.
   */
  load(): void {
    this.emit("ready", {
      data: "loaded",
    });
  }
}

const loader = new DataLoader();

loader.load();

loader.on("ready", (result) => {
  console.log("got:", result);
});
```

---

## Prediction

Question:

When does the listener get registered?

```txt id="o1ol0g"
1. loader.load()
2. loader.on(...)
```

The event fires before the listener exists.

---

## Actual Output

```txt id="i7j2i2"

```

Nothing prints.

---

# Why?

Let's trace the call stack.

---

## Step 1

```ts
loader.load();
```

---

## Step 2

Inside load:

```ts
this.emit("ready");
```

---

## Step 3

Node asks:

```txt id="7x5hz4"
Who is listening for "ready"?
```

Answer:

```txt id="mn8v6s"
Nobody.
```

---

## Step 4

Event disappears.

`EventEmitter` does not store past events.

It does not replay events.

It simply notifies listeners that exist right now.

---

## Step 5

Later:

```ts
loader.on(...)
```

Listener gets registered.

Too late.

The event is already gone.

---

# Mental Model

Think of EventEmitter as:

```txt id="xdkv7u"
Radio Broadcast
```

If your radio is off:

```txt id="q65f3d"
broadcast happens
```

you miss it.

---

It is NOT:

```txt id="65bgm0"
Netflix
```

where you watch later.

---

# Step 2 — Fix Using process.nextTick

Now change `load()`.

```ts
import { EventEmitter } from "node:events";

/**
 * Demonstrates deferred event emission.
 */
class DataLoader extends EventEmitter {
  /**
   * Loads data.
   *
   * The event is emitted after
   * the current call stack completes.
   */
  load(): void {
    process.nextTick(() => {
      this.emit("ready", {
        data: "loaded",
      });
    });
  }
}

const loader = new DataLoader();

loader.load();

loader.on("ready", (result) => {
  console.log("got:", result);
});
```

---

## Prediction

Execution:

```txt id="m55wtl"
load()
↓
schedule nextTick
↓
register listener
↓
call stack finishes
↓
run nextTick
↓
emit event
↓
listener exists
```

---

## Output

```txt id="3q4tjk"
got: { data: 'loaded' }
```

Success.

---

# Why Did nextTick Fix It?

Because:

```ts
process.nextTick(...)
```

does NOT execute immediately.

It schedules work.

---

Current call stack:

```txt id="fuc8kw"
load()
↓
register listener
```

finishes first.

Only then:

```txt id="hvhudj"
nextTick callback
```

runs.

---

By then:

```txt id="e1l8qi"
listener exists
```

---

# Visual Timeline

Without nextTick:

```txt id="91k72n"
load()
↓
emit()
↓
no listeners
↓
event lost
↓
register listener
```

---

With nextTick:

```txt id="xojqhy"
load()
↓
schedule emit
↓
register listener
↓
call stack ends
↓
emit()
↓
listener receives event
```

---

# Could setTimeout(0) Also Work?

Yes.

```ts
setTimeout(() => {
  this.emit("ready");
}, 0);
```

also works.

---

Timeline:

```txt id="ay3bxm"
load()
↓
schedule timer
↓
register listener
↓
timers phase
↓
emit()
```

Listener receives event.

---

# Then Why Use nextTick?

Because the intention matters.

We are NOT saying:

```txt id="dtjlwm"
Run this later.
```

We are saying:

```txt id="g1x0kq"
Run this immediately after the current work finishes.
```

Those are different meanings.

---

# setTimeout(0)

Means:

```txt id="d9xv8j"
Wait until a future event-loop phase.
```

---

# nextTick

Means:

```txt id="bskxsp"
Run as soon as possible
after the current stack.
```

---

# Which Is Better Here?

Use:

```ts
process.nextTick(...)
```

because:

- Lower latency
- Expresses intent
- Common Node.js pattern
- Used throughout Node core APIs

---

# Real-World Example

Node internally does this frequently.

Consider:

```ts
someApi(callback);
```

Node often guarantees:

```txt id="w6hn0k"
callbacks never fire
before your code finishes registering handlers
```

using exactly this pattern.

---

# Commit

```bash
git add .

git commit -m "feat(exercise-4b1): defer event emission with nextTick

- reproduce missed event scenario
- implement deferred emission strategy
- ensure listeners receive events consistently
- demonstrate nextTick scheduling behavior
"
```

---

# Before Moving To 4B.2

Experiment.

Replace:

```ts
process.nextTick(...)
```

with:

```ts
setImmediate(...)
```

Then:

```ts
setTimeout(..., 0)
```

Observe:

- Do both still work?
- Which feels most appropriate?
- Why?

Once you've done that, we'll move to 4B.2, which demonstrates one of the most dangerous mistakes in Node.js: event-loop starvation caused by recursive `process.nextTick()`.
