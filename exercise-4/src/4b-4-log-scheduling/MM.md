Excellent.

Now we arrive at the exercise that ties everything together.

Exercise 4B.4 is not about making something work.

All three solutions will work.

The question is:

> Which scheduling mechanism communicates the correct intent and cooperates best with the event loop?

This is the type of decision senior engineers make every day.

---

# Exercise 4B.4 — Schedule Log Writes Correctly

## Learning Goals

Understand:

- Real-world scheduling decisions
- Response lifecycle
- Background work
- `nextTick` vs `setImmediate` vs `setTimeout`
- Why "working" and "correct" are different things
- Event-loop friendly design

---

# Problem Statement

After every HTTP response:

```ts id="0ffvcp"
res.end("ok");
```

you want to write analytics data.

Requirements:

```txt id="6e6l7u"
✓ Response already sent

✓ Log write is not urgent

✓ Should not delay future requests

✓ Should not starve the event loop
```

---

# Folder Structure

```txt id="u7j9m0"
src/
└── 4b-4-log-scheduling/
    ├── server.ts
    ├── send20.ts
    ├── analytics.log
    └── helpers/
        └── logger.ts
```

Notice the separation of concerns.

---

# Step 1 — Create Logger Utility

## helpers/logger.ts

```ts id="0ix8kf"
import { appendFile } from "node:fs/promises";
import path from "node:path";

const LOG_FILE = path.resolve("src/4b-4-log-scheduling/analytics.log");

/**
 * Appends an analytics entry to disk.
 */
export async function writeLog(message: string): Promise<void> {
  await appendFile(LOG_FILE, `${message}\n`);
}
```

---

# Commit

```bash id="5jw7z6"
git add .

git commit -m "feat(exercise-4b4): create analytics logging utility

- add reusable file logger
- implement async append operation
- isolate logging concerns
"
```

---

# Step 2 — Build Baseline Server

## server.ts

```ts id="7q3i6n"
import http from "node:http";

/**
 * Simple analytics test server.
 */
const server = http.createServer((_req, res) => {
  res.end("ok");
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
```

---

# Step 3 — Create Load Generator

## send20.ts

```ts id="yjryok"
import http from "node:http";

/**
 * Sends a single request.
 */
function request(): Promise<number> {
  return new Promise((resolve) => {
    http.get("http://localhost:3000", (res) => {
      resolve(res.statusCode ?? 0);
    });
  });
}

Promise.all(Array.from({ length: 20 }, request)).then((results) => {
  console.log("all done:", results);
});
```

---

# Commit

```bash id="q8v9k4"
git add .

git commit -m "feat(exercise-4b4): add load testing utility

- create concurrent request generator
- simulate analytics workload
- prepare scheduling comparison
"
```

---

# Step 4 — Version 1 (process.nextTick)

Add logging.

## server.ts

```ts id="n57wnx"
import http from "node:http";
import { writeLog } from "./helpers/logger.js";

const server = http.createServer((_req, res) => {
  res.end("ok");

  process.nextTick(async () => {
    await writeLog(`nextTick ${Date.now()}`);
  });
});

server.listen(3000);
```

---

# Run

Terminal 1:

```bash id="azjxx7"
npm run dev
```

Terminal 2:

```bash id="vtawti"
npx tsx src/4b-4-log-scheduling/send20.ts
```

---

# Observe

Check:

```txt id="s1b9z8"
analytics.log
```

Questions:

```txt id="hkgpud"
Are all 20 entries present?

Do timestamps look ordered?

Does server remain responsive?
```

---

# Important Analysis

This works.

But there is a design problem.

---

Every request now schedules:

```txt id="gz4pc5"
High Priority Work
```

using:

```ts id="7clxqz"
process.nextTick();
```

---

Remember:

```txt id="tbtv5u"
nextTick
```

runs before Node continues.

---

Analytics are not urgent.

Yet we're treating them like urgent work.

Wrong priority.

---

# Step 5 — Version 2 (setTimeout)

Replace:

```ts id="gqq6cc"
process.nextTick(...)
```

with:

```ts id="1s6jlwm"
setTimeout(async () => {
  await writeLog(`setTimeout ${Date.now()}`);
}, 0);
```

---

Run again.

Observe log.

---

# Analysis

This also works.

But now we introduced:

```txt id="lmj7o0"
Timer scheduling
```

for no reason.

---

Node must:

```txt id="gkkrl7"
register timer
↓
wait
↓
timers phase
↓
execute callback
```

---

There is no actual delay requirement.

So:

```txt id="t0dpkf"
setTimeout()
```

communicates the wrong intention.

---

# Step 6 — Version 3 (setImmediate)

Replace with:

```ts id="qvlv1e"
setImmediate(async () => {
  await writeLog(`setImmediate ${Date.now()}`);
});
```

---

Run again.

Observe logs.

---

# Why This Is Different

The response has already been sent.

We want:

```txt id="0gof9f"
Finish current request
↓
Handle other I/O
↓
Perform analytics work
```

---

This matches:

```txt id="nybcme"
Check Phase
```

perfectly.

---

`setImmediate()` literally means:

```txt id="dg0y8w"
Run soon,
but not before Node has had
a chance to continue its work.
```

---

# Which One Is Correct?

## process.nextTick

Works?

```txt id="nqwsd5"
Yes
```

Correct?

```txt id="p1s6g8"
No
```

Why?

Analytics are not urgent.

---

## setTimeout

Works?

```txt id="m17r0o"
Yes
```

Correct?

```txt id="dx95f3"
Not really
```

Why?

Timer semantics do not match intent.

---

## setImmediate

Works?

```txt id="y7fobg"
Yes
```

Correct?

```txt id="97s6x3"
Yes
```

Why?

Background work after I/O is exactly what `setImmediate()` was designed for.

---

# Real-World Example

Common uses of:

```ts id="pkob5x"
setImmediate();
```

include:

- Metrics collection
- Analytics
- Audit logging
- Background cleanup
- Post-response processing

---

# Event Loop View

## nextTick

```txt id="jlwm3w"
Response Sent
↓
nextTick
↓
log write
↓
continue
```

Too aggressive.

---

## setTimeout

```txt id="0xjdtl"
Response Sent
↓
timer registration
↓
timers phase
↓
log write
```

Unnecessary timer.

---

## setImmediate

```txt id="5djlwm"
Response Sent
↓
poll phase
↓
check phase
↓
log write
```

Perfect fit.

---

# Senior Engineer Mental Model

When choosing scheduling:

Ask:

```txt id="vhkq1x"
How urgent is this work?
```

Not:

```txt id="5dcbdd"
Which API makes it run?
```

---

## Before Moving to 4B.5

Answer this prediction question:

Given:

```ts id="3jlwmc"
setTimeout(() => console.log("timeout"));

setImmediate(() => console.log("immediate"));
```

What prints first?

```txt id="9d2q6d"
timeout ?
immediate ?
```

Do not run it.

Write your prediction first.

The answer depends on where the code executes, and that insight is the foundation of Exercise 4B.5.
