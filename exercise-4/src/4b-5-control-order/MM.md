Excellent.

Exercise 4B.5 is the culmination of everything you've learned so far.

Here we're no longer learning individual APIs. We're learning how to reason about priorities and queues.

---

# Exercise 4B.5 — Control the Order Without Moving the Lines

## Problem

You are given:

```ts
console.log("A"); // must print 3rd
console.log("B"); // must print 1st
console.log("C"); // must print 4th
console.log("D"); // must print 2nd
```

You are not allowed to reorder the four lines.

You may only wrap them with:

- `process.nextTick()`
- `Promise.resolve().then()`
- `setImmediate()`
- `setTimeout(...,0)`

Target:

```txt
B
D
A
C
```

---

# Step 1 — Think in Queues

We need:

| Position | Letter |
| -------- | ------ |
| 1        | B      |
| 2        | D      |
| 3        | A      |
| 4        | C      |

Which mechanism has the highest priority?

In your environment (Node v24.13):

```txt
Promise queue
↓
nextTick queue
↓
Timers
↓
Check phase
```

From your experiments:

- Promise callbacks execute before nextTick.
- Timers execute before setImmediate.

---

# Step 2 — Assign Priorities

### B must be first

Use:

```ts
Promise.resolve().then(...)
```

---

### D must be second

Use:

```ts
process.nextTick(...)
```

---

### A must be third

Use:

```ts
setTimeout(...,0)
```

---

### C must be fourth

Use:

```ts
setImmediate(...)
```

---

# Solution

Create:

```txt
src/4b-5-control-order/index.ts
```

```ts
/**
 * Demonstrates queue priorities.
 */

setTimeout(() => {
  console.log("A");
}, 0);

Promise.resolve().then(() => {
  console.log("B");
});

setImmediate(() => {
  console.log("C");
});

process.nextTick(() => {
  console.log("D");
});
```

---

# Prediction

Based on your runtime:

```txt
B
D
A
C
```

---

# Run

Verify:

```bash
npx tsx src/4b-5-control-order/index.ts
```

---

# Event Loop Visualization

Initial script:

Registers:

```txt
Promise(B)
nextTick(D)
Timer(A)
Immediate(C)
```

Queues become:

```txt
Promise queue:
[B]

nextTick queue:
[D]

Timers:
[A]

Check phase:
[C]
```

Execution:

```txt
B
↓
D
↓
A
↓
C
```

---

# Can Every Ordering Be Achieved?

Interesting question.

Suppose we want:

```txt
A
C
B
D
```

Can we?

No.

Why?

Because queue priorities impose constraints.

If Promise callbacks always execute before timers in your environment, then:

```txt
Timer
before
Promise
```

becomes impossible.

The event loop gives freedom, but not unlimited freedom.

Think of it like a railway network.

You choose which train to board, but the tracks already exist.

---

# Experiment 1

Try:

```ts
setTimeout(() => console.log("A"), 0);

Promise.resolve().then(() => console.log("B"));

process.nextTick(() => console.log("C"));

setImmediate(() => console.log("D"));
```

Observe:

```txt
B
C
A
D
```

---

# Experiment 2

Now put scheduling inside callbacks:

```ts
setTimeout(() => {
  console.log("A");

  process.nextTick(() => {
    console.log("B");
  });
}, 0);

setImmediate(() => {
  console.log("C");
});
```

Prediction?

You should expect:

```txt
A
B
C
```

because after the timer callback finishes, Node drains microtasks before moving to the check phase.

---

# Biggest Lesson From Exercise 4

Stop memorizing:

```txt
nextTick > Promise > timeout > immediate
```

Instead ask:

1. Which queue is this callback entering?
2. When is that queue drained?
3. What phase am I currently in?
4. Will new microtasks be created during callback execution?

Those four questions solve almost every event-loop interview problem.

---

At this point Exercise 4 is complete.

I would strongly recommend something different before moving to Exercise 5.

Exercise 4 is dense. There are at least 15 concepts hidden inside it.

I would spend one session building an Anki deck from these exercises:

- Call stack
- Microtasks
- Promise queue
- nextTick queue
- Timers phase
- Poll phase
- Check phase
- setImmediate
- Starvation
- Zalgo problem
- Always async pattern
- EventEmitter timing
- Background scheduling
- Queue priorities
- Event-loop constraints

These concepts appear repeatedly in Node.js internals, streams, Express, Socket.IO, workers, clustering, and interviews.
